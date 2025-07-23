const mongoose = require('mongoose');

const transferSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reason: String,
  date: Date
}, { _id: false });

const leadSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  contact: {
    name: String,
    phone: String,
    email: String,
    whatsapp: String
  },
  status: { type: String, enum: ['New', 'In Progress', 'Closed Won', 'Closed Lost'], default: 'New' },
  currentStage: { type: String },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  transferHistory: [transferSchema],
  formSubmissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'FormSubmission' }],
  activityTimeline: [{
    type: { type: String, required: true }, // e.g., 'created', 'assigned', 'stage_changed', 'note', 'attachment', etc.
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: String,
    data: mongoose.Schema.Types.Mixed,
    createdAt: { type: Date, default: Date.now }
  }],
  notes: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: String,
    createdAt: { type: Date, default: Date.now }
  }],
  attachments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fileUrl: String,
    fileName: String,
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

leadSchema.index({ companyId: 1 });
leadSchema.index({ assignedTo: 1 });
leadSchema.index({ stage: 1 });
leadSchema.index({ status: 1 });

module.exports = mongoose.model('Lead', leadSchema); 