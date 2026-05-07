const router = require('express').Router();
const c = require('../controllers/address.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);
router.get('/', c.list);
router.post('/', c.add);
router.put('/:id', c.update);
router.delete('/:id', c.remove);

module.exports = router;
