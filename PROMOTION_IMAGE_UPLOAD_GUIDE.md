# Promotion Image Upload Guide

## 🖼️ **Image Upload Features Added**

The admin panel now includes a comprehensive image upload system for promotions with the following features:

### ✅ **Upload Methods:**
1. **Drag & Drop Upload** - Click the upload area to select files
2. **Manual URL Input** - Enter image URLs directly
3. **Image Preview** - See uploaded images before saving
4. **Image Management** - Remove and replace images easily

### 📁 **File Requirements:**
- **Supported Formats:** PNG, JPG, GIF, WebP
- **Maximum Size:** 5MB per image
- **Storage:** Images are stored in Supabase Storage
- **Public Access:** Images are publicly accessible via URLs

### 🎯 **How to Use:**

#### **1. Upload New Image:**
1. Go to Admin Panel → Promotions & Offers
2. Click "Create Promotion"
3. In the "Banner Settings" section:
   - Click the upload area
   - Select an image file
   - Wait for upload to complete
   - Preview the image

#### **2. Use Existing Image URL:**
1. In the "Banner Settings" section
2. Scroll down to "Or enter image URL manually"
3. Paste your image URL
4. The image will appear in the preview

#### **3. Remove Image:**
1. Click the "X" button on the image preview
2. Or clear the URL field manually

### 🔧 **Technical Details:**

#### **Storage Configuration:**
- **Bucket Name:** `promotions`
- **Folder Structure:** `promotions/promotion-{timestamp}.{ext}`
- **Public Access:** Yes (for display on website)
- **File Size Limit:** 5MB
- **Allowed Types:** image/jpeg, image/png, image/gif, image/webp

#### **Security:**
- **Authentication Required:** Only logged-in admins can upload
- **File Validation:** Server-side validation of file types and sizes
- **RLS Policies:** Row-level security for storage access

### 🎨 **Image Optimization Tips:**

#### **Recommended Dimensions:**
- **Banner Images:** 1200x400px (3:1 ratio)
- **Square Images:** 800x800px
- **Mobile Optimized:** 600x300px

#### **File Size Optimization:**
- **Compress images** before uploading
- **Use WebP format** for better compression
- **Resize large images** to appropriate dimensions

### 🚀 **Usage Examples:**

#### **1. Discount Banner:**
```
Title: "20% Off First Session"
Image: Discount-themed banner
Colors: Green background, white text
```

#### **2. Service Promotion:**
```
Title: "Professional Logo Design"
Image: Logo design showcase
Colors: Blue background, white text
```

#### **3. Announcement:**
```
Title: "New Feature Launch"
Image: Feature preview image
Colors: Purple background, white text
```

### 📱 **Responsive Display:**
- **Desktop:** Full-width banners
- **Mobile:** Responsive scaling
- **Tablet:** Optimized for medium screens

### 🔄 **Workflow:**
1. **Create Promotion** → Upload Image → Preview → Save
2. **Edit Promotion** → Change Image → Update → Save
3. **Delete Promotion** → Image remains in storage (manual cleanup needed)

### 🛠️ **Troubleshooting:**

#### **Upload Issues:**
- **File too large:** Compress image or use smaller file
- **Invalid format:** Use PNG, JPG, GIF, or WebP
- **Network error:** Check internet connection

#### **Display Issues:**
- **Image not showing:** Check URL is accessible
- **Slow loading:** Optimize image size
- **Wrong dimensions:** Resize image to recommended size

### 📊 **Storage Management:**
- **Monitor Usage:** Check Supabase Storage dashboard
- **Cleanup Old Images:** Remove unused images periodically
- **Backup Important Images:** Download critical images

The image upload system is now fully integrated and ready to use!



