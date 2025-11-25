# Cloudinary Setup Guide

This guide explains how to set up Cloudinary for file uploads in the Health App backend.

## 📋 Overview

The application now uses Cloudinary for storing uploaded files (profile pictures, documents, etc.) instead of local file storage. This provides:

- ✅ Scalable cloud storage
- ✅ Automatic image optimization
- ✅ CDN delivery for fast loading
- ✅ Automatic format conversion (WebP when supported)
- ✅ Image transformations on-the-fly

## 🔑 Getting Cloudinary Credentials

1. **Sign up for Cloudinary** (if you don't have an account):
   - Go to https://cloudinary.com/users/register/free
   - Create a free account (includes 25GB storage and 25GB bandwidth)

2. **Get your credentials**:
   - Log in to https://cloudinary.com/console
   - Go to **Settings** → **Security** (or Dashboard)
   - You'll find:
     - **Cloud Name** - Your unique cloud identifier
     - **API Key** - Your API key
     - **API Secret** - Your API secret (keep this secure!)

## ⚙️ Environment Variables

Add these variables to your `.env` file:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### For Production (Render)

Add these same variables in your Render dashboard:
1. Go to your service → **Environment**
2. Add each variable:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

## 📦 Installation

The required packages are already installed:
- `cloudinary` - Cloudinary SDK
- `multer-storage-cloudinary` - Multer storage engine for Cloudinary

If you need to reinstall:
```bash
cd server
npm install cloudinary multer-storage-cloudinary
```

## 🔧 Configuration

The Cloudinary configuration is in `server/config/cloudinary.js`:

- **Folder**: Files are stored in `health-app` folder in Cloudinary
- **Formats**: Supports jpeg, jpg, png, gif, webp
- **Transformations**: 
  - Max dimensions: 1000x1000px (maintains aspect ratio)
  - Auto quality optimization
  - Auto format (WebP when browser supports)

## 📝 How It Works

### File Upload Flow

1. **Client uploads file** → `POST /api/profile/picture`
2. **Multer middleware** receives the file
3. **Cloudinary storage** uploads to Cloudinary
4. **Cloudinary URL** is returned and saved to database
5. **Old image** (if exists) is deleted from Cloudinary

### Example Response

```json
{
  "message": "Profile picture uploaded successfully",
  "profilePicture": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/health-app/profile-1234567890-987654321.jpg"
}
```

## 🧪 Testing

1. **Start your server**:
   ```bash
   npm run dev
   ```

2. **Test upload endpoint**:
   ```bash
   curl -X POST http://localhost:5000/api/profile/picture \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -F "profilePicture=@/path/to/image.jpg"
   ```

3. **Check Cloudinary Dashboard**:
   - Go to https://cloudinary.com/console
   - Navigate to **Media Library**
   - You should see uploaded files in the `health-app` folder

## 🔍 Troubleshooting

### "Cloudinary configuration error"
- ✅ Check all three environment variables are set
- ✅ Verify credentials are correct (no extra spaces)
- ✅ Restart server after adding variables

### "Upload failed"
- ✅ Check file size (max 5MB)
- ✅ Verify file format (jpeg, jpg, png, gif, webp)
- ✅ Check Cloudinary dashboard for errors
- ✅ Verify API key has upload permissions

### "Image not displaying"
- ✅ Check Cloudinary URL is saved correctly in database
- ✅ Verify image exists in Cloudinary dashboard
- ✅ Check CORS settings if accessing from different domain

### "Old image not deleted"
- ✅ Check Cloudinary API secret is correct
- ✅ Verify old image URL is a valid Cloudinary URL
- ✅ Check server logs for deletion errors

## 📚 Additional Resources

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Multer Storage Cloudinary](https://github.com/affanshahid/multer-storage-cloudinary)
- [Cloudinary Node.js SDK](https://cloudinary.com/documentation/node_integration)

## 🔒 Security Best Practices

1. ✅ Never commit API secrets to version control
2. ✅ Use environment variables for all credentials
3. ✅ Rotate API secrets regularly
4. ✅ Use signed URLs for private images (if needed)
5. ✅ Set up Cloudinary upload presets with restrictions
6. ✅ Monitor usage in Cloudinary dashboard

## 💡 Tips

- **Free Tier Limits**: 25GB storage, 25GB bandwidth/month
- **Optimization**: Images are automatically optimized
- **CDN**: All images are served via Cloudinary's CDN
- **Transformations**: You can add transformations in the URL for on-the-fly resizing

Example transformation URL:
```
https://res.cloudinary.com/your-cloud/image/upload/w_200,h_200,c_fill/health-app/image.jpg
```

This resizes the image to 200x200px with fill crop mode.

---

**Need Help?** Check the Cloudinary dashboard logs or server console for detailed error messages.

