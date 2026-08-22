/**
 * Smoke test for blobDeletePrefix() against a real R2 bucket.
 *
 * Run it yourself — it needs credentials, which agents may not touch:
 *
 *   node --experimental-strip-types --env-file=.env.local \
 *     scripts/verify-blob-delete-prefix.mts
 *
 * Safety is structural rather than a check that could be wrong: every object it
 * touches sits under a prefix carrying a random suffix generated in this
 * process and written moments earlier by this script. Even aimed at the
 * production bucket it cannot reach an object it did not just create.
 */
import { randomBytes } from "node:crypto";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { blobPut, blobDeletePrefix } from "../src/lib/r2.ts";

const bucket = process.env.S3_BUCKET;
if (!bucket) {
  console.error("S3_BUCKET is not set — run with --env-file=.env.local");
  process.exit(1);
}

const prefix = `avatars/__selftest_${randomBytes(4).toString("hex")}/`;

let failures = 0;
function check(label: string, actual: unknown, expected: unknown) {
  const ok = actual === expected;
  if (!ok) failures++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label} — got ${actual}, expected ${expected}`);
}

// A listing of its own, so the assertions do not lean on the same code path
// they are supposed to be testing.
const probe = new S3Client({
  region: "auto",
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
});

async function countUnderPrefix() {
  const r = await probe.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix }));
  return (r.Contents ?? []).length;
}

console.log(`Bucket : ${bucket}`);
console.log(`Prefix : ${prefix}\n`);

for (let i = 1; i <= 3; i++) {
  await blobPut(`${prefix}${i}.jpg`, new TextEncoder().encode(`test ${i}`).buffer, {
    contentType: "image/jpeg",
  });
}
check("three objects written", await countUnderPrefix(), 3);

check("blobDeletePrefix reports the count", await blobDeletePrefix(prefix), 3);
check("prefix is empty afterwards", await countUnderPrefix(), 0);

// Account deletion can run this twice — the API route and the Better Auth
// delete hook both call it — so a second run must be a harmless no-op.
check("second run returns 0", await blobDeletePrefix(prefix), 0);

// The guard between a bug and an emptied bucket.
let threw = false;
try {
  await blobDeletePrefix("   ");
} catch {
  threw = true;
}
check("empty prefix throws", threw, true);

console.log(`\n${failures === 0 ? "ALL PASSED" : `${failures} FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
