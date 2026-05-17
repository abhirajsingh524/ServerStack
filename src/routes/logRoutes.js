/**
 * @swagger
 * tags:
 *   name: Logs
 *   description: Audit log access — admin only
 *
 * /api/v1/logs:
 *   get:
 *     summary: Get paginated audit logs with optional filters
 *     tags: [Logs]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50, maximum: 100 }
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [LOGIN_SUCCESS, LOGIN_FAILED, REGISTER, DATA_CREATE, DATA_READ, DATA_UPDATE, DATA_DELETE, UNAUTHORIZED_ACCESS]
 *         description: Filter by action type
 *       - in: query
 *         name: userId
 *         schema: { type: string }
 *         description: Filter by user ObjectId
 *     responses:
 *       200:
 *         description: Paginated audit logs with metadata
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         logs:
 *                           type: array
 *                         pagination:
 *                           $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
const express = require('express');
const logController = require('../controllers/logController');
const { verifyToken, checkRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { logQuerySchema } = require('../utils/validationSchemas');

const router = express.Router();

// Admin only
router.use(verifyToken, checkRole('admin'));

router.get('/', validate(logQuerySchema, 'query'), logController.getLogs);

module.exports = router;
