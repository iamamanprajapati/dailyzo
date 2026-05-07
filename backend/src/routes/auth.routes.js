const router = require('express').Router();
const c = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/register', c.register);
router.post('/login', c.login);
router.post('/admin/login', c.adminLogin);
router.post('/refresh', c.refresh);
router.post('/otp/send', c.sendOtp);
router.post('/otp/verify', c.verifyOtp);
router.get('/me', protect, c.me);

module.exports = router;
