const Lead = require('../models/lead.model');
const FormSubmission = require('../models/formSubmission.model');
const { createLeadSchema, assignLeadSchema, updateStageSchema } = require('../validators/lead.validator');
const { AppError, catchAsync } = require('../utils/error.util');
const csv = require('csv-parser');
const { Parser } = require('json2csv');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');
const UserCompanyRole = require('../models/userCompanyRole.model');
const { uploadToCloudinary } = require('../utils/cloudinary.util');
const { exportToCsv } = require('../utils/csv-export.util');

exports.createLead = catchAsync(async (req, res) => {
  const { error } = createLeadSchema.validate(req.body);
  if (error) throw new AppError(error.details[0].message, 400, 'VALIDATION_ERROR');
  let assignedTo = req.body.assignedTo;
  if (!assignedTo) {
    // Auto-assign using round-robin among Salesmen in the company
    const salesmen = await UserCompanyRole.find({ companyId: req.body.companyId, role: 'Salesman' }).sort('lastAssignedAt');
    if (salesmen.length > 0) {
      assignedTo = salesmen[0].userId;
      salesmen[0].lastAssignedAt = new Date();
      await salesmen[0].save();
    }
  }
  const lead = await Lead.create({ ...req.body, assignedTo, createdBy: req.user._id, activityTimeline: [{ type: 'created', user: req.user._id, message: 'Lead created' }] });
  res.status(201).json({ success: true, data: lead, message: 'Lead created' });
});

exports.assignLead = catchAsync(async (req, res) => {
  const { error } = assignLeadSchema.validate(req.body);
  if (error) throw new AppError(error.details[0].message, 400, 'VALIDATION_ERROR');
  const lead = await Lead.findById(req.params.leadId);
  if (!lead) throw new AppError('Lead not found', 404, 'LEAD_NOT_FOUND');
  lead.transferHistory.push({ from: lead.assignedTo, to: req.body.assignedTo, reason: req.body.reason, date: new Date() });
  lead.assignedTo = req.body.assignedTo;
  lead.activityTimeline.push({ type: 'assigned', user: req.user._id, message: `Lead assigned to ${req.body.assignedTo}`, data: { to: req.body.assignedTo, reason: req.body.reason } });
  await lead.save();
  res.json({ success: true, data: lead, message: 'Lead assigned/transferred' });
});

exports.updateStage = catchAsync(async (req, res) => {
  const { error } = updateStageSchema.validate(req.body);
  if (error) throw new AppError(error.details[0].message, 400, 'VALIDATION_ERROR');
  const lead = await Lead.findById(req.params.leadId);
  if (!lead) throw new AppError('Lead not found', 404, 'LEAD_NOT_FOUND');
  lead.currentStage = req.body.currentStage;
  lead.activityTimeline.push({ type: 'stage_changed', user: req.user._id, message: `Stage changed to ${req.body.currentStage}` });
  await lead.save();
  res.json({ success: true, data: lead, message: 'Lead stage updated' });
});

exports.addNote = catchAsync(async (req, res) => {
  const { text } = req.body;
  const lead = await Lead.findById(req.params.leadId);
  if (!lead) throw new AppError('Lead not found', 404, 'LEAD_NOT_FOUND');
  lead.notes.push({ user: req.user._id, text });
  lead.activityTimeline.push({ type: 'note', user: req.user._id, message: 'Note added', data: { text } });
  await lead.save();
  res.json({ success: true, data: lead.notes, message: 'Note added' });
});

exports.addAttachment = [upload.single('file'), catchAsync(async (req, res) => {
  const { fileName } = req.body;
  const lead = await Lead.findById(req.params.leadId);
  if (!lead) throw new AppError('Lead not found', 404, 'LEAD_NOT_FOUND');
  if (!req.file) throw new AppError('No file uploaded', 400);
  const result = await uploadToCloudinary(req.file.path, 'leads');
  lead.attachments.push({ user: req.user._id, fileUrl: result.secure_url, fileName: fileName || req.file.originalname });
  lead.activityTimeline.push({ type: 'attachment', user: req.user._id, message: 'Attachment added', data: { fileUrl: result.secure_url, fileName: fileName || req.file.originalname } });
  await lead.save();
  require('fs').unlinkSync(req.file.path);
  res.json({ success: true, data: lead.attachments, message: 'Attachment added' });
})];

exports.getLead = catchAsync(async (req, res) => {
  const lead = await Lead.findById(req.params.leadId).populate('formSubmissions');
  if (!lead) throw new AppError('Lead not found', 404, 'LEAD_NOT_FOUND');
  res.json({ success: true, data: lead, message: 'Lead fetched' });
});

exports.listLeads = catchAsync(async (req, res) => {
  const { companyId, stage, assignedTo, from, to } = req.query;
  const filter = {};
  if (companyId) filter.companyId = companyId;
  if (stage) filter.currentStage = stage;
  if (assignedTo) filter.assignedTo = assignedTo;
  if (from || to) filter.createdAt = {};
  if (from) filter.createdAt.$gte = new Date(from);
  if (to) filter.createdAt.$lte = new Date(to);
  const leads = await Lead.find(filter);
  res.json({ success: true, data: leads, message: 'Leads fetched' });
});

exports.importLeads = [upload.single('file'), catchAsync(async (req, res) => {
  if (!req.file) throw new AppError('No file uploaded', 400);
  const leads = [];
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (row) => {
      // Basic validation: require name and companyId
      if (row.name && row.companyId) {
        leads.push({
          companyId: row.companyId,
          contact: { name: row.name, phone: row.phone, email: row.email, whatsapp: row.whatsapp },
          status: row.status || 'New',
          currentStage: row.currentStage,
          assignedTo: row.assignedTo,
          createdBy: req.user._id,
          activityTimeline: [{ type: 'imported', user: req.user._id, message: 'Lead imported' }]
        });
      }
    })
    .on('end', async () => {
      const created = await Lead.insertMany(leads);
      fs.unlinkSync(req.file.path);
      res.json({ success: true, data: created, message: 'Leads imported' });
    });
})];

exports.exportLeads = catchAsync(async (req, res) => {
  const { companyId } = req.query;
  const leads = await Lead.find(companyId ? { companyId } : {});
  const fields = ['_id', 'companyId', 'contact.name', 'contact.phone', 'contact.email', 'contact.whatsapp', 'status', 'currentStage', 'assignedTo', 'createdBy'];
  const parser = new Parser({ fields });
  const csvData = parser.parse(leads);
  res.header('Content-Type', 'text/csv');
  res.attachment('leads.csv');
  res.send(csvData);
});

exports.exportLeadsToCsv = async (req, res, next) => {
  try {
    const leads = await Lead.find({ companyId: req.company._id });
    const fields = [
      { label: 'Lead ID', value: '_id' },
      { label: 'Name', value: 'name' },
      { label: 'Email', value: 'email' },
      { label: 'Phone', value: 'phone' },
      { label: 'Stage', value: 'stage' },
      { label: 'Status', value: 'status' },
      { label: 'Created At', value: 'createdAt' },
    ];
    exportToCsv(res, 'leads.csv', leads, fields);
  } catch (err) {
    next(err);
  }
}; 