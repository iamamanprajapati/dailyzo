const router = require('express').Router();
const c = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect, authorize('admin'));
router.get('/dashboard', c.dashboard);
router.get('/customers', c.customers);
router.get('/transactions', c.recentTransactions);

module.exports = router;
