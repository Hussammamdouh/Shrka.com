const express = require('express');
const router = express.Router();
const companyController = require('../controllers/company.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const checkCompanyRole = require('../middlewares/checkCompanyRole.middleware');
const checkRoleLevel = require('../middlewares/checkRoleLevel.middleware');
const { ROLES } = require('../constants/roles');
const { createCompanySchema, inviteUserSchema, assignRoleSchema } = require('../validators/company.validator');
const validate = require('../middlewares/validate.middleware');

router.post('/', requireAuth, validate(createCompanySchema), companyController.createCompany);
router.post('/:companyId/invite', requireAuth, checkCompanyRole('companyId', 'Superadmin', 'Admin'), validate(inviteUserSchema), companyController.inviteUser);
router.get('/my', requireAuth, companyController.listUserCompanies);
router.post('/:companyId/assign-role', requireAuth, checkCompanyRole('companyId', 'Superadmin', 'Admin'), validate(assignRoleSchema), companyController.assignRole);
router.put('/:companyId', requireAuth, checkCompanyRole('companyId', 'Superadmin'), companyController.updateCompany);
router.delete('/:companyId', requireAuth, checkCompanyRole('companyId', 'Superadmin'), companyController.deleteCompany);
router.post('/:companyId/remove-user', requireAuth, checkCompanyRole('companyId', 'Superadmin', 'Admin'), companyController.removeUser);
router.put('/:companyId/settings', requireAuth, checkCompanyRole('companyId', 'Superadmin', 'Admin'), companyController.updateSettings);
router.post('/:companyId/join-request/:requestId/approve', requireAuth, checkCompanyRole('companyId', 'Superadmin', 'Admin'), companyController.approveJoinRequest);
router.post('/:companyId/join-request/:requestId/reject', requireAuth, checkCompanyRole('companyId', 'Superadmin', 'Admin'), companyController.rejectJoinRequest);
router.post('/:companyId/users', requireAuth, checkCompanyRole('companyId', 'Superadmin', 'Admin'), companyController.addUserToCompany);
router.get('/:companyId/users', requireAuth, checkCompanyRole('companyId', 'Superadmin', 'Admin'), companyController.listCompanyUsers);
router.get('/:companyId/invites', requireAuth, checkCompanyRole('companyId', 'Superadmin', 'Admin'), companyController.listCompanyInvites);
router.get('/:companyId', requireAuth, companyController.getCompanyById);
router.get('/', requireAuth, checkRoleLevel('companyId', ROLES.SUPERADMIN, 5), companyController.listAllCompanies);

module.exports = router; 