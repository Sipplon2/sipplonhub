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
    fresh: "Neu",
    copy: "Kopieren",
    copied: "Kopiert",
    note: "Codes werden nicht im Spiel, sondern im offiziellen Gift Center eingelöst.",
    giftCenter: "Zum Gift Center",
    source: "Quelle: lastzguides.com – wird automatisch aktualisiert.",
  },
  en: {
    title: "Gift codes",
    subtitle: "Active codes for free rewards.",
    fresh: "New",
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
    const pill = card.querySelector(".status-pill");
    const isFresh = Boolean(pill?.classList.contains("status-pill--fresh"));
    const isActive = Boolean(pill?.classList.contains("status-pill--active"));

    if (!isFresh && !isActive) {
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
      fresh: isFresh,
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

    const maxAge = 3 * 24 * 60 * 60 * 1000;

    if (!Array.isArray(cached?.codes) || Date.now() - cached.time > maxAge) {
      return [];
    }

    return cached.codes;
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

/* Zusatzzeile der Quelle (Englisch) für die deutsche Seite übersetzen */
function translateCodeMeta(meta) {
  if (currentLanguage === "en") {
    return meta;
  }

  return meta
    .replace(/Official/g, "Offiziell")
    .replace(/First seen ([A-Za-z]+ \d{1,2}, \d{4})/g, (match, date) => {
      const parsed = new Date(date + " 12:00 UTC");

      return Number.isNaN(parsed.getTime())
        ? match
        : "Zuerst gesehen am " +
            new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeZone: "UTC" }).format(parsed);
    });
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
                <code>${escape(item.code)}${item.fresh ? ` <span class="code-new">${escape(texts.fresh)}</span>` : ""}</code>
                ${item.meta ? `<small>${escape(translateCodeMeta(item.meta))}</small>` : ""}
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
