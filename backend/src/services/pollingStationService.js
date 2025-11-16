const pool = require('../config/database');

/**
 * Polling Station Service
 * Manages polling stations and voter assignment
 */
class PollingStationService {
  /**
   * Create polling station
   */
  async createStation(stationData) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.query(
        `INSERT INTO polling_stations 
         (station_code, station_name, address, district, state, pin_code, latitude, longitude, capacity) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          stationData.station_code,
          stationData.station_name,
          stationData.address,
          stationData.district,
          stationData.state,
          stationData.pin_code,
          stationData.latitude || null,
          stationData.longitude || null,
          stationData.capacity || 1000
        ]
      );
      return await this.getStationById(result.insertId);
    } finally {
      connection.release();
    }
  }

  /**
   * Get station by ID
   */
  async getStationById(stationId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        'SELECT * FROM polling_stations WHERE station_id = ?',
        [stationId]
      );
      return rows[0] || null;
    } finally {
      connection.release();
    }
  }

  /**
   * Find nearest polling station for an address
   */
  async findNearestStation(district, state, pinCode) {
    const connection = await pool.getConnection();
    try {
      // Normalize inputs (case-insensitive, trim whitespace)
      const normalizedDistrict = district?.trim();
      const normalizedState = state?.trim();
      const normalizedPinCode = pinCode?.trim();

      if (!normalizedDistrict || !normalizedState) {
        throw new Error('District and state are required');
      }

      // First try exact match with PIN code (if provided)
      if (normalizedPinCode && normalizedPinCode.length === 6) {
        let [rows] = await connection.query(
          `SELECT *, 
           CASE 
             WHEN pin_code = ? THEN 1
             WHEN district = ? AND state = ? THEN 2
             ELSE 3
           END as match_priority
           FROM polling_stations 
           WHERE (pin_code = ? OR (district LIKE ? AND state LIKE ?))
           ORDER BY match_priority, station_name
           LIMIT 5`,
          [
            normalizedPinCode,
            normalizedDistrict, normalizedState,
            normalizedPinCode,
            `%${normalizedDistrict}%`, `%${normalizedState}%`
          ]
        );

        if (rows.length > 0) {
          return { station: rows[0], alternatives: rows.slice(1) };
        }
      }

      // Fallback to district and state match (case-insensitive)
      let [rows] = await connection.query(
        `SELECT * FROM polling_stations 
         WHERE LOWER(district) LIKE LOWER(?) AND LOWER(state) LIKE LOWER(?)
         ORDER BY station_name
         LIMIT 5`,
        [`%${normalizedDistrict}%`, `%${normalizedState}%`]
      );

      if (rows.length > 0) {
        return { station: rows[0], alternatives: rows.slice(1) };
      }

      // Last resort: state-only match
      [rows] = await connection.query(
        `SELECT * FROM polling_stations 
         WHERE LOWER(state) LIKE LOWER(?)
         ORDER BY station_name
         LIMIT 5`,
        [`%${normalizedState}%`]
      );

      if (rows.length > 0) {
        return { station: rows[0], alternatives: rows.slice(1) };
      }

      return null;
    } finally {
      connection.release();
    }
  }

  /**
   * Assign polling station to voter
   */
  async assignStationToVoter(voterId, stationId) {
    const connection = await pool.getConnection();
    try {
      await connection.query(
        'UPDATE voters SET polling_station_id = ? WHERE voter_id = ?',
        [stationId, voterId]
      );
      return { success: true };
    } finally {
      connection.release();
    }
  }

  /**
   * Get all stations
   */
  async getAllStations(page = 1, limit = 1000, filters = {}) {
    const connection = await pool.getConnection();
    try {
      const offset = (page - 1) * limit;
      let query = 'SELECT * FROM polling_stations WHERE 1=1';
      const params = [];

      if (filters.district) {
        query += ' AND LOWER(district) LIKE LOWER(?)';
        params.push(`%${filters.district}%`);
      }

      if (filters.state) {
        query += ' AND LOWER(state) LIKE LOWER(?)';
        params.push(`%${filters.state}%`);
      }

      query += ' ORDER BY station_name LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const [rows] = await connection.query(query, params);
      
      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) as total FROM polling_stations WHERE 1=1';
      const countParams = [];
      if (filters.district) {
        countQuery += ' AND LOWER(district) LIKE LOWER(?)';
        countParams.push(`%${filters.district}%`);
      }
      if (filters.state) {
        countQuery += ' AND LOWER(state) LIKE LOWER(?)';
        countParams.push(`%${filters.state}%`);
      }
      
      const [countRows] = await connection.query(countQuery, countParams);

      return {
        stations: rows,
        pagination: {
          page,
          limit,
          total: countRows[0].total,
          totalPages: Math.ceil(countRows[0].total / limit)
        }
      };
    } finally {
      connection.release();
    }
  }

  /**
   * Get voter count per station
   */
  async getStationVoterCount(stationId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        'SELECT COUNT(*) as count FROM voters WHERE polling_station_id = ?',
        [stationId]
      );
      return rows[0].count;
    } finally {
      connection.release();
    }
  }
}

module.exports = new PollingStationService();

