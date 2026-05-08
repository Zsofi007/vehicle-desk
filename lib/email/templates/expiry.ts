import { escapeHtml, interpolate, type EmailTemplate, type Lang } from "./_shared";

type TemplateVars = {
  license_plate: string;
  items: Array<{
    type: string;
    date: string;
  }>;
  vehicleUrl?: string;
};

function expiryEmailHtml(opts: {
  subject: string;
  intro: string;
  labels: { vehicle: string; items: string; item: string; date: string };
  vars: { license_plate: string; items: Array<{ type: string; date: string }> };
  vehicleUrl?: string;
  vehicleCtaLabel?: string;
  footer: string;
}) {
  const licensePlate = escapeHtml(opts.vars.license_plate);
  const safeItems = opts.vars.items.map((it) => ({
    type: escapeHtml(it.type),
    date: escapeHtml(it.date),
  }));

  const preheader = escapeHtml(opts.intro);
  const vehicleUrl = opts.vehicleUrl ? escapeHtml(opts.vehicleUrl) : null;
  const vehicleCtaLabel = escapeHtml(opts.vehicleCtaLabel ?? "Open vehicle");
  const rows = safeItems
    .map(
      (it) => `
                        <tr>
                          <td style="padding:6px 0;font-size:13px;line-height:18px;color:#1c1917;font-weight:600;">${it.type}</td>
                          <td align="right" style="padding:6px 0;font-size:13px;line-height:18px;color:#1c1917;font-weight:600;">${it.date}</td>
                        </tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>${escapeHtml(opts.subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f7f7f6;color:#1c1917;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,'Apple Color Emoji','Segoe UI Emoji';">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      ${preheader}
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="border-collapse:collapse;max-width:600px;width:100%;">
            <tr>
              <td style="padding:0 0 12px 0;">
                <div style="font-size:14px;line-height:20px;color:#57534e;font-weight:600;letter-spacing:0.2px;">
                  Vehicle Desk
                </div>
              </td>
            </tr>
            <tr>
              <td style="background:#ffffff;border:1px solid #e7e5e4;border-radius:12px;padding:20px;">
                <h1 style="margin:0 0 8px 0;font-size:18px;line-height:24px;color:#1c1917;">
                  ${escapeHtml(opts.subject)}
                </h1>
                <p style="margin:0 0 16px 0;font-size:14px;line-height:20px;color:#44403c;">
                  ${escapeHtml(opts.intro)}
                </p>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <tr>
                    <td style="padding:10px 12px;border:1px solid #e7e5e4;border-radius:10px;background:#fafaf9;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                        <tr>
                          <td style="padding:6px 0;font-size:12px;line-height:16px;color:#78716c;">${escapeHtml(opts.labels.vehicle)}</td>
                          <td align="right" style="padding:6px 0;font-size:13px;line-height:18px;color:#1c1917;font-weight:600;letter-spacing:0.3px;">${licensePlate}</td>
                        </tr>
                        <tr>
                          <td style="padding:10px 0 6px 0;font-size:12px;line-height:16px;color:#78716c;">${escapeHtml(opts.labels.items)}</td>
                          <td align="right" style="padding:10px 0 6px 0;font-size:12px;line-height:16px;color:#78716c;">${escapeHtml(opts.labels.date)}</td>
                        </tr>
                        ${rows}
                      </table>
                    </td>
                  </tr>
                </table>

                ${
                  vehicleUrl
                    ? `
                <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:16px 0 0 0;">
                  <tr>
                    <td>
                      <a href="${vehicleUrl}" style="display:inline-block;background:#1c1917;color:#ffffff;text-decoration:none;padding:10px 12px;border-radius:10px;font-size:13px;line-height:18px;font-weight:600;">
                        ${vehicleCtaLabel}
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:10px 0 0 0;font-size:12px;line-height:18px;color:#78716c;word-break:break-word;">
                  ${vehicleUrl}
                </p>`
                    : ""
                }

                <p style="margin:16px 0 0 0;font-size:12px;line-height:18px;color:#78716c;">
                  ${escapeHtml(opts.footer)}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function expiryEmailTemplate(lang: Lang, vars: TemplateVars): EmailTemplate {
  const key = lang === "hu" ? "hu" : lang === "ro" ? "ro" : "en";
  const first = vars.items[0];
  const primary = first ? { type: first.type, date: first.date } : { type: "", date: "" };

  if (key === "hu") {
    const subject = `Közelgő lejáratok – ${vars.license_plate}`;
    const textLines = vars.items.map((it) => `- ${it.type}: ${it.date}`);
    const text = [
      `A(z) ${vars.license_plate} rendszámú járműnél közeleg(nek) lejárat(ok):`,
      ...textLines,
      "",
      "Beállításokban letilthatod az e-mail értesítéseket.",
    ].join("\n");
    return {
      subject,
      text,
      html: expiryEmailHtml({
        subject,
        intro: interpolate("A(z) {{license_plate}} járműnél közeleg a(z) {{type}} lejárata.", {
          license_plate: vars.license_plate,
          ...primary,
        }),
        labels: { vehicle: "Jármű", items: "Tétel", item: "Tétel", date: "Lejárat" },
        vars: { license_plate: vars.license_plate, items: vars.items },
        vehicleUrl: vars.vehicleUrl,
        vehicleCtaLabel: "Jármű megnyitása",
        footer: "Ez egy automatikus értesítés a lejáratokról.",
      }),
    };
  }

  if (key === "ro") {
    const subject = `Expirări în curând – ${vars.license_plate}`;
    const textLines = vars.items.map((it) => `- ${it.type}: ${it.date}`);
    const text = [
      `Vehiculul ${vars.license_plate} are următoarele elemente care expiră:`,
      ...textLines,
      "",
      "Poți dezactiva aceste email-uri în Setări.",
    ].join("\n");
    return {
      subject,
      text,
      html: expiryEmailHtml({
        subject,
        intro: interpolate("Vehiculul {{license_plate}} are {{type}} care expiră în curând.", {
          license_plate: vars.license_plate,
          ...primary,
        }),
        labels: { vehicle: "Vehicul", items: "Element", item: "Element", date: "Data expirării" },
        vars: { license_plate: vars.license_plate, items: vars.items },
        vehicleUrl: vars.vehicleUrl,
        vehicleCtaLabel: "Deschide vehiculul",
        footer: "Aceasta este o notificare automată despre expirări.",
      }),
    };
  }

  const subject = `Upcoming expiries – ${vars.license_plate}`;
  const textLines = vars.items.map((it) => `- ${it.type}: ${it.date}`);
  const text = [
    `Your vehicle ${vars.license_plate} has upcoming expiries:`,
    ...textLines,
    "",
    "You can disable these emails in Settings.",
  ].join("\n");
  return {
    subject,
    text,
    html: expiryEmailHtml({
      subject,
      intro: interpolate("{{type}} is coming due soon for {{license_plate}}.", {
        license_plate: vars.license_plate,
        ...primary,
      }),
      labels: { vehicle: "Vehicle", items: "Item", item: "Item", date: "Expiry date" },
      vars: { license_plate: vars.license_plate, items: vars.items },
      vehicleUrl: vars.vehicleUrl,
      vehicleCtaLabel: "Open vehicle",
      footer: "This is an automated reminder about upcoming expiries.",
    }),
  };
}

