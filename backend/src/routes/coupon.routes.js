const router = require('express').Router();
const c = require('../controllers/coupon.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.post('/validate', protect, c.validate);
router.get('/', protect, authorize('admin'), c.list);
router.post('/', protect, authorize('admin'), c.create);
router.put('/:id', protect, authorize('admin'), c.update);
router.delete('/:id', protect, authorize('admin'), c.remove);

module.exports = router;
