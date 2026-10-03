"use strict";

/*
 * Prüft, ob die Quelle für die Rose der Woche noch funktioniert (siehe js/rose.js).
 * Schlägt fehl, wenn die Seite nicht erreichbar ist, Abrufe von anderen Websites nicht mehr
 * erlaubt sind oder die drei Werte nicht mehr gefunden werden.
 */
const SOURCE_URL = "https://lastzwiki.com/en/";

function fail(message) {
  console.error(`FEHLER: ${message}`);
  process.exit(1);
}

async function main() {
  const response = await fetch(SOURCE_URL, {
    headers: { "user-agent": "sipplonhub-rose-check" },
  });

  if (!response.ok) {
    fail(`Quelle antwortet mit HTTP ${response.status}.`);
  }

  const cors = response.headers.get("access-control-allow-origin");

  if (cors !== "*" && !/sipplonhub\.de/.test(cors ?? "")) {
    fail(
      `Die Quelle erlaubt Abrufe von anderen Websites nicht mehr (Access-Control-Allow-Origin: ${cors ?? "fehlt"}). Die Rose wird auf der Seite nicht mehr aktualisiert.`
    );
  }

  const html = await response.text();

  const amount = Number(html.match(/const rosaCantidad\s*=\s*(\d{1,3})\s*;/)?.[1]);
  const buff = html.match(/const rosaBuff\s*=\s*"([^"]{1,80})"/)?.[1]?.trim();
  const duration = html.match(/const rosaDuracion\s*=\s*"([^"]{1,20})"/)?.[1]?.trim();

  if (!Number.isInteger(amount) || amount < 1 || !buff || !duration) {
    fail(
      "Zahl, Buff oder Dauer der Rose wurden nicht mehr gefunden. Das Seitenformat der Quelle hat sich geändert, js/rose.js muss angepasst werden."
    );
  }

  console.log(`OK: ${amount} Rose(n) → ${buff} (${duration}).`);
}

main().catch((error) => fail(error.message));
