"use strict";

/*
 * Geschenkcodes: werden bei jedem Seitenaufruf direkt von lastzguides.com geholt
 * (die Seite erlaubt Abrufe von anderen Websites). Dadurch muss nichts gepflegt werden.
 * Fällt der Abruf aus oder ändert sich das Seitenformat, wird der zuletzt gespeicherte
 * Stand angezeigt – gibt es keinen, bleibt der Bereich einfach versteckt.
 */
const CODES_SOURCE_URL = "https://lastzguides.com/codes.html";
const CODES_GIFT_CENTER_URL = "https://last-z.com/giftCenter/#/login";
const CODES_CACHE_KEY = "lastz-codes-cache";

const codesTexts = {
  de: {
    title: "Geschenkcodes",
    subtitle: "Aktive Codes für kostenlose Belohnungen.",
    copy: "Kopieren",
    copied: "Kopiert",
    note: "Codes werden nicht im Spiel, sondern im offiziellen Gift Center eingelöst.",
    giftCenter: "Zum Gift Center",
    source: "Quelle: lastzguides.com – wird automatisch aktualisiert.",
  },
  en: {
    title: "Gift codes",
    subtitle: "Active codes for free rewards.",
    copy: "Copy",
    copied: "Copied",
    note: "Codes are not redeemed in the game, but in the official Gift Center.",
    giftCenter: "Open Gift Center",
    source: "Source: lastzguides.com – updated automatically.",
  },
};

let activeCodes = [];

async function fetchActiveCodes() {
  const response = await fetch(CODES_SOURCE_URL, { cache: "no-cache" });

  if (!response.ok) {
    throw new Error(`codes: HTTP ${response.status}`);
  }

  const doc = new DOMParser().parseFromString(
    await response.text(),
    "text/html"
  );

  const cards = doc.querySelectorAll(
    ".active-codes-panel .code-card"
  );

  const codes = [];

  for (const card of cards) {
    if (!card.querySelector(".status-pill--active")) {
      continue;
    }

    const code = card
      .querySelector("[data-copy-code]")
      ?.getAttribute("data-copy-code")
      ?.trim();

    /* Nur plausible Codes übernehmen (Buchstaben und Ziffern) */
    if (!code || !/^[A-Za-z0-9]{4,40}$/.test(code)) {
      continue;
    }

    codes.push({
      code,
      meta:
        card.querySelector(".code-card__meta")?.textContent.trim() ?? "",
    });
  }

  if (codes.length === 0) {
    throw new Error("codes: keine aktiven Codes gefunden");
  }

  return codes;
}

function loadCachedCodes() {
  try {
    const cached = JSON.parse(localStorage.getItem(CODES_CACHE_KEY));

    return Array.isArray(cached?.codes) ? cached.codes : [];
  } catch {
    return [];
  }
}

function saveCachedCodes(codes) {
  try {
    localStorage.setItem(
      CODES_CACHE_KEY,
      JSON.stringify({ time: Date.now(), codes })
    );
  } catch {
    /* Speichern ist optional */
  }
}

async function initCodes() {
  try {
    activeCodes = await fetchActiveCodes();
    saveCachedCodes(activeCodes);
  } catch (error) {
    console.warn("Codes:", error);
    activeCodes = loadCachedCodes();
  }

  renderCodes();
}

async function copyCodeToClipboard(code) {
  try {
    await navigator.clipboard.writeText(code);

    return true;
  } catch {
    const field = document.createElement("textarea");

    field.value = code;
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.append(field);
    field.select();

    const done = document.execCommand("copy");

    field.remove();

    return done;
  }
}

function renderCodes() {
  const section = document.querySelector("#codes");

  if (!section) {
    return;
  }

  const texts = codesTexts[currentLanguage] ?? codesTexts.de;
  const escape = escapeAllianceDuelHtml;

  section.hidden = activeCodes.length === 0;

  if (activeCodes.length === 0) {
    return;
  }

  section.querySelector("#codes-title").textContent = texts.title;
  section.querySelector("#codes-subtitle").textContent = texts.subtitle;

  section.querySelector("#codes-body").innerHTML = `
    <div class="code-grid">
      ${activeCodes
        .map(
          (item) => `
            <div class="code-card">
              <div>
                <code>${escape(item.code)}</code>
                ${item.meta ? `<small>${escape(item.meta)}</small>` : ""}
              </div>

              <button
                type="button"
                class="code-copy"
                data-code="${escape(item.code)}"
              >
                ${escape(texts.copy)}
              </button>
            </div>
          `
        )
        .join("")}
    </div>

    <p class="codes-note">
      ${escape(texts.note)}
      <a href="${CODES_GIFT_CENTER_URL}" target="_blank" rel="noopener noreferrer">${escape(texts.giftCenter)}</a>
    </p>

    <p class="codes-note">${escape(texts.source)}</p>
  `;

  for (const button of section.querySelectorAll(".code-copy")) {
    button.addEventListener("click", async () => {
      if (await copyCodeToClipboard(button.dataset.code)) {
        button.textContent = texts.copied;
        button.classList.add("copied");

        window.setTimeout(() => {
          button.textContent = texts.copy;
          button.classList.remove("copied");
        }, 1500);
      }
    });
  }
}
