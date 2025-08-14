# File Upload Setup Guide

This guide explains how to set up file uploads for gear images using Supabase Storage.

## Features Implemented

✅ **Drag & Drop Upload**: Users can drag and drop multiple images  
✅ **File Validation**: Validates file type, size, and dimensions  
✅ **Image Compression**: Automatically compresses images for optimal storage  
✅ **Progress Indicators**: Real-time upload progress with visual feedback  
✅ **Storage Management**: Automatic file naming and organization  
✅ **Error Handling**: Comprehensive error handling with user-friendly messages  
✅ **Mobile Responsive**: Works on all device sizes  

## Components

### ImageUpload Component
Location: `src/components/ImageUpload.tsx`

**Props:**
- `onImagesChange: (imageUrls: string[]) => void` - Callback when images change
- `existingImages?: string[]` - Pre-existing image URLs
- `maxImages?: number` - Maximum number of images (default: 10)
- `maxSizePerImage?: number` - Max size per image in MB (default: 5)

**Features:**
- Drag & drop interface
- File validation (type, size, dimensions)
- Automatic image compression
- Upload progress tracking
- Image preview with delete functionality
- Error handling and user feedback

### Image Utilities
Location: `src/lib/image-utils.ts`

**Functions:**
- `compressImage()` - Compress and resize images
- `validateImageFile()` - Validate image files
- `generateThumbnail()` - Create thumbnails
- `getImageDimensions()` - Get image dimensions
- `fileToDataURL()` - Convert files to base64

## Setup Instructions

### 1. Supabase Storage Configuration

Run the following SQL commands in your Supabase SQL editor:

```sql
-- Create storage bucket for gear images
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true);

-- Allow authenticated users to upload images
CREATE POLICY "Users can upload gear images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'gear-images'
);

-- Allow anyone to view gear images
CREATE POLICY "Anyone can view gear images" ON storage.objects
FOR SELECT USING (bucket_id = 'images');

-- Allow users to delete their uploaded images
CREATE POLICY "Users can delete their uploaded images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'gear-images'
);

-- Enable RLS on the bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
```

### 2. Environment Variables

Ensure these environment variables are set in your `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Usage in Forms

The component is already integrated into:
- Add Gear form (`/add-gear`)
- Edit Gear form (`/edit-gear/[id]`)

Example usage:
```tsx
<ImageUpload
  onImagesChange={setImages}
  existingImages={images}
  maxImages={10}
  maxSizePerImage={5}
/>
```

## File Structure

```
src/
├── components/
│   └── ImageUpload.tsx          # Main upload component
├── lib/
│   ├── image-utils.ts           # Image processing utilities
│   ├── supabase-browser.ts      # Browser Supabase client
│   └── supabase-server.ts       # Server Supabase client
└── app/
    ├── add-gear/page.tsx        # Uses ImageUpload
    └── edit-gear/[id]/page.tsx  # Uses ImageUpload
```

## Storage Organization

Images are stored in Supabase Storage with this structure:
```
images/
└── gear-images/
    ├── uuid1.jpg
    ├── uuid2.jpg
    └── uuid3.png
```

Each uploaded file gets a unique UUID filename to prevent conflicts.

## Image Processing

### Automatic Compression
- Maximum dimensions: 1920x1080px
- JPEG quality: 85%
- Preserves aspect ratio
- Fallback to original file if compression fails

### Validation Rules
- **File types**: JPEG, JPG, PNG, WebP
- **Max size**: 5MB per image (configurable)
- **Min dimensions**: 100x100px
- **Max images**: 10 per gear item (configurable)

## Security Features

- **Authentication required** for uploads
- **File type validation** prevents malicious uploads
- **Size limits** prevent storage abuse
- **Organized storage** with folder structure
- **RLS policies** control access

## Error Handling

The component handles various error scenarios:
- Invalid file types
- Files too large
- Upload failures
- Network errors
- Authentication errors

All errors show user-friendly toast notifications.

## Performance Considerations

- **Lazy loading**: Images load as needed
- **Compression**: Reduces storage and bandwidth
- **Progress indicators**: Better UX for large uploads
- **Batch processing**: Multiple files handled efficiently

## Browser Support

- Modern browsers with File API support
- Drag & drop support
- Canvas API for image processing
- Progressive enhancement for older browsers

## Troubleshooting

### Common Issues

1. **Upload fails with 403 error**
   - Check Supabase RLS policies
   - Ensure user is authenticated
   - Verify bucket permissions

2. **Images not displaying**
   - Check Supabase storage bucket is public
   - Verify image URLs are correct
   - Check network connectivity

3. **Compression errors**
   - Fallback to original file
   - Check browser Canvas API support
   - Verify image format compatibility

### Testing

To test the upload functionality:
1. Navigate to `/add-gear`
2. Try uploading various image types
3. Test drag & drop functionality
4. Verify upload progress indicators
5. Check image preview and delete functionality

## Future Enhancements

Potential improvements:
- **Image cropping** interface
- **Multiple image sizes** (thumbnails, medium, large)
- **CDN integration** for faster delivery
- **Batch upload** optimization
- **Background processing** for large files
- **Image metadata** extraction
- **Alt text** generation using AI

## Dependencies

- `@supabase/ssr` - Supabase client
- `uuid` - Unique file naming
- `react-hot-toast` - User notifications
- Native browser APIs (File, Canvas, FileReader)