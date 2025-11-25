// Cloudinary configuration
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Create Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'health-app', // Folder name in Cloudinary
    allowed_formats: ['jpeg', 'jpg', 'png', 'gif', 'webp'],
    transformation: [
      {
        width: 1000,
        height: 1000,
        crop: 'limit', // Maintain aspect ratio, limit dimensions
        quality: 'auto', // Auto optimize quality
        fetch_format: 'auto', // Auto format (webp when supported)
      },
    ],
  },
});

// Helper function to delete image from Cloudinary
const deleteImage = async (imageUrl) => {
  try {
    if (!imageUrl) return;

    // Extract public_id from Cloudinary URL
    // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{public_id}.{format}
    const urlParts = imageUrl.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    
    if (uploadIndex === -1) {
      // If it's not a Cloudinary URL (old local file), skip deletion
      return;
    }

    // Get public_id (everything after 'upload' and before the file extension)
    const publicIdWithVersion = urlParts.slice(uploadIndex + 1).join('/');
    // Remove version number if present (format: v1234567890/public_id)
    const publicId = publicIdWithVersion.replace(/^v\d+\//, '').replace(/\.[^.]+$/, '');
    
    // Delete from Cloudinary
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    // Don't throw error, just log it
  }
};

module.exports = {
  cloudinary,
  storage,
  deleteImage,
};

