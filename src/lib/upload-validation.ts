import crypto from 'crypto';
import path from 'path';
import { prisma } from '@/lib/prisma';

const UPLOAD_DIR = '/tmp/uploads';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png', 
  'image/webp',
];

// Magic numbers for file type verification
const FILE_SIGNATURES = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
  'image/webp': [0x52, 0x49, 0x46, 0x46],
};

export async function validateFileUpload(file: File, userId?: string): Promise<{ valid: boolean; error?: string }> {
  try {
    // Size validation
    if (file.size > MAX_FILE_SIZE) {
      return { 
        valid: false, 
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` 
      };
    }

    // MIME type validation
    const mimeType = file.type.toLowerCase();
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return { 
        valid: false, 
        error: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}` 
      };
    }

    // Magic number verification (actual file content)
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    
    let isValidMimeType = false;
    for (const [type, signature] of Object.entries(FILE_SIGNATURES)) {
      if (mimeType.startsWith(type) && 
          bytes.length >= signature.length &&
          signature.every((byte, index) => byte === bytes[index])) {
        isValidMimeType = true;
        break;
      }
    }

    if (!isValidMimeType) {
      return { 
        valid: false, 
        error: 'File content does not match its extension' 
      };
    }

    // Filename security validation
    const originalName = file.name;
    const sanitizedName = sanitizeFileName(originalName);
    
    if (sanitizedName !== originalName) {
      return { 
        valid: false, 
        error: 'Invalid filename characters detected' 
      };
    }

    // Rate limiting check
    if (userId) {
      const uploadCount = await getUserUploadCount(userId);
      if (uploadCount > 10) { // Max 10 uploads per hour
        return { 
          valid: false, 
          error: 'Too many upload attempts. Please try again later.' 
        };
      }
    }

    return { valid: true };
    
  } catch (error) {
    return { 
      valid: false, 
      error: `File validation error: ${error.message}` 
    };
  }
}

function sanitizeFileName(fileName: string): string {
  // Remove dangerous characters
  const cleanName = fileName
    .replace(/[<>:"\\|?*]/g, '') // Remove <>:"\/?*
    .replace(/\.\./g, '') // Remove directory traversal
    .replace(/^\/+|\/+$/g, ''); // Remove leading/trailing slashes
    .replace(/[^\w\s\-.]/g, ''); // Allow only alphanumeric, spaces, hyphens, dots
    .substring(0, 100); // Limit length
  
  return cleanName;
}

async function getUserUploadCount(userId: string): Promise<number> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  const uploads = await prisma.gear.findMany({
    where: {
      userId,
      createdAt: {
        gte: oneHourAgo
      }
    },
    select: { id: true }
  });
  
  return uploads.length;
}

export function generateSecureFileName(originalName: string, userId?: string): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  const sanitized = sanitizeFileName(originalName);
  const extension = path.extname(sanitized);
  const baseName = path.basename(sanitized, extension);
  
  return `${userId ? `${userId}_` : ''}${baseName}_${timestamp}_${random}${extension}`;
}

export class FileUploadError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'FileUploadError';
    this.code = code;
  }
}