import { v2 as cloudinary } from 'cloudinary';

/**
 * Helper to ensure Cloudinary SDK is initialized with fresh environment variables.
 */
const configureCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
};

/**
 * Helper to upload a local file or buffer to Cloudinary.
 * Falls back to returning null if Cloudinary is not configured.
 * @param {string|Buffer} filePathOrBuffer - Path to local file or Buffer
 * @param {string} folder - Destination folder on Cloudinary (e.g., 'connectcraft/avatars')
 * @returns {Promise<Object|null>} - Returns { secure_url, public_id } or null
 */
export const uploadToCloudinary = async (filePathOrBuffer, folder = 'connectcraft') => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.warn('[CLOUDINARY] Credentials not configured in .env — using local storage fallback.');
    return null;
  }

  try {
    // Ensure Cloudinary SDK is configured dynamically before performing upload
    configureCloudinary();

    const result = await cloudinary.uploader.upload(filePathOrBuffer, {
      folder: folder,
      resource_type: 'auto',
    });
    return {
      secure_url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    console.error('[CLOUDINARY] Upload error:', error.message);
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

/**
 * Helper to delete an asset from Cloudinary by its public_id.
 * @param {string} publicId
 */
export const deleteFromCloudinary = async (publicId) => {
  if (!publicId || !process.env.CLOUDINARY_CLOUD_NAME) return;
  try {
    configureCloudinary();
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.warn('[CLOUDINARY] Delete error:', error.message);
  }
};

export default cloudinary;
