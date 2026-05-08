import { escapeHtml, type EmailTemplate, type Lang } from "./_shared";

export function inviteEmailTemplate(args: {
  toEmail: string;
  signupUrl: string;
  lang: Lang;
}): EmailTemplate {
  const key = args.lang === "hu" ? "hu" : args.lang === "ro" ? "ro" : "en";
  const subject =
    key === "hu"
      ? "Meghívó a Vehicle Desk alkalmazáshoz"
      : key === "ro"
        ? "Invitație la Vehicle Desk"
        : "You’re invited to Vehicle Desk";
  const safeUrl = escapeHtml(args.signupUrl);
  const text =
    key === "hu"
      ? `Meghívást kaptál a Vehicle Desk alkalmazáshoz.\n\nFiók létrehozása:\n${args.signupUrl}\n`
      : key === "ro"
        ? `Ai fost invitat(ă) la Vehicle Desk.\n\nCreează-ți contul aici:\n${args.signupUrl}\n`
        : `You’ve been invited to Vehicle Desk.\n\nCreate your account here:\n${args.signupUrl}\n`;
  const intro =
    key === "hu"
      ? "Hozd létre a fiókodat az alábbi linkkel."
      : key === "ro"
        ? "Creează-ți contul folosind linkul de mai jos."
        : "Create your account using the link below.";
  const cta = key === "hu" ? "Fiók létrehozása" : key === "ro" ? "Creează cont" : "Create account";

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f7f7f6;color:#1c1917;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;">
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
                  ${escapeHtml(subject)}
                </h1>
                <p style="margin:0 0 16px 0;font-size:14px;line-height:20px;color:#44403c;">
                  ${escapeHtml(intro)}
                </p>
                <a href="${safeUrl}" style="display:inline-block;background:#1c1917;color:#ffffff;text-decoration:none;padding:10px 12px;border-radius:10px;font-size:13px;line-height:18px;font-weight:600;">
                  ${escapeHtml(cta)}
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, text, html };
}

