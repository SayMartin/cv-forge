import { auth } from "@/lib/auth";
import { blobPut } from "@/lib/r2";

export const dynamic = "force-dynamic";

// Allowed MIME types for uploads
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "application/pdf",
]);

// Prevent path traversal: only allow alphanumerics, hyphens, underscores, dots, and forward slashes
const SAFE_KEY_RE = /^[\w\-./]+$/;

export async function PUT(request: Request) {
  // Verify session
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Parse and validate the destination key
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  if (!key || !SAFE_KEY_RE.test(key) || key.includes("..")) {
    return new Response("Invalid or missing 'key' query parameter", {
      status: 400,
    });
  }

  const contentType = request.headers.get("content-type") ?? "";
  // Strip params (e.g. "image/jpeg; boundary=...") before checking
  const mimeType = contentType.split(";")[0].trim();

  if (!ALLOWED_TYPES.has(mimeType)) {
    return new Response("Unsupported media type", { status: 415 });
  }

  const buffer = await request.arrayBuffer();
  if (buffer.byteLength === 0) {
    return new Response("Empty body", { status: 400 });
  }

  const url = await blobPut(key, buffer, { contentType: mimeType });

  return Response.json({ url }, { status: 201 });
}
