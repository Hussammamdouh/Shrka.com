const FormSchema = require('../models/formSchema.model');
const FormSubmission = require('../models/formSubmission.model');
const { createFormSchema, submitFormSchema } = require('../validators/form.validator');
const { AppError, catchAsync } = require('../utils/error.util');
const { exportToCsv } = require('../utils/csv-export.util');

exports.createOrUpdateForm = catchAsync(async (req, res) => {
  const { error } = createFormSchema.validate(req.body);
  if (error) throw new AppError(error.details[0].message, 400, 'VALIDATION_ERROR');
  const { companyId, name, fields, linkedToStage } = req.body;
  const existing = await FormSchema.findOne({ companyId, name }).sort({ version: -1 });
  let form;
  if (existing && (JSON.stringify(existing.fields) !== JSON.stringify(fields) || existing.linkedToStage !== linkedToStage)) {
    // Create new version
    form = await FormSchema.create({ companyId, name, fields, linkedToStage, createdBy: req.user._id, version: (existing.version || 1) + 1 });
  } else if (existing) {
    // No change, return existing
    form = existing;
  } else {
    form = await FormSchema.create({ companyId, name, fields, linkedToStage, createdBy: req.user._id, version: 1 });
  }
  res.json({ success: true, data: form, message: 'Form saved' });
});

exports.listForms = catchAsync(async (req, res) => {
  const { companyId } = req.params;
  const forms = await FormSchema.find({ companyId }).sort({ name: 1, version: -1 });
  res.json({ success: true, data: forms, message: 'Forms fetched' });
});

exports.submitForm = catchAsync(async (req, res) => {
  const { error } = submitFormSchema.validate(req.body);
  if (error) throw new AppError(error.details[0].message, 400, 'VALIDATION_ERROR');
  const { formId } = req.params;
  const form = await FormSchema.findById(formId);
  if (!form) throw new AppError('Form not found', 404, 'FORM_NOT_FOUND');
  const submission = await FormSubmission.create({
    formId,
    leadId: req.body.leadId,
    userId: req.user._id,
    companyId: form.companyId,
    responses: req.body.responses
  });
  res.status(201).json({ success: true, data: submission, message: 'Form submitted' });
});

exports.getSubmissionsByLead = catchAsync(async (req, res) => {
  const { leadId } = req.params;
  const submissions = await FormSubmission.find({ leadId });
  res.json({ success: true, data: submissions, message: 'Form submissions for lead' });
});

exports.getSubmissionsByUser = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const submissions = await FormSubmission.find({ userId });
  res.json({ success: true, data: submissions, message: 'Form submissions for user' });
});

exports.exportFormSubmissionsToCsv = async (req, res, next) => {
  try {
    const submissions = await require('../models/formSubmission.model').find({ companyId: req.company._id });
    const fields = [
      { label: 'Submission ID', value: '_id' },
      { label: 'Form ID', value: 'formId' },
      { label: 'Lead ID', value: 'leadId' },
      { label: 'Submitted By', value: 'submittedBy' },
      { label: 'Created At', value: 'createdAt' },
    ];
    exportToCsv(res, 'form_submissions.csv', submissions, fields);
  } catch (err) {
    next(err);
  }
}; 