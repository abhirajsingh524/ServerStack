/**
 * @swagger
 * tags:
 *   name: Data
 *   description: Research data vault — create, read, update, delete encrypted records
 *
 * /api/v1/data:
 *   post:
 *     summary: Create a new data record (JSON payload or file upload)
 *     tags: [Data]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/DataCreateRequest'
 *     responses:
 *       201:
 *         description: Record created — JSON data is AES-256-GCM encrypted at rest
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *   get:
 *     summary: List data records (role-filtered, paginated)
 *     tags: [Data]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *       - in: query
 *         name: tag
 *         schema: { type: string }
 *         description: Filter by tag
 *       - in: query
 *         name: accessLevel
 *         schema: { type: string, enum: [private, shared, public] }
 *     responses:
 *       200:
 *         description: Paginated list — admin sees all, researcher sees own only
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /api/v1/data/{id}:
 *   get:
 *     summary: Get record by ID — decrypts data for owner/admin
 *     tags: [Data]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Record with decryptedData field if owner/admin
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/DataRecord'
 *       400:
 *         description: Invalid ID format
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     summary: Update record metadata (owner or admin only)
 *     tags: [Data]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             minProperties: 1
 *             properties:
 *               title:       { type: string, maxLength: 200 }
 *               description: { type: string, maxLength: 1000 }
 *               accessLevel: { type: string, enum: [private, shared, public] }
 *               tags:        { type: array, items: { type: string } }
 *     responses:
 *       200:
 *         description: Updated record
 *       400:
 *         description: No valid fields to update
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     summary: Delete record (owner or admin only)
 *     tags: [Data]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Record deleted
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
const express = require('express');
const dataController = require('../controllers/dataController');
const { verifyToken } = require('../middleware/auth');
const validate = require('../middleware/validate');
const upload   = require('../middleware/upload');
const { uploadLimiter, dataWriteLimiter } = require('../config/rateLimiting');
const {
  updateDataSchema,
  dataQuerySchema,
  objectIdSchema,
} = require('../utils/validationSchemas');

const router = express.Router();

// All data routes require authentication
router.use(verifyToken);

router.post('/',    uploadLimiter, upload.single('file'), dataController.createData);
router.get('/',     validate(dataQuerySchema, 'query'), dataController.getAllData);
router.get('/:id',  validate(objectIdSchema, 'params'), dataController.getDataById);
router.put('/:id',  dataWriteLimiter, validate(objectIdSchema, 'params'), validate(updateDataSchema), dataController.updateData);
router.delete('/:id', dataWriteLimiter, validate(objectIdSchema, 'params'), dataController.deleteData);

module.exports = router;
