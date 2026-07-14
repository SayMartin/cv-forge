import { put, del, head } from "@vercel/blob";

export type BlobPutOptions = {
  contentType?: string;
};

/**
 * Upload a file to Vercel Blob.
 * Returns the public URL of the stored file.
 */
export async function blobPut(
  key: string,
  body: ArrayBuffer | Blob,
  options: BlobPutOptions = {},
): Promise<string> {
  const blob = body instanceof Blob ? body : new Blob([body]);
  const { url } = await put(key, blob, {
    access: "public",
    contentType: options.contentType,
    addRandomSuffix: false,
  });
  return url;
}

/** Check if a blob exists. Returns null if the key does not exist. */
export async function blobHead(url: string) {
  return head(url);
}

/** Delete a blob by URL. */
export async function blobDelete(url: string): Promise<void> {
  await del(url);
}
