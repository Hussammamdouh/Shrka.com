const mongoose = require('mongoose');

const formSubmissionSchema = new mongoose.Schema({
  formId: { type: mongoose.Schema.Types.ObjectId, ref: 'FormSchema', required: true },
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  responses: { type: Object, required: true },
  submittedAt: { type: Date, default: Date.now }
});

formSubmissionSchema.index({ companyId: 1 });
formSubmissionSchema.index({ leadId: 1 });
formSubmissionSchema.index({ userId: 1 });

module.exports = mongoose.model('FormSubmission', formSubmissionSchema); 