import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";

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

/**
 * Delete every object under a key prefix. Returns how many were removed.
 *
 * Used by account deletion, where the files have to go even though nothing in
 * the database points at them any more.
 *
 * ListObjectsV2 returns at most 1000 keys per page and DeleteObjects accepts at
 * most 1000, so paging the listing batches the deletes for free — one delete
 * call per page, no manual chunking.
 */
export async function blobDeletePrefix(prefix: string): Promise<number> {
  // An empty prefix matches the whole bucket. Callers build this from a userId,
  // so refuse rather than trust that it was non-empty.
  if (!prefix.trim()) {
    throw new Error("blobDeletePrefix requires a non-empty prefix");
  }

  let continuationToken: string | undefined;
  let deleted = 0;

  do {
    const listed = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }),
    );

    const keys = (listed.Contents ?? [])
      .map((o) => o.Key)
      .filter((k): k is string => Boolean(k));

    if (keys.length) {
      const result = await client.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true },
        }),
      );

      // DeleteObjects reports per-key failures in the body rather than throwing,
      // so a partial failure looks like success unless it is checked. Leaving a
      // file behind here is exactly the bug this function exists to fix.
      if (result.Errors?.length) {
        throw new Error(
          `Failed to delete ${result.Errors.length} object(s) under "${prefix}": ` +
            result.Errors.map((e) => `${e.Key} (${e.Code})`).join(", "),
        );
      }

      deleted += keys.length;
    }

    continuationToken = listed.IsTruncated ? listed.NextContinuationToken : undefined;
  } while (continuationToken);

  return deleted;
}
