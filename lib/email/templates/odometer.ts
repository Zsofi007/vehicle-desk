import { escapeHtml, type EmailTemplate, type Lang } from "./_shared";

export function odometerReminderEmailTemplate(
  lang: Lang,
  vars: {
    license_plate: string;
    make?: string;
    model?: string;
    year?: number;
    logoUrl?: string | null;
    quickUrl: string;
  },
): EmailTemplate {
  const key = lang === "hu" ? "hu" : lang === "ro" ? "ro" : "en";
  const safeUrl = escapeHtml(vars.quickUrl);
  const license = vars.license_plate;
  const makeModel = [vars.make, vars.model].filter(Boolean).join(" ").trim();
  const year = typeof vars.year === "number" && vars.year > 0 ? String(vars.year) : "";
  const titleLine = [makeModel, year].filter(Boolean).join(" · ");
  const logoUrl = vars.logoUrl ? escapeHtml(vars.logoUrl) : null;

  const vehicleHeaderHtml = `
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 12px 0;">
              <tr>
                <td style="padding:12px;border:1px solid #e7e5e4;border-radius:10px;background:#fafaf9;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                    <tr>
                      <td width="56" valign="middle" style="padding-right:12px;">
                        ${
                          logoUrl
                            ? `<img src="${logoUrl}" width="48" height="48" alt="" aria-hidden style="display:block;object-fit:contain;border-radius:8px;background:#ffffff;border:1px solid #e7e5e4;" />`
                            : `<div style="width:48px;height:48px;border-radius:8px;background:#e7e5e4;"></div>`
                        }
                      </td>
                      <td valign="middle" style="min-width:0;">
                        ${
                          titleLine
                            ? `<div style="font-size:13px;line-height:18px;color:#44403c;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(titleLine)}</div>`
                            : ""
                        }
                        <div style="margin-top:6px;font-size:14px;line-height:20px;color:#1c1917;font-weight:700;letter-spacing:0.4px;">${escapeHtml(
                          license,
                        )}</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>`;

  if (key === "hu") {
    const subject = "Frissítse a jármű kilométeróra állását";
    const text = [
      `Egy ideje nem történt kilométeróra-frissítés a(z) ${license} rendszámú járműnél.`,
      "",
      "A pontos szervizemlékeztetők érdekében érdemes frissíteni az aktuális kilométeróra állást.",
      "",
      `Frissítés: ${vars.quickUrl}`,
    ].join("\n");
    const html = `<!doctype html>
<html lang="hu">
  <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
  <body style="margin:0;padding:0;background:#f7f7f6;color:#1c1917;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr><td align="center" style="padding:24px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="border-collapse:collapse;max-width:600px;width:100%;">
          <tr><td style="background:#ffffff;border:1px solid #e7e5e4;border-radius:12px;padding:20px;">
            <h1 style="margin:0 0 8px 0;font-size:18px;line-height:24px;">${escapeHtml(subject)}</h1>
            ${vehicleHeaderHtml}
            <p style="margin:0 0 12px 0;font-size:14px;line-height:20px;color:#44403c;">
              ${escapeHtml(`Egy ideje nem történt kilométeróra-frissítés a(z) ${license} rendszámú járműnél.`)}
            </p>
            <p style="margin:0 0 16px 0;font-size:14px;line-height:20px;color:#44403c;">
              ${escapeHtml("A pontos szervizemlékeztetők érdekében érdemes frissíteni az aktuális kilométeróra állást.")}
            </p>
            <a href="${safeUrl}" style="display:inline-block;background:#1c1917;color:#ffffff;text-decoration:none;padding:10px 12px;border-radius:10px;font-size:13px;line-height:18px;font-weight:600;">Kilométeróra frissítése</a>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
    return { subject, text, html };
  }

  if (key === "ro") {
    const subject = "Actualizați kilometrajul vehiculului";
    const text = [
      `Nu am observat o actualizare recentă a kilometrajului pentru vehiculul ${license}.`,
      "",
      "Actualizarea kilometrajului ajută la menținerea corectă a reminderelor de mentenanță.",
      "",
      `Actualizare: ${vars.quickUrl}`,
    ].join("\n");
    const html = `<!doctype html>
<html lang="ro">
  <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
  <body style="margin:0;padding:0;background:#f7f7f6;color:#1c1917;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr><td align="center" style="padding:24px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="border-collapse:collapse;max-width:600px;width:100%;">
          <tr><td style="background:#ffffff;border:1px solid #e7e5e4;border-radius:12px;padding:20px;">
            <h1 style="margin:0 0 8px 0;font-size:18px;line-height:24px;">${escapeHtml(subject)}</h1>
            ${vehicleHeaderHtml}
            <p style="margin:0 0 12px 0;font-size:14px;line-height:20px;color:#44403c;">
              ${escapeHtml(`Nu am observat o actualizare recentă a kilometrajului pentru vehiculul ${license}.`)}
            </p>
            <p style="margin:0 0 16px 0;font-size:14px;line-height:20px;color:#44403c;">
              ${escapeHtml("Actualizarea kilometrajului ajută la menținerea corectă a reminderelor de mentenanță.")}
            </p>
            <a href="${safeUrl}" style="display:inline-block;background:#1c1917;color:#ffffff;text-decoration:none;padding:10px 12px;border-radius:10px;font-size:13px;line-height:18px;font-weight:600;">Actualizează kilometrajul</a>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
    return { subject, text, html };
  }

  const subject = "Update your vehicle odometer";
  const text = [
    `We haven't seen an odometer update for your vehicle ${license} in a while.`,
    "",
    "Keeping your odometer current helps maintain accurate service reminders and maintenance tracking.",
    "",
    `Update: ${vars.quickUrl}`,
  ].join("\n");
  const html = `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
  <body style="margin:0;padding:0;background:#f7f7f6;color:#1c1917;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr><td align="center" style="padding:24px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="border-collapse:collapse;max-width:600px;width:100%;">
          <tr><td style="background:#ffffff;border:1px solid #e7e5e4;border-radius:12px;padding:20px;">
            <h1 style="margin:0 0 8px 0;font-size:18px;line-height:24px;">${escapeHtml(subject)}</h1>
            ${vehicleHeaderHtml}
            <p style="margin:0 0 12px 0;font-size:14px;line-height:20px;color:#44403c;">
              ${escapeHtml(`We haven't seen an odometer update for your vehicle ${license} in a while.`)}
            </p>
            <p style="margin:0 0 16px 0;font-size:14px;line-height:20px;color:#44403c;">
              ${escapeHtml("Keeping your odometer current helps maintain accurate service reminders and maintenance tracking.")}
            </p>
            <a href="${safeUrl}" style="display:inline-block;background:#1c1917;color:#ffffff;text-decoration:none;padding:10px 12px;border-radius:10px;font-size:13px;line-height:18px;font-weight:600;">Update odometer</a>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
  return { subject, text, html };
}

