import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const client = new S3Client({
  region: "auto",
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
});

const bucket = process.env.S3_BUCKET!;
const publicUrl = process.env.S3_PUBLIC_URL!;

export type BlobPutOptions = {
  contentType?: string;
};

/**
 * Upload a file to S3-compatible storage (MinIO).
 * Returns the public URL of the stored file.
 */
export async function blobPut(
  key: string,
  body: ArrayBuffer | Blob,
  options: BlobPutOptions = {},
): Promise<string> {
  const bytes = body instanceof Blob ? new Uint8Array(await body.arrayBuffer()) : new Uint8Array(body);
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: bytes,
      ContentType: options.contentType,
    }),
  );
  return `${publicUrl}/${key}`;
}

/** Delete a blob by its public URL. */
export async function blobDelete(url: string): Promise<void> {
  const key = url.startsWith(`${publicUrl}/`) ? url.slice(publicUrl.length + 1) : url;
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
