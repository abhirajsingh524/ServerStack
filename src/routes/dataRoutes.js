/**
 * @swagger
 * tags:
 *   name: Data
 *   description: Research data vault operations
 *
 * /api/data:
 *   post:
 *     summary: Create a new data record (JSON or file upload)
 *     tags: [Data]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               jsonData:
 *                 type: string
 *                 description: JSON stringified object
 *               accessLevel:
 *                 type: string
 *                 enum: [private, shared, public]
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Data created
 *       401:
 *         description: Unauthorized
 *   get:
 *     summary: Get all data (filtered by role)
 *     tags: [Data]
 *     responses:
 *       200:
 *         description: List of data records
 *
 * /api/data/{id}:
 *   get:
 *     summary: Get data by ID (decrypts if owner)
 *     tags: [Data]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Data record
 *       403:
 *         description: Access denied
 *       404:
 *         description: Not found
 *   put:
 *     summary: Update data record
 *     tags: [Data]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               accessLevel:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated
 *       403:
 *         description: Access denied
 *   delete:
 *     summary: Delete data record
 *     tags: [Data]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted
 *       403:
 *         description: Access denied
 */
const express = require('express');
const dataController = require('../controllers/dataController');
const { verifyToken } = require('../middleware/auth');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');
const { createDataSchema, updateDataSchema } = require('../utils/validationSchemas');

const router = express.Router();

// All data routes require authentication
router.use(verifyToken);

router.post('/', upload.single('file'), dataController.createData);
router.get('/', dataController.getAllData);
router.get('/:id', dataController.getDataById);
router.put('/:id', validate(updateDataSchema), dataController.updateData);
router.delete('/:id', dataController.deleteData);

module.exports = router;
