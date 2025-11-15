const revisionService = require('../services/revisionService');

class RevisionController {
  async createAnnouncement(req, res, next) {
    try {
      const announcement = await revisionService.createAnnouncement({
        ...req.body,
        created_by: req.body.created_by || req.user?.voter_id || null
      });
      res.status(201).json({ success: true, data: announcement });
    } catch (error) {
      next(error);
    }
  }

  async getAnnouncementById(req, res, next) {
    try {
      const announcement = await revisionService.getAnnouncementById(req.params.id);
      if (!announcement) {
        return res.status(404).json({ error: 'Announcement not found' });
      }
      res.json({ success: true, data: announcement });
    } catch (error) {
      next(error);
    }
  }

  async getActiveAnnouncements(req, res, next) {
    try {
      const region = req.query.district ? { district: req.query.district } :
                     req.query.state ? { state: req.query.state } : null;
      const announcements = await revisionService.getActiveAnnouncements(region);
      res.json({ success: true, data: announcements });
    } catch (error) {
      next(error);
    }
  }

  async getAllAnnouncements(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const result = await revisionService.getAllAnnouncements(page, limit);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RevisionController();

