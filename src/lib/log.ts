// Error logging that cannot leak personal data.
//
// Several error objects in this app carry user content in their own fields:
// Resend validation errors name the recipient address, AI SDK errors embed the
// model's raw output (i.e. the uploaded CV), and Prisma constraint errors echo
// the field values that failed. Logging such an object whole puts personal data
// into container stdout — a store that lives outside the database, outside
// account deletion, and outside any retention policy.
//
// safeError() reduces any thrown value to its class plus, where present, a
// machine-readable code: enough to identify the failure, never enough to
// identify a person. Reach for the full object only in local debugging.
export function safeError(err: unknown): string {
  if (err == null || typeof err !== "object") return "UnknownError";

  const e = err as { name?: unknown; code?: unknown; statusCode?: unknown };

  return [
    typeof e.name === "string" && e.name ? e.name : "Error",
    e.code != null ? `code=${String(e.code)}` : null,
    e.statusCode != null ? `status=${String(e.statusCode)}` : null,
  ]
    .filter(Boolean)
    .join(" ");
}
