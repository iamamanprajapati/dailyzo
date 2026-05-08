const router = require('express').Router();
const c = require('../controllers/order.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);

router.post('/checkout', c.checkout);
router.get('/me', c.myOrders);
router.get('/admin', authorize('admin'), c.adminListOrders);
router.get('/delivery/active', authorize('delivery'), c.deliveryActiveOrder);
router.get('/delivery/history', authorize('delivery'), c.deliveryHistory);
router.post('/:id/accept', authorize('delivery'), c.acceptDeliveryOrder);
router.get('/:id', c.getOrder);
router.post('/:id/cancel', c.cancelOrder);
router.patch('/:id/status', authorize('admin', 'delivery'), c.updateStatus);
router.post('/:id/assign', authorize('admin'), c.assignDelivery);

module.exports = router;
