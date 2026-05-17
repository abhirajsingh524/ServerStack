/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication & session management
 *
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       409:
 *         $ref: '#/components/responses/Forbidden'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *
 * /api/v1/auth/login:
 *   post:
 *     summary: Login — returns access + refresh tokens
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/TokenResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Rotate tokens using refresh token
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Valid refresh token from login
 *     responses:
 *       200:
 *         description: New token pair issued
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout — invalidates refresh token
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current authenticated user profile
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Current user info
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
const express = require('express');
const authController = require('../controllers/authController');
const validate       = require('../middleware/validate');
const { verifyToken } = require('../middleware/auth');
const {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} = require('../utils/validationSchemas');

const router = express.Router();

router.post('/register', validate(registerSchema),      authController.register);
router.post('/login',    validate(loginSchema),         authController.login);
router.post('/refresh',  validate(refreshTokenSchema),  authController.refresh);
router.post('/logout',   verifyToken,                   authController.logout);
router.get('/me',        verifyToken,                   authController.me);

module.exports = router;
