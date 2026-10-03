"use strict";

/*
 * Prüft, ob die Code-Quelle der Seite noch funktioniert.
 * Schlägt fehl (Exit-Code 1), wenn
 *  - die Quelle nicht erreichbar ist,
 *  - der Abruf von anderen Websites (CORS) nicht mehr erlaubt ist,
 *  - das Seitenformat sich geändert hat (kein aktiver Code mehr erkennbar).
 * GitHub schickt bei einem fehlgeschlagenen Lauf automatisch eine E-Mail.
 *
 * Die Erkennung muss dieselben Merkmale nutzen wie js/codes.js.
 */
const SOURCE_URL = "https://lastzguides.com/codes.html";

function fail(message) {
  console.error(`FEHLER: ${message}`);
  process.exit(1);
}

async function main() {
  const response = await fetch(SOURCE_URL, {
    headers: { "user-agent": "sipplonhub-codes-check" },
  });

  if (!response.ok) {
    fail(`Quelle antwortet mit HTTP ${response.status}.`);
  }

  const cors = response.headers.get("access-control-allow-origin");

  if (cors !== "*" && !/sipplonhub\.de/.test(cors ?? "")) {
    fail(
      `Die Quelle erlaubt Abrufe von anderen Websites nicht mehr (Access-Control-Allow-Origin: ${cors ?? "fehlt"}). Die Codes werden auf der Seite nicht mehr angezeigt.`
    );
  }

  const html = await response.text();

  const panel = html.match(
    /<section[^>]*class="[^"]*active-codes-panel[^"]*"[\s\S]*?<\/section>/
  );

  if (!panel) {
    fail(
      'Der Bereich ".active-codes-panel" wurde nicht mehr gefunden. Das Seitenformat der Quelle hat sich geändert, js/codes.js muss angepasst werden.'
    );
  }

  const cards = panel[0].match(/<article[^>]*class="[^"]*code-card[^"]*"[\s\S]*?<\/article>/g) ?? [];

  const codes = [];

  for (const card of cards) {
    if (!/status-pill--active/.test(card)) {
      continue;
    }

    const code = card.match(/data-copy-code="([^"]+)"/)?.[1]?.trim();

    if (code && /^[A-Za-z0-9]{4,40}$/.test(code)) {
      codes.push(code);
    }
  }

  if (codes.length === 0) {
    fail(
      "Es wurde kein aktiver Code erkannt. Entweder gibt es gerade keine Codes, oder das Seitenformat der Quelle hat sich geändert (js/codes.js prüfen)."
    );
  }

  console.log(`OK: ${codes.length} aktive Codes erkannt (${codes.join(", ")}).`);
}

main().catch((error) => fail(error.message));
