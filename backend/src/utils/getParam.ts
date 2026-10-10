/**
 * Safely extract a single string parameter from req.params or req.query.
 * Express types can include string | string[] | ParsedQs | ParsedQs[] etc.
 * Returns empty string if not found (for param ID use cases where undefined is inconvenient).
 */
export function getParam(req: any, key: string): string {
  const val = req.params?.[key] ?? req.query?.[key];
  if (Array.isArray(val)) return val[0] ?? "";
  if (typeof val === "string") return val;
  if (val && typeof val === "object" && "toString" in val) return String(val);
  return "";
}
