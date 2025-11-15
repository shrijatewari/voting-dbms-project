/**
 * Data Import Service
 * Handles bulk CSV imports with preview, deduplication, and validation
 */

const pool = require('../config/database');
const stringMatching = require('../utils/stringMatching');
const { Readable } = require('stream');

// Simple CSV parser (since csv-parser may not be installed)
function parseCSV(csvText) {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || null;
    });
    rows.push(row);
  }
  
  return rows;
}

class DataImportService {
  /**
   * Parse CSV and create preview
   */
  async parseCSVPreview(csvData, mapping) {
    try {
      const csvText = typeof csvData === 'string' ? csvData : csvData.toString();
      const parsedRows = parseCSV(csvText);
      
      // Map CSV columns to database fields
      const results = parsedRows.map(row => {
        const mappedRow = {};
        for (const [dbField, csvColumn] of Object.entries(mapping)) {
          mappedRow[dbField] = row[csvColumn] || null;
        }
        return mappedRow;
      });
      
      return results;
    } catch (error) {
      throw new Error('CSV parsing failed: ' + error.message);
    }
  }

  /**
   * Create import record with preview
   */
  async createImport(importData) {
    const connection = await pool.getConnection();
    try {
      const { filename, mapping, csv_data, created_by, preview = true } = importData;
      
      let previewData = null;
      let totalRecords = 0;
      
      if (preview && csv_data) {
        // Parse first 100 rows for preview
        const allRows = await this.parseCSVPreview(csv_data, mapping);
        totalRecords = allRows.length;
        previewData = allRows.slice(0, 100); // Preview first 100 rows
      }
      
      const [result] = await connection.query(
        `INSERT INTO data_imports 
         (filename, mapping, total_records, preview_data, status, created_by)
         VALUES (?, ?, ?, ?, 'preview', ?)`,
        [
          filename,
          JSON.stringify(mapping),
          totalRecords,
          JSON.stringify(previewData),
          created_by
        ]
      );
      
      return await this.getImportById(result.insertId);
    } finally {
      connection.release();
    }
  }

  /**
   * Run deduplication on import data
   */
  async runDedupeOnImport(importId, options = {}) {
    const connection = await pool.getConnection();
    try {
      const importRecord = await this.getImportById(importId);
      if (!importRecord) {
        throw new Error('Import not found');
      }
      
      const { threshold = 0.85, algorithms = ['name_phonetic', 'name_fuzzy', 'dob'] } = options;
      const previewData = JSON.parse(importRecord.preview_data || '[]');
      
      const duplicates = [];
      const checkedPairs = new Set();
      
      // Check duplicates within import data
      for (let i = 0; i < previewData.length; i++) {
        for (let j = i + 1; j < previewData.length; j++) {
          const pairKey = `${Math.min(i, j)}-${Math.max(i, j)}`;
          if (checkedPairs.has(pairKey)) continue;
          checkedPairs.add(pairKey);
          
          const similarity = stringMatching.voterSimilarity(previewData[i], previewData[j], {
            name: 0.4,
            dob: 0.3,
            address: 0.3
          });
          
          if (similarity >= threshold) {
            duplicates.push({
              row_1: i + 1,
              row_2: j + 1,
              similarity_score: similarity,
              data_1: previewData[i],
              data_2: previewData[j]
            });
          }
        }
      }
      
      // Check against existing voters in database
      const existingDuplicates = [];
      for (const row of previewData) {
        if (row.aadhaar_number) {
          const [existing] = await connection.query(
            'SELECT voter_id, name, aadhaar_number FROM voters WHERE aadhaar_number = ?',
            [row.aadhaar_number]
          );
          
          if (existing.length > 0) {
            existingDuplicates.push({
              import_row: row,
              existing_voter: existing[0],
              match_type: 'aadhaar_exact'
            });
          }
        }
      }
      
      // Update import record
      await connection.query(
        `UPDATE data_imports 
         SET duplicate_records = ?, status = 'processing'
         WHERE import_id = ?`,
        [duplicates.length + existingDuplicates.length, importId]
      );
      
      return {
        import_id: importId,
        internal_duplicates: duplicates.length,
        existing_duplicates: existingDuplicates.length,
        total_duplicates: duplicates.length + existingDuplicates.length,
        duplicate_details: {
          internal: duplicates,
          existing: existingDuplicates
        }
      };
    } finally {
      connection.release();
    }
  }

  /**
   * Commit import after manual review
   */
  async commitImport(importId, options = {}) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const importRecord = await this.getImportById(importId);
      if (!importRecord) {
        throw new Error('Import not found');
      }
      
      const { skip_duplicates = true, update_existing = false } = options;
      const mapping = JSON.parse(importRecord.mapping);
      
      // In production, re-parse full CSV
      // For now, use preview data
      const previewData = JSON.parse(importRecord.preview_data || '[]');
      
      let imported = 0;
      let errors = [];
      let skipped = 0;
      
      for (const row of previewData) {
        try {
          // Check if voter already exists
          if (row.aadhaar_number) {
            const [existing] = await connection.query(
              'SELECT voter_id FROM voters WHERE aadhaar_number = ?',
              [row.aadhaar_number]
            );
            
            if (existing.length > 0) {
              if (skip_duplicates) {
                skipped++;
                continue;
              } else if (update_existing) {
                // Update existing voter
                await connection.query(
                  `UPDATE voters SET name = ?, dob = ? WHERE voter_id = ?`,
                  [row.name, row.dob, existing[0].voter_id]
                );
                imported++;
                continue;
              }
            }
          }
          
          // Insert new voter
          await connection.query(
            `INSERT INTO voters (name, dob, aadhaar_number, is_verified)
             VALUES (?, ?, ?, FALSE)`,
            [row.name, row.dob, row.aadhaar_number]
          );
          
          imported++;
        } catch (error) {
          errors.push({
            row: row,
            error: error.message
          });
        }
      }
      
      // Update import status
      await connection.query(
        `UPDATE data_imports 
         SET imported_records = ?, error_records = ?, status = 'completed', committed_at = NOW()
         WHERE import_id = ?`,
        [imported, errors.length, importId]
      );
      
      await connection.commit();
      
      return {
        import_id: importId,
        imported,
        skipped,
        errors: errors.length,
        error_details: errors
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Rollback import
   */
  async rollbackImport(importId) {
    const connection = await pool.getConnection();
    try {
      await connection.query(
        'UPDATE data_imports SET status = ? WHERE import_id = ?',
        ['rolled-back', importId]
      );
      
      return { success: true, import_id: importId };
    } finally {
      connection.release();
    }
  }

  /**
   * Get import by ID
   */
  async getImportById(importId) {
    const connection = await pool.getConnection();
    try {
      const [imports] = await connection.query(
        'SELECT * FROM data_imports WHERE import_id = ?',
        [importId]
      );
      
      if (imports[0]) {
        imports[0].mapping = JSON.parse(imports[0].mapping || '{}');
        imports[0].preview_data = JSON.parse(imports[0].preview_data || '[]');
      }
      
      return imports[0] || null;
    } finally {
      connection.release();
    }
  }

  /**
   * Get all imports
   */
  async getAllImports(page = 1, limit = 10) {
    const connection = await pool.getConnection();
    try {
      const offset = (page - 1) * limit;
      const [imports] = await connection.query(
        'SELECT * FROM data_imports ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [limit, offset]
      );
      
      const [count] = await connection.query('SELECT COUNT(*) as total FROM data_imports');
      
      return {
        imports: imports.map(i => ({
          ...i,
          mapping: JSON.parse(i.mapping || '{}'),
          preview_data: JSON.parse(i.preview_data || '[]')
        })),
        pagination: {
          page,
          limit,
          total: count[0].total,
          totalPages: Math.ceil(count[0].total / limit)
        }
      };
    } finally {
      connection.release();
    }
  }
}

module.exports = new DataImportService();

