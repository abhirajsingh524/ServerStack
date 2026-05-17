/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin-only — user management (requires admin role)
 *
 * /api/v1/admin/users:
 *   get:
 *     summary: List all registered users
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Array of user objects
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *
 * /api/v1/admin/users/{id}/deactivate:
 *   patch:
 *     summary: Deactivate a user account (blocks login)
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: MongoDB ObjectId of the user
 *     responses:
 *       200:
 *         description: User deactivated
 *       400:
 *         description: Invalid ID format
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 * /api/v1/admin/users/{id}/activate:
 *   patch:
 *     summary: Re-activate a deactivated user account
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User activated
 *       400:
 *         description: Invalid ID format
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
const express = require('express');
const adminController = require('../controllers/adminController');
const { verifyToken, checkRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { objectIdSchema } = require('../utils/validationSchemas');

const router = express.Router();

// All admin routes: must be authenticated AND have admin role
router.use(verifyToken, checkRole('admin'));

router.get('/users',                                                    adminController.getAllUsers);
router.patch('/users/:id/deactivate', validate(objectIdSchema, 'params'), adminController.deactivateUser);
router.patch('/users/:id/activate',   validate(objectIdSchema, 'params'), adminController.activateUser);

module.exports = router;
