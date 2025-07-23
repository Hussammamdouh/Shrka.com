// TODO: Implement real email sending logic
exports.sendInviteEmail = async (to, company, role) => {
  // send email to 'to' about being invited to 'company' as 'role'
};

exports.sendRoleChangeEmail = async (to, company, newRole) => {
  // send email to 'to' about their role change in 'company'
};

exports.sendSubscriptionStatusEmail = async (to, company, status) => {
  // send email to 'to' about subscription status change
};

// TODO: Integrate with email/WhatsApp for notifications
async function onQuotationStatusChange({ to, quotationId, status }) {
  // TODO: Send email/WhatsApp notification to user about quotation approval/rejection
}

async function onSubscriptionExpiry({ to, companyId }) {
  // TODO: Send email/WhatsApp notification to company admin about subscription expiry
}

async function onLeadAssignment({ to, leadId }) {
  // TODO: Send email/WhatsApp notification to user about new lead assignment
}

module.exports = {
  ...module.exports,
  onQuotationStatusChange,
  onSubscriptionExpiry,
  onLeadAssignment,
}; 