/**
 * AWS S3 configuration, upload, and pre-signed URL utility.
 */
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

let s3Client = null;

function getClient() {
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3Client;
}

/**
 * Uploads a file to AWS S3, removes local temp file, and returns the S3 key.
 * @param {string} filePath - Local path of the file to upload
 * @param {string} folder - S3 folder ('kyc' or 'proofs')
 * @returns {Promise<string>} - The S3 object key (e.g. 'kyc/uuid.jpg')
 */
export async function uploadToS3(filePath, folder = 'misc') {
  const client = getClient();

  try {
    const ext = path.extname(filePath);
    const uniqueId = crypto.randomUUID();
    // Files go directly into kyc/ or proofs/ at the root of the bucket
    const s3Key = `${folder}/${uniqueId}${ext}`;
    const bucketName = process.env.AWS_S3_BUCKET_NAME;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      Body: fs.readFileSync(filePath),
      ContentType: getContentType(ext),
    });

    await client.send(command);

    // Clean up local temp file after successful upload
    fs.unlink(filePath, (err) => {
      if (err) console.warn('Could not delete temp file:', filePath);
    });

    // Return the s3 key so we can generate signed URLs on-demand
    // Format stored in DB: s3://bucket/key
    return `s3://${bucketName}/${s3Key}`;
  } catch (err) {
    fs.unlink(filePath, () => {});
    throw err;
  }
}

/**
 * Generates a temporary pre-signed URL for viewing a private S3 object.
 * @param {string} s3Uri - The s3:// URI stored in DB, e.g. 's3://bucket/kyc/uuid.jpg'
 * @param {number} expiresInSeconds - How long the URL is valid (default: 1 hour)
 * @returns {Promise<string>} - A temporary public URL
 */
export async function getS3SignedUrl(s3Uri, expiresInSeconds = 3600) {
  const client = getClient();

  // If it's not S3 at all (e.g. Cloudinary or local relative path), return as-is
  const isS3 = s3Uri.startsWith('s3://') || s3Uri.includes('amazonaws.com');
  if (!isS3) return s3Uri;

  try {
    let bucket, key;

    if (s3Uri.startsWith('s3://')) {
      const withoutScheme = s3Uri.replace('s3://', '');
      const slashIdx = withoutScheme.indexOf('/');
      bucket = withoutScheme.substring(0, slashIdx);
      key = withoutScheme.substring(slashIdx + 1);
    } else {
      // Parse https://bucket.s3.region.amazonaws.com/key OR https://s3.region.amazonaws.com/bucket/key
      const url = new URL(s3Uri);
      const hostParts = url.hostname.split('.');
      
      if (hostParts[0] !== 's3' && hostParts[1] === 's3') {
        // bucket.s3.region.amazonaws.com
        bucket = hostParts[0];
        key = url.pathname.substring(1); // remove leading slash
      } else {
        // s3.region.amazonaws.com/bucket/key
        const pathParts = url.pathname.substring(1).split('/');
        bucket = pathParts[0];
        key = pathParts.slice(1).join('/');
      }
    }

    console.log(`[S3 Debug] Signing for Bucket: ${bucket}, Key: ${key}`);

    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const url = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
    
    console.log(`[S3 Debug] Generated Signed URL: ${url.substring(0, 100)}...`);
    return url;
  } catch (err) {
    console.error('[S3 Debug] Error parsing/signing URL:', err);
    throw err;
  }
}

function getContentType(ext) {
  const map = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.pdf': 'application/pdf',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
  };
  return map[ext.toLowerCase()] || 'application/octet-stream';
}

export default getClient;
