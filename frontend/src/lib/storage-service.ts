import crypto from "crypto";
import fs from "fs";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export interface UploadResult {
  url: string;
  filename: string;
  sizeBytes: number;
  mimeType: string;
}

export const ALLOWED_MIME_TYPES = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Validates file metadata against allowed MIME types and maximum size constraints.
 */
export function validateImageMetadata(file: { size: number; type: string }): {
  valid: boolean;
  error?: { code: string; message: string };
} {
  if (!file) {
    return {
      valid: false,
      error: { code: "NO_FILE_PROVIDED", message: "Please select an image file to upload." },
    };
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return {
      valid: false,
      error: {
        code: "INVALID_FILE_TYPE",
        message: "Unsupported image format. Allowed formats are JPEG, PNG, and WebP.",
      },
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: {
        code: "FILE_TOO_LARGE",
        message: `File size exceeds the 5 MB maximum limit (${(file.size / (1024 * 1024)).toFixed(2)} MB).`,
      },
    };
  }

  return { valid: true };
}

/**
 * Checks whether S3 or Cloudflare R2 cloud storage credentials are configured.
 */
export function isCloudStorageConfigured(): boolean {
  const bucket = process.env.S3_BUCKET || process.env.R2_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
  return Boolean(bucket && accessKeyId && secretAccessKey);
}

/**
 * Returns the resolved directory path for local uploaded assets.
 * Gracefully resolves in root monorepo or frontend workspace contexts.
 */
export function getLocalStorageDirectory(): string {
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, "public"))) {
    return path.join(cwd, "public", "uploads", "products");
  }
  if (fs.existsSync(path.join(cwd, "frontend", "public"))) {
    return path.join(cwd, "frontend", "public", "uploads", "products");
  }
  return path.join(cwd, "public", "uploads", "products");
}

/**
 * Generates a collision-resistant unique filename for uploaded atelier assets.
 * Format: {timestamp}-{randomHex6}.{extension}
 */
export function generateUniqueFilename(extension: string): string {
  const randomSuffix = crypto.randomBytes(6).toString("hex");
  const sanitizedExtension = extension.replace(/^\./, "").toLowerCase();
  return `${Date.now()}-${randomSuffix}.${sanitizedExtension}`;
}

/**
 * Saves an uploaded buffer to either Cloud Storage (S3 / Cloudflare R2) or Local Filesystem.
 */
export async function saveUploadedFile(
  buffer: Buffer,
  originalFilename: string,
  mimeType: string
): Promise<UploadResult> {
  const extension = ALLOWED_MIME_TYPES.get(mimeType) || "jpg";
  const filename = generateUniqueFilename(extension);
  const sizeBytes = buffer.length;

  if (isCloudStorageConfigured()) {
    const bucket = (process.env.S3_BUCKET || process.env.R2_BUCKET)!;
    const region = process.env.S3_REGION || process.env.AWS_REGION || "auto";
    const endpoint = process.env.S3_ENDPOINT || process.env.R2_ENDPOINT;
    const accessKeyId = (process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID)!;
    const secretAccessKey = (process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY)!;

    const s3Client = new S3Client({
      region,
      ...(endpoint ? { endpoint } : {}),
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const s3Key = `products/${filename}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: s3Key,
        Body: buffer,
        ContentType: mimeType,
        ACL: "public-read",
      })
    );

    const cdnBase = process.env.CDN_BASE_URL || process.env.S3_PUBLIC_DOMAIN;
    const url = cdnBase
      ? `${cdnBase.replace(/\/+$/, "")}/${s3Key}`
      : `https://${bucket}.s3.${region}.amazonaws.com/${s3Key}`;

    return {
      url,
      filename,
      sizeBytes,
      mimeType,
    };
  }

  // Local Filesystem Storage Fallback
  const targetDir = getLocalStorageDirectory();
  await mkdir(targetDir, { recursive: true });

  const targetPath = path.join(targetDir, filename);
  await writeFile(targetPath, buffer);

  const url = `/uploads/products/${filename}`;

  return {
    url,
    filename,
    sizeBytes,
    mimeType,
  };
}
