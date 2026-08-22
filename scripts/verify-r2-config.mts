/**
 * Checks that an R2 configuration can do everything the app needs, and nothing
 * it does not.
 *
 *   node --experimental-strip-types --env-file=.env.local scripts/verify-r2-config.mts
 *
 * Writes one tiny object under a random self-test key and removes it again.
 * Pass --list-only to skip every write, which makes it safe to aim at the
 * production bucket.
 *
 * The app needs exactly two operations — PutObject (avatar upload) and
 * DeleteObject (removing one image, and account deletion). It deliberately does
 * NOT use ListObjectsV2: listing is bucket-level and would push the token above
 * object-level rights. A failing LIST below is therefore informational, not a
 * problem.
 *
 * The axis that does matter is addressing style. src/lib/r2.ts sets
 * forcePathStyle: true, so the "path style" column is the one that has to pass.
 */
import { randomBytes } from "node:crypto";
import {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

const bucket = process.env.S3_BUCKET;
const endpoint = process.env.S3_ENDPOINT;

if (!bucket || !endpoint) {
  console.error("S3_BUCKET / S3_ENDPOINT missing — run with --env-file=.env.local");
  process.exit(1);
}

const host = new URL(endpoint).host;
console.log(`Bucket   : ${bucket}`);
// Host and bucket only — never the credentials.
console.log(`Endpoint : ${host}`);
console.log(`Jurisdictional endpoint: ${host.includes(".eu.") ? "yes (.eu.)" : "no"}`);

const listOnly = process.argv.includes("--list-only");
if (listOnly) console.log("(--list-only: nothing will be written)");
console.log();

function makeClient(forcePathStyle: boolean) {
  return new S3Client({
    region: "auto",
    endpoint,
    forcePathStyle,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
  });
}

async function attempt(label: string, fn: () => Promise<unknown>) {
  try {
    await fn();
    console.log(`    OK        ${label}`);
    return true;
  } catch (err) {
    const e = err as { name?: string; Code?: string; $metadata?: { httpStatusCode?: number } };
    console.log(
      `    FAILED    ${label} — ${e.Code ?? e.name} (HTTP ${e.$metadata?.httpStatusCode ?? "?"})`,
    );
    return false;
  }
}

const works: Record<string, boolean> = {};

for (const [style, forcePathStyle] of [
  ["path style      (what src/lib/r2.ts uses)", true],
  ["virtual-hosted  (forcePathStyle: false)", false],
] as const) {
  console.log(`  ${style}`);
  const client = makeClient(forcePathStyle);
  const key = `avatars/__selftest_${randomBytes(4).toString("hex")}.txt`;

  await attempt("LIST      (not used by the app)", () =>
    client.send(new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 1 })),
  );

  if (!listOnly) {
    const put = await attempt("PUT       (avatar upload)", () =>
      client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: "selftest" })),
    );
    const del = put
      ? await attempt("DELETE    (account deletion)", () =>
          client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key })),
        )
      : false;
    works[String(forcePathStyle)] = put && del;
  }
  console.log();
}

if (listOnly) process.exit(0);

console.log("Verdict:");
if (works["true"]) {
  console.log("  This configuration works as the app is written. Nothing to change.");
} else if (works["false"]) {
  console.log("  PUT/DELETE work ONLY with virtual-hosted addressing, but src/lib/r2.ts");
  console.log("  sets forcePathStyle: true. Remove that option, or avatar upload and");
  console.log("  account deletion will both fail against this bucket.");
} else {
  console.log("  Neither addressing style can write or delete. The credentials or the");
  console.log("  bucket scope are wrong — check that the token is scoped to this bucket");
  console.log("  and issued as 'Object Read & Write'.");
}
process.exit(works["true"] || works["false"] ? 0 : 1);
