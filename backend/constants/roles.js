const ROLES = {
  SUPERADMIN: 'Superadmin',
  ADMIN: 'Admin',
  SALES_MANAGER: 'Sales Manager',
  SUPERVISOR: 'Supervisor',
  SALESMAN: 'Salesman',
};

const ROLE_LEVELS = {
  Superadmin: 5,
  Admin: 4,
  'Sales Manager': 3,
  Supervisor: 2,
  Salesman: 1,
};

const PERMISSIONS = [
  'createLead',
  'assignLead',
  'approveQuotation',
  // Add more as needed
];

module.exports = { ROLES, ROLE_LEVELS, PERMISSIONS }; 