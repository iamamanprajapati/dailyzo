const router = require('express').Router();
const c = require('../controllers/product.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/', c.list);
router.get('/:id', c.getOne);
router.post('/', protect, authorize('admin'), c.create);
router.put('/:id', protect, authorize('admin'), c.update);
router.delete('/:id', protect, authorize('admin'), c.remove);
router.patch('/:id/stock', protect, authorize('admin'), c.updateStock);

module.exports = router;
