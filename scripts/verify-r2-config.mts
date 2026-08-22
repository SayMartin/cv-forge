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
 * The app needs four operations: PutObject (avatar upload), DeleteObject
 * (removing one image), and ListObjectsV2 + DeleteObjects (account deletion,
 * which clears the whole avatars/<userId>/ prefix). All four are covered by an
 * Object Read & Write token.
 *
 * The axis that does matter is addressing style. src/lib/r2.ts uses
 * virtual-hosted addressing, so that is the column which has to pass. Path
 * style is shown alongside it because it fails in a dangerous way against R2 —
 * a bucket the token is not scoped to is written as a *key* rather than
 * refused — which is exactly why the app no longer uses it.
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
  ["virtual-hosted  (what src/lib/r2.ts uses)", false],
  ["path style      (no longer used — shown for contrast)", true],
] as const) {
  console.log(`  ${style}`);
  const client = makeClient(forcePathStyle);
  const key = `avatars/__selftest_${randomBytes(4).toString("hex")}.txt`;

  const list = await attempt("LIST      (account deletion)", () =>
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
    works[String(forcePathStyle)] = list && put && del;
  }
  console.log();
}

if (listOnly) process.exit(0);

console.log("Verdict:");
if (works["false"]) {
  console.log("  Virtual-hosted LIST, PUT and DELETE all work — this configuration is good.");
  if (works["true"]) {
    console.log("  (Path style also succeeded. If the token is scoped to a DIFFERENT");
    console.log("   bucket than S3_BUCKET, that 'success' wrote into the token's bucket");
    console.log("   under a key beginning with the bucket name. Worth a look.)");
  }
} else {
  console.log("  Something the app needs failed under virtual-hosted addressing, which is");
  console.log("  what src/lib/r2.ts uses. Check that the token is scoped to this bucket and");
  console.log("  issued as 'Object Read & Write', and that S3_ENDPOINT carries the right");
  console.log("  jurisdiction segment. Account deletion needs LIST as well as DELETE.");
}
process.exit(works["false"] ? 0 : 1);
