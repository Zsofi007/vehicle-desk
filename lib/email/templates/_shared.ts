export type Lang = "en" | "hu" | "ro";

export type EmailTemplate = {
  subject: string;
  text: string;
  html: string;
};

export function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function interpolate(
  text: string,
  vars: { license_plate: string; type: string; date: string },
) {
  return text
    .replaceAll("{{license_plate}}", vars.license_plate)
    .replaceAll("{{type}}", vars.type)
    .replaceAll("{{date}}", vars.date);
}

