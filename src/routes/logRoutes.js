const express = require('express');
const logController = require('../controllers/logController');
const { verifyToken, checkRole } = require('../middleware/auth');

const router = express.Router();

// Only admins can view logs
router.use(verifyToken, checkRole('admin'));

router.get('/', logController.getLogs);

module.exports = router;
