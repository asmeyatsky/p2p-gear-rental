import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { authenticateRequest } from '@/lib/auth-middleware';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'gear-images');

// Validate file magic bytes to prevent MIME type spoofing
function isValidImageSignature(header: Uint8Array): boolean {
  // JPEG: FF D8 FF
  if (header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF) return true;
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47) return true;
  // WebP: RIFF....WEBP
  if (header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46 &&
      header[8] === 0x57 && header[9] === 0x45 && header[10] === 0x42 && header[11] === 0x50) return true;
  return false;
}

// Ensure upload directory exists
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require authentication for uploads
    await authenticateRequest(request);

    await ensureUploadDir();

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file MIME type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Read file bytes once for both validation and saving
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate file magic bytes to prevent MIME type spoofing
    const header = new Uint8Array(bytes).slice(0, 12);
    if (!isValidImageSignature(header)) {
      return NextResponse.json(
        { error: 'File content does not match an allowed image format.' },
        { status: 400 }
      );
    }

    // Derive extension from validated MIME type (ignore user-supplied extension)
    const mimeToExt: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    };
    const fileExt = mimeToExt[file.type] || 'jpg';
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    await writeFile(filePath, buffer);

    // Return the public URL
    const publicUrl = `/uploads/gear-images/${fileName}`;

    return NextResponse.json({
      url: publicUrl,
      fileName,
    });
  } catch (error: any) {
    if (error?.statusCode === 401) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Require authentication for deletions
    await authenticateRequest(request);

    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('fileName');

    if (!fileName) {
      return NextResponse.json(
        { error: 'No fileName provided' },
        { status: 400 }
      );
    }

    // Sanitize filename to prevent directory traversal
    const sanitizedFileName = path.basename(fileName);
    const filePath = path.join(UPLOAD_DIR, sanitizedFileName);

    // Check if file exists and delete
    if (existsSync(filePath)) {
      await unlink(filePath);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.statusCode === 401) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
