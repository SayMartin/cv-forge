import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

// Virtual-hosted addressing (the SDK default), NOT forcePathStyle: true.
//
// Path style puts the bucket in the path — `/<bucket>/<key>` — and against R2 a
// token scoped to one bucket does not reject a request naming a different one.
// It writes the object instead, taking the whole path as the key, so a mismatch
// between S3_BUCKET and the token's bucket silently lands data in the wrong
// bucket under a key like `other-bucket-name/avatars/...`. That happened on
// 2026-08-22 and left stray objects in the production bucket.
//
// Virtual-hosted puts the bucket in the hostname, where a mismatch fails loudly.
// Do not add forcePathStyle back.
const client = new S3Client({
  region: "auto",
  endpoint: process.env.S3_ENDPOINT,
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

/**
 * Delete a blob by its public URL.
 *
 * This is the only deletion primitive the app has, deliberately. A
 * prefix-delete would need `ListObjectsV2`, which is a bucket-level operation
 * and would force the R2 token up from object-level rights — see
 * `src/lib/user-deletion.ts` for why that trade goes the other way.
 */
export async function blobDelete(url: string): Promise<void> {
  const key = url.startsWith(`${publicUrl}/`) ? url.slice(publicUrl.length + 1) : url;
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
