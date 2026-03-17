/**
 * Cloudinary configuration and upload utility.
 */
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

let configured = false;

function ensureConfigured() {
  if (!configured) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    configured = true;
  }
}

/**
 * Uploads a file to Cloudinary and removes the local temp file.
 * @param {string} filePath - Local path of the file to upload
 * @param {string} folder - Cloudinary folder (e.g. 'kyc', 'donations')
 * @returns {Promise<string>} - The secure Cloudinary URL
 */
export async function uploadToCloudinary(filePath, folder = 'uploads') {
  ensureConfigured();
  
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: `ganesha-seva/${folder}`,
      resource_type: 'image',
    });

    // Clean up local temp file after successful upload
    fs.unlink(filePath, (err) => {
      if (err) console.warn('Could not delete temp file:', filePath);
    });

    return result.secure_url;
  } catch (err) {
    // Clean up local temp file even on failure
    fs.unlink(filePath, () => {});
    throw err;
  }
}

export default cloudinary;
