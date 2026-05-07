const router = require('express').Router();
const upload = require('../middleware/upload.middleware');
const { protect, authorize } = require('../middleware/auth.middleware');

router.post('/image', protect, authorize('admin'), upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  const url = `/uploads/${req.file.filename}`;
  res.status(201).json({ success: true, url, filename: req.file.filename });
});

router.post('/images', protect, authorize('admin'), upload.array('files', 8), (req, res) => {
  const files = (req.files || []).map((f) => `/uploads/${f.filename}`);
  res.status(201).json({ success: true, urls: files });
});

module.exports = router;
