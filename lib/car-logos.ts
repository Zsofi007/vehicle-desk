export const CAR_LOGO_BASE_PATH = "/car-logos/optimized";

/**
 * Some manufacturers need manual overrides to match the dataset filenames.
 * Keys should match the `car-info` make strings.
 */
export const carLogoSlugOverrides: Record<string, string> = {
  // Add overrides here when you find mismatches.
  // Example:
  // "Mercedes Benz": "mercedes-benz",
};

function slugifyMake(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/&/g, "and")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Returns the public URL to a manufacturer's logo.
 *
 * Note: We deliberately do not check file existence at runtime. The UI can
 * render the image and hide it on error.
 */
export function getCarLogoSrc(make: string) {
  const trimmed = make.trim();
  if (!trimmed) return null;

  const override = carLogoSlugOverrides[trimmed];
  const slug = override ?? slugifyMake(trimmed);
  if (!slug) return null;

  return `${CAR_LOGO_BASE_PATH}/${slug}.png`;
}

