const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuid } = require('uuid');

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${uuid().slice(0, 8)}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ok = /^image\/(png|jpe?g|webp|gif|svg\+xml)$/.test(file.mimetype);
  cb(ok ? null : new Error('Only image files are allowed'), ok);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = upload;
