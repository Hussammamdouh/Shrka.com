const cron = require('node-cron');
const Subscription = require('../models/subscription.model');
const AuditLog = require('../models/auditLog.model');

async function expireSubscriptions() {
  const today = new Date();
  const expired = await Subscription.updateMany(
    { endDate: { $lt: today }, status: { $ne: 'expired' } },
    { $set: { status: 'expired' } }
  );
  if (expired.modifiedCount > 0) {
    // Log to audit for each expired subscription
    const expiredSubs = await Subscription.find({ endDate: { $lt: today }, status: 'expired' });
    for (const sub of expiredSubs) {
      await AuditLog.create({
        companyId: sub.companyId,
        action: 'subscription_expired',
        entity: 'Subscription',
        entityId: sub._id,
        details: { endDate: sub.endDate },
      });
    }
  }
}

function startSubscriptionExpiryJob() {
  // Run daily at 2:00 AM
  cron.schedule('0 2 * * *', expireSubscriptions, { timezone: 'UTC' });
}

module.exports = { startSubscriptionExpiryJob }; 