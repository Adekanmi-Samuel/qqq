/**
 * Generate a URL-friendly slug from a school name.
 * Handles Nigerian school name patterns like "St. John's College, Lagos"
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, "") // Remove apostrophes
    .replace(/[&]/g, "and") // & → and
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, "") // Trim leading/trailing hyphens
    .replace(/-+/g, "-"); // Collapse multiple hyphens
}

/**
 * Generate a unique slug by appending a suffix if the slug already exists.
 */
export async function generateUniqueSlug(
  name: string,
  exists: (slug: string) => Promise<boolean>
): Promise<string> {
  const base = generateSlug(name);
  let slug = base;
  let counter = 1;

  while (await exists(slug)) {
    slug = `${base}-${counter}`;
    counter++;
  }

  return slug;
}
