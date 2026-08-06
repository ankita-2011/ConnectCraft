import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { uploadToCloudinary } from '../config/cloudinary.js';

// Recreate __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '../uploads');

// Ensure local upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage engine config for Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const userId = req.user ? req.user._id : 'anonymous';
    const fileExtension = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${userId}-${Date.now()}${fileExtension}`);
  },
});

// File filter (Only allow common image formats)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|gif/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }

  cb(new Error('Only image files (jpeg, jpg, png, webp, gif) are allowed!'));
};

// Initialize Multer upload handler middleware
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
});

/**
 * Uploads an image file processed by Multer to Cloudinary (if configured)
 * or returns the local server URL path as fallback.
 * @param {Object} file - req.file object from Multer
 * @param {string} folder - Destination folder on Cloudinary (e.g. 'connectcraft/avatars')
 * @returns {Promise<string>} - Returns full image URL (Cloudinary https://... or local /uploads/filename)
 */
export const processImageUpload = async (file, folder = 'connectcraft') => {
  if (!file) return '';

  // Try uploading to Cloudinary first
  const cloudinaryResult = await uploadToCloudinary(file.path, folder);

  if (cloudinaryResult && cloudinaryResult.secure_url) {
    // Optionally clean up local temporary file after successful Cloudinary upload
    try {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    } catch (e) {
      console.warn('[UPLOAD] Temporary file cleanup warning:', e.message);
    }
    return cloudinaryResult.secure_url;
  }

  // Fallback: Return local server static file path
  return `/uploads/${file.filename}`;
};
