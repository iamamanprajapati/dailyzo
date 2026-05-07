const router = require('express').Router();
const c = require('../controllers/cart.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);
router.get('/', c.getCart);
router.post('/items', c.addItem);
router.put('/items', c.updateItem);
router.delete('/items/:productId', c.removeItem);
router.delete('/', c.clearCart);

module.exports = router;
