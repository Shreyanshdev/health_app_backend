// Activity logging
const ActivityLog = require('../models/ActivityLog');

// Helper function to create activity log
const createActivityLog = async (userId, action, entityType, entityId, details, ipAddress) => {
  try {
    await ActivityLog.create({
      userId,
      action,
      entityType,
      entityId,
      details,
      ipAddress,
    });
  } catch (error) {
    console.error('Error creating activity log:', error);
  }
};

// Export for use in other controllers
module.exports.createActivityLog = createActivityLog;

// @desc    Get activity logs
// @route   GET /api/activity-logs
// @access  Private/Admin
const getActivityLogs = async (req, res) => {
  try {
    const { limit = 100, entityType, userId } = req.query;
    
    const query = {};
    if (entityType) query.entityType = entityType;
    if (userId) query.userId = userId;

    const logs = await ActivityLog.find(query)
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createActivityLog,
  getActivityLogs,
};

