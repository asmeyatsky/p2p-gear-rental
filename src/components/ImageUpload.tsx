'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { v4 as uuidv4 } from 'uuid';
import { compressImage, validateImageFile } from '@/lib/image-utils';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { apiUrl } from '@/lib/api';

// Use local storage in development, Supabase in production
const USE_LOCAL_STORAGE = process.env.NODE_ENV === 'development';

interface ImageUploadProps {
  onImagesChange: (imageUrls: string[]) => void;
  existingImages?: string[];
  maxImages?: number;
  maxSizePerImage?: number; // in MB
}

interface UploadingImage {
  id: string;
  file: File;
  progress: number;
  url?: string;
  error?: string;
}

export default function ImageUpload({
  onImagesChange,
  existingImages = [],
  maxImages = 10,
  maxSizePerImage = 5, // 5MB default
}: ImageUploadProps) {
  const [images, setImages] = useState<string[]>(existingImages);
  const [uploadingImages, setUploadingImages] = useState<UploadingImage[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  const validateAndProcessFile = async (file: File): Promise<{ processedFile: File; error?: string }> => {
    // Validate the file first
    const validation = await validateImageFile(file, {
      maxSize: maxSizePerImage * 1024 * 1024,
      allowedTypes,
      minWidth: 100,
      minHeight: 100,
    });

    if (!validation.valid) {
      return { processedFile: file, error: validation.error };
    }

    try {
      // Compress the image to optimize storage and performance
      const compressedFile = await compressImage(file, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.85,
        format: file.type.includes('png') ? 'png' : 'jpeg',
      });

      return { processedFile: compressedFile };
    } catch (error) {
      // If compression fails, use original file
      console.warn('Image compression failed, using original file:', error);
      return { processedFile: file };
    }
  };

  const uploadImageLocal = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(apiUrl('/api/upload'), {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Upload failed');
    }

    const data = await response.json();
    return data.url;
  };

  const uploadImageSupabase = async (file: File): Promise<string> => {
    const uploadId = uuidv4();
    const fileExt = file.name.split('.').pop();
    const fileName = `${uploadId}.${fileExt}`;
    const filePath = `gear-images/${fileName}`;

    const { error } = await supabase.storage
      .from('images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new Error(error.message);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const uploadImage = async (file: File): Promise<string> => {
    if (USE_LOCAL_STORAGE) {
      return uploadImageLocal(file);
    }
    return uploadImageSupabase(file);
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const totalImages = images.length + uploadingImages.length + fileArray.length;

    if (totalImages > maxImages) {
      toast.error(`You can only upload up to ${maxImages} images.`);
      return;
    }

    const validFiles: File[] = [];
    
    // Validate and process files
    for (const file of fileArray) {
      const { processedFile, error } = await validateAndProcessFile(file);
      if (error) {
        toast.error(`${file.name}: ${error}`);
        continue;
      }
      validFiles.push(processedFile);
    }

    if (validFiles.length === 0) return;

    // Add to uploading state
    const newUploadingImages: UploadingImage[] = validFiles.map(file => ({
      id: uuidv4(),
      file,
      progress: 0,
    }));

    setUploadingImages(prev => [...prev, ...newUploadingImages]);

    // Upload files
    for (const uploadingImage of newUploadingImages) {
      try {
        // Simulate progress for better UX
        const progressInterval = setInterval(() => {
          setUploadingImages(prev => 
            prev.map(img => 
              img.id === uploadingImage.id 
                ? { ...img, progress: Math.min(img.progress + 10, 90) }
                : img
            )
          );
        }, 100);

        const url = await uploadImage(uploadingImage.file);

        clearInterval(progressInterval);

        // Update uploading state with success
        setUploadingImages(prev => 
          prev.map(img => 
            img.id === uploadingImage.id 
              ? { ...img, progress: 100, url }
              : img
          )
        );

        // Add to final images
        const newImages = [...images, url];
        setImages(newImages);
        onImagesChange(newImages);

        // Remove from uploading after a short delay
        setTimeout(() => {
          setUploadingImages(prev => prev.filter(img => img.id !== uploadingImage.id));
        }, 1000);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        
        setUploadingImages(prev => 
          prev.map(img => 
            img.id === uploadingImage.id 
              ? { ...img, error: errorMessage }
              : img
          )
        );

        toast.error(`Failed to upload ${uploadingImage.file.name}: ${errorMessage}`);
      }
    }
  };

  const removeImageLocal = async (imageUrl: string) => {
    // Extract filename from URL (e.g., /uploads/gear-images/uuid.jpg)
    const urlParts = imageUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];

    const response = await fetch(apiUrl(`/api/upload?fileName=${encodeURIComponent(fileName)}`), {
      method: 'DELETE',
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Delete failed');
    }
  };

  const removeImageSupabase = async (imageUrl: string) => {
    // Extract file path from URL to delete from storage
    const urlParts = imageUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const filePath = `gear-images/${fileName}`;

    await supabase.storage
      .from('images')
      .remove([filePath]);
  };

  const removeImage = async (imageUrl: string) => {
    try {
      // Check if it's a local URL or Supabase URL
      const isLocalUrl = imageUrl.startsWith('/uploads/');

      if (isLocalUrl) {
        await removeImageLocal(imageUrl);
      } else {
        await removeImageSupabase(imageUrl);
      }

      const newImages = images.filter(url => url !== imageUrl);
      setImages(newImages);
      onImagesChange(newImages);

      toast.success('Image removed successfully');
    } catch (error) {
      toast.error((error as Error)?.message || 'Failed to remove image');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Gear Images ({images.length}/{maxImages})
      </label>
      
      {/* Upload Area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragOver 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
        >
          <path
            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="mt-4">
          <p className="text-sm text-gray-600">
            <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500 mt-1">
            PNG, JPG, WEBP up to {maxSizePerImage}MB each
          </p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={allowedTypes.join(',')}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Uploading Images */}
      {uploadingImages.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Uploading...</h4>
          {uploadingImages.map((uploadingImage) => (
            <div key={uploadingImage.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{uploadingImage.file.name}</p>
                {uploadingImage.error ? (
                  <p className="text-sm text-red-600">{uploadingImage.error}</p>
                ) : (
                  <div className="mt-1">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadingImage.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Images */}
      {images.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Uploaded Images</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((imageUrl, index) => (
              <div key={index} className="relative group aspect-square">
                <Image
                  src={imageUrl}
                  alt={`Gear image ${index + 1}`}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover rounded-lg border border-gray-200"
                />
                <button
                  onClick={() => removeImage(imageUrl)}
                  className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                  title="Remove image"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}