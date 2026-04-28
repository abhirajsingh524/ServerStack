const express = require('express');
const adminController = require('../controllers/adminController');
const { verifyToken, checkRole } = require('../middleware/auth');

const router = express.Router();

// All admin routes require auth + admin role
router.use(verifyToken, checkRole('admin'));

router.get('/users', adminController.getAllUsers);
router.patch('/users/:id/deactivate', adminController.deactivateUser);
router.patch('/users/:id/activate', adminController.activateUser);

module.exports = router;
