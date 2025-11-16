const pool = require('../config/database');
const fs = require('fs').promises;
const path = require('path');

/**
 * EPIC Service
 * Generates and manages Electors Photo Identity Card (EPIC)
 */
class EPICService {
  /**
   * Get EPIC details
   */
  async getEPICDetails(epicNumber) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT v.*, ps.station_name, ps.address as station_address 
         FROM voters v
         LEFT JOIN polling_stations ps ON v.polling_station_id = ps.station_id
         WHERE v.epic_number = ?`,
        [epicNumber]
      );

      if (!rows[0]) {
        return null;
      }

      const voter = rows[0];

      if (!voter.epic_number) {
        voter.epic_number = await this.assignEPICNumber(connection, voter);
      }

      voter.address = this.formatAddress(voter);
      voter.polling_station = voter.station_name;
      voter.aadhaar_masked = this.maskAadhaar(voter.aadhaar_number);
      return voter;
    } finally {
      connection.release();
    }
  }

  /**
   * Generate EPIC PDF (mock - in production use PDF library like pdfkit or puppeteer)
   */
  async generateEPICPDF(voterId) {
    const connection = await pool.getConnection();
    try {
      const [voters] = await connection.query(
        `SELECT v.*, ps.station_name, ps.address as station_address 
         FROM voters v
         LEFT JOIN polling_stations ps ON v.polling_station_id = ps.station_id
         WHERE v.voter_id = ?`,
        [voterId]
      );

      if (voters.length === 0) {
        throw new Error('Voter not found');
      }

      const voter = voters[0];
      
      if (!voter.epic_number) {
        voter.epic_number = await this.assignEPICNumber(connection, voter);
      }

      // In production, use pdfkit or puppeteer to generate PDF
      // For now, return JSON data that frontend can use to generate PDF
      return {
        epic_number: voter.epic_number,
        name: voter.name,
        father_name: voter.father_name,
        dob: voter.dob,
        gender: voter.gender,
        address: this.formatAddress(voter),
        polling_station: voter.station_name,
        polling_station_address: voter.station_address,
        aadhaar_masked: this.maskAadhaar(voter.aadhaar_number),
        qr_data: JSON.stringify({
          epic: voter.epic_number,
          voter_id: voter.voter_id,
          aadhaar: voter.aadhaar_number
        })
      };
    } finally {
      connection.release();
    }
  }

  /**
   * Format address for EPIC
   */
  formatAddress(voter) {
    const parts = [];
    if (voter.house_number) parts.push(voter.house_number);
    if (voter.street) parts.push(voter.street);
    if (voter.village_city) parts.push(voter.village_city);
    if (voter.district) parts.push(voter.district);
    if (voter.state) parts.push(voter.state);
    if (voter.pin_code) parts.push(`PIN: ${voter.pin_code}`);
    return parts.join(', ');
  }

  /**
   * Mask Aadhaar number
   */
  maskAadhaar(aadhaar) {
    if (!aadhaar || aadhaar.length !== 12) return aadhaar;
    return `XXXX-XXXX-${aadhaar.substring(8)}`;
  }

  /**
   * Download EPIC as PDF
   */
  async downloadEPIC(epicNumber) {
    const epicData = await this.getEPICDetails(epicNumber);
    if (!epicData) {
      throw new Error('EPIC not found');
    }
    return await this.generateEPICPDF(epicData.voter_id);
  }

  /**
   * Assign EPIC number if missing
   */
  async assignEPICNumber(connection, voter) {
    const epicNumber = this.buildEPICNumber(voter);
    await connection.query('UPDATE voters SET epic_number = ? WHERE voter_id = ?', [epicNumber, voter.voter_id]);
    return epicNumber;
  }

  buildEPICNumber(voter) {
    const stateCode = (voter.state || 'IN').toString().substring(0, 2).toUpperCase().padEnd(2, 'X');
    const districtCode = (voter.district || 'EC').toString().substring(0, 2).toUpperCase().padEnd(2, 'X');
    const serial = String(voter.voter_id).padStart(6, '0');
    const random = Math.floor(10 + Math.random() * 90); // two digits
    return `${stateCode}${districtCode}${serial}${random}`.substring(0, 12);
  }
}

module.exports = new EPICService();

