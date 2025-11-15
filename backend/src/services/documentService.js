const pool = require('../config/database');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

/**
 * Document Service
 * Handles secure document storage with encryption
 */
class DocumentService {
  constructor() {
    this.uploadDir = path.join(__dirname, '../../uploads/documents');
    this.encryptionKey = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
  }

  async ensureUploadDir() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  /**
   * Encrypt file content
   */
  async encryptFile(fileBuffer) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    const encrypted = Buffer.concat([cipher.update(fileBuffer), cipher.final()]);
    return {
      encrypted: encrypted,
      iv: iv.toString('hex')
    };
  }

  /**
   * Decrypt file content
   */
  async decryptFile(encryptedBuffer, ivHex) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    
    return Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
  }

  /**
   * Upload and encrypt document
   */
  async uploadDocument(voterId, documentType, fileBuffer, fileName, mimeType) {
    await this.ensureUploadDir();
    
    const connection = await pool.getConnection();
    try {
      // Generate unique filename
      const fileExt = path.extname(fileName);
      const uniqueFileName = `${voterId}_${Date.now()}_${crypto.randomBytes(8).toString('hex')}${fileExt}`;
      const filePath = path.join(this.uploadDir, uniqueFileName);

      // Encrypt file
      const { encrypted, iv } = await this.encryptFile(fileBuffer);
      
      // Save encrypted file
      await fs.writeFile(filePath, encrypted);
      
      // Store in database
      const [result] = await connection.query(
        `INSERT INTO voter_documents 
         (voter_id, document_type, document_name, file_path, encrypted_path, file_size, mime_type) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          voterId,
          documentType,
          fileName,
          filePath,
          iv, // Store IV for decryption
          fileBuffer.length,
          mimeType
        ]
      );

      return {
        document_id: result.insertId,
        file_path: filePath,
        encrypted: true
      };
    } finally {
      connection.release();
    }
  }

  /**
   * Get document (decrypted)
   */
  async getDocument(documentId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        'SELECT * FROM voter_documents WHERE document_id = ?',
        [documentId]
      );

      if (rows.length === 0) {
        return null;
      }

      const doc = rows[0];
      
      // Read and decrypt file
      const encryptedBuffer = await fs.readFile(doc.file_path);
      const decryptedBuffer = await this.decryptFile(encryptedBuffer, doc.encrypted_path);

      return {
        ...doc,
        file_content: decryptedBuffer,
        decrypted: true
      };
    } finally {
      connection.release();
    }
  }

  /**
   * Get all documents for a voter
   */
  async getVoterDocuments(voterId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        'SELECT document_id, document_type, document_name, file_size, mime_type, uploaded_at FROM voter_documents WHERE voter_id = ? ORDER BY uploaded_at DESC',
        [voterId]
      );
      return rows;
    } finally {
      connection.release();
    }
  }

  /**
   * Delete document
   */
  async deleteDocument(documentId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        'SELECT file_path FROM voter_documents WHERE document_id = ?',
        [documentId]
      );

      if (rows.length > 0) {
        // Delete file
        try {
          await fs.unlink(rows[0].file_path);
        } catch (error) {
          // File might not exist
        }
      }

      await connection.query('DELETE FROM voter_documents WHERE document_id = ?', [documentId]);
      return { success: true };
    } finally {
      connection.release();
    }
  }
}

module.exports = new DocumentService();

