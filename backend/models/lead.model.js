const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  contact: {
    name: String,
    phone: String,
    email: String,
    whatsapp: String,
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  stage: String,
  metadata: Object,
  formSubmissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'FormSubmission' }],
  transferHistory: [Object],
}, { timestamps: true });

// TODO: Add more indexes and logic for leads in future phases

module.exports = mongoose.model('Lead', leadSchema); 