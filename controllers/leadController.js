// Lead management (Contact forms, callback requests)
const Lead = require('../models/Lead');

// @desc    Create lead
// @route   POST /api/leads
// @access  Public
const createLead = async (req, res) => {
  try {
    // For contact forms, phone is optional - set to empty string if not provided
    const leadData = {
      ...req.body,
      phone: req.body.phone || (req.body.formType === 'contact' ? '' : undefined),
    };
    
    const lead = await Lead.create(leadData);
    res.status(201).json({
      message: 'Lead created successfully',
      lead: {
        _id: lead._id,
        name: lead.name,
        email: lead.email,
        formType: lead.formType,
        status: lead.status,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createLead,
};

