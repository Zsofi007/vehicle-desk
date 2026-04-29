type Lang = "en" | "hu" | "ro";

type TemplateVars = {
  license_plate: string;
  type: string;
  date: string;
};

function interpolate(text: string, vars: TemplateVars) {
  return text
    .replaceAll("{{license_plate}}", vars.license_plate)
    .replaceAll("{{type}}", vars.type)
    .replaceAll("{{date}}", vars.date);
}

export function expiryEmailTemplate(lang: Lang, vars: TemplateVars) {
  const key = lang === "hu" ? "hu" : lang === "ro" ? "ro" : "en";

  if (key === "hu") {
    return {
      subject: "Közelgő jármű lejárat",
      text: interpolate(
        "A(z) {{license_plate}} rendszámú jármű {{type}} {{date}} dátumon lejár.",
        vars,
      ),
    };
  }

  if (key === "ro") {
    return {
      subject: "Expirare vehicul în curând",
      text: interpolate(
        "Vehiculul {{license_plate}} are {{type}} care expiră la data de {{date}}.",
        vars,
      ),
    };
  }

  return {
    subject: "Upcoming vehicle expiry",
    text: interpolate(
      "Your vehicle {{license_plate}} has {{type}} expiring on {{date}}.",
      vars,
    ),
  };
}

