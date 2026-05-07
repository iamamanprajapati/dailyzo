const router = require('express').Router();
const c = require('../controllers/payment.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);
router.post('/order', c.createPaymentOrder);
router.post('/verify', c.verifyPayment);
router.get('/transactions', c.listTransactions);

module.exports = router;
