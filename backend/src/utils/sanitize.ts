/**
 * HTML sanitizer for stored lesson note content.
 * Allowlist based; strips scripts/styles/forms/iframes and global style/class attributes.
 */

const ALLOWED_TAGS = new Set([
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "ul", "ol", "li",
  "strong", "em", "b", "i", "u",
  "br", "hr",
  "table", "thead", "tbody", "tr", "th", "td",
  "blockquote", "pre", "code",
]);

// No global style/class — those enable stored XSS via event handlers and CSS abuse
const ALLOWED_ATTRS: Record<string, Set<string>> = {
  "*": new Set(["class"]),
};

const DANGEROUS_PROTOCOLS = /(?:javascript|data|vbscript|file):/i;

function escapeAttr(val: string): string {
  return val
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function sanitizeHtml(dirty: string): string {
  if (!dirty || typeof dirty !== "string") return "";

  let cleaned = dirty;

  // Remove entire dangerous blocks including malformed unclosed tags (greedy fallback)
  cleaned = cleaned.replace(/<script\b[\s\S]*?(?:<\/script>|$)/gi, "");
  cleaned = cleaned.replace(/<style\b[\s\S]*?(?:<\/style>|$)/gi, "");
  cleaned = cleaned.replace(/<iframe\b[\s\S]*?(?:<\/iframe>|$)/gi, "");
  cleaned = cleaned.replace(/<object\b[\s\S]*?(?:<\/object>|$)/gi, "");
  cleaned = cleaned.replace(/<embed\b[^>]*>/gi, "");
  cleaned = cleaned.replace(/<form\b[\s\S]*?(?:<\/form>|$)/gi, "");
  cleaned = cleaned.replace(/<svg\b[\s\S]*?(?:<\/svg>|$)/gi, "");
  cleaned = cleaned.replace(/<math\b[\s\S]*?(?:<\/math>|$)/gi, "");

  // Strip event handlers and dangerous tags that may remain malformed
  cleaned = cleaned.replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  cleaned = cleaned.replace(/<\/?(?:script|style|iframe|object|embed|form|svg|math)\b[^>]*>/gi, "");

  // Process remaining tags
  cleaned = cleaned.replace(
    /<([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g,
    (_match, tagName: string, attrs: string) => {
      const tag = tagName.toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) return "";

      const filteredAttrs = attrs.replace(
        /([a-zA-Z-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+))/g,
        (_attrMatch: string, attrName: string, dqVal?: string, sqVal?: string, unquotedVal?: string) => {
          const name = attrName.toLowerCase();
          if (name.startsWith("on")) return "";
          const allowedForTag = ALLOWED_ATTRS["*"]?.has(name) || ALLOWED_ATTRS[tag]?.has(name);
          if (!allowedForTag) return "";

          const val = dqVal ?? sqVal ?? unquotedVal ?? "";
          if (["href", "src", "action", "formaction", "xlink:href"].includes(name)) {
            if (DANGEROUS_PROTOCOLS.test(val)) return "";
          }

          return ` ${attrName}="${escapeAttr(val)}"`;
        }
      );

      return `<${tagName}${filteredAttrs}>`;
    }
  );

  // Remove closing tags for stripped elements
  cleaned = cleaned.replace(/<\/([a-zA-Z][a-zA-Z0-9]*)>/g, (_match, tagName: string) => {
    return ALLOWED_TAGS.has(tagName.toLowerCase()) ? _match : "";
  });

  // Remove leftover style tags content if any slipped through as text markers
  cleaned = cleaned.replace(/javascript\s*:/gi, "");

  return cleaned;
}
