const router = require('express').Router();
const c = require('../controllers/delivery.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/me', authorize('delivery'), c.myProfile);
router.post('/me/location', authorize('delivery'), c.updateLocation);
router.post('/me/availability', authorize('delivery'), c.setAvailability);

router.get('/', authorize('admin'), c.listPartners);
router.get('/available', authorize('admin'), c.availablePartners);
router.post('/', authorize('admin'), c.createPartner);
router.put('/:id', authorize('admin'), c.updatePartner);
router.delete('/:id', authorize('admin'), c.deletePartner);

module.exports = router;
