const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  label: { type: String, required: true },
  type: { type: String, enum: ['text', 'number', 'email', 'phone', 'dropdown', 'checkbox', 'radio', 'textarea', 'date', 'file', 'section'], required: true },
  required: { type: Boolean, default: false },
  options: [String],
  min: Number,
  max: Number,
  pattern: String,
  conditional: {
    field: String, // label or id of the field this depends on
    value: mongoose.Schema.Types.Mixed // value that triggers this field
  },
  validationMessage: String
}, { _id: false });

const formSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  name: { type: String, required: true },
  fields: [fieldSchema],
  linkedToStage: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  version: { type: Number, default: 1 }
}, { timestamps: true });

formSchema.index({ companyId: 1 });

module.exports = mongoose.model('FormSchema', formSchema); 