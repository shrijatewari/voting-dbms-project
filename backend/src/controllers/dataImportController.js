const dataImportService = require('../services/dataImportService');

class DataImportController {
  async createImport(req, res, next) {
    try {
      const importRecord = await dataImportService.createImport({
        ...req.body,
        created_by: req.body.created_by || req.user?.voter_id || null
      });
      res.status(201).json({ success: true, data: importRecord });
    } catch (error) {
      next(error);
    }
  }

  async getImportById(req, res, next) {
    try {
      const importRecord = await dataImportService.getImportById(req.params.id);
      if (!importRecord) {
        return res.status(404).json({ error: 'Import not found' });
      }
      res.json({ success: true, data: importRecord });
    } catch (error) {
      next(error);
    }
  }

  async runDedupeOnImport(req, res, next) {
    try {
      const importId = req.params.id;
      const result = await dataImportService.runDedupeOnImport(importId, req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async commitImport(req, res, next) {
    try {
      const importId = req.params.id;
      const result = await dataImportService.commitImport(importId, req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async rollbackImport(req, res, next) {
    try {
      const importId = req.params.id;
      const result = await dataImportService.rollbackImport(importId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getAllImports(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const result = await dataImportService.getAllImports(page, limit);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DataImportController();

