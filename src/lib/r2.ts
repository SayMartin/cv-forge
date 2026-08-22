import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";

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

/** Delete a blob by its public URL. */
export async function blobDelete(url: string): Promise<void> {
  const key = url.startsWith(`${publicUrl}/`) ? url.slice(publicUrl.length + 1) : url;
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

/**
 * Delete every object under a key prefix. Returns how many were removed.
 *
 * Account deletion uses this rather than deleting the URLs recorded in the
 * database, because the database is not a complete record of what is in the
 * bucket — see `src/lib/user-deletion.ts`.
 *
 * ListObjectsV2 returns at most 1000 keys per page and DeleteObjects accepts at
 * most 1000, so paging the listing batches the deletes for free: one delete call
 * per page, no manual chunking. Both are covered by an `Object Read & Write`
 * token; no bucket-level permission is needed.
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

      // DeleteObjects reports per-key failures in the response body rather than
      // throwing, so a partial failure looks like success unless it is checked.
      // A file left behind here is precisely the bug this exists to prevent.
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
