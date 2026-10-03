"use strict";

/*
 * Rose der Woche: Das Last Z Wiki trägt Zahl und Buff jeden Montag von Hand in seine Startseite ein.
 * Diese Seite liest die drei Werte (Anzahl, Buff, Dauer) direkt von dort aus, es muss nichts gepflegt werden.
 * Ändert sich das Format, bleibt der Bereich versteckt (oder zeigt den zuletzt gespeicherten Wert).
 */
const ROSE_SOURCE_URL = "https://lastzwiki.com/en/";
const ROSE_CACHE_KEY = "lastz-rose-cache";

const roseTexts = {
  de: {
    kicker: "Rose der Woche",
    unit: (n) => (n === 1 ? "Gelbe Rose" : "Gelbe Rosen"),
    valid: "Gültig",
    zone: "Apo-Zeit",
    howTo: (n) =>
      `Schicke genau ${n} ${n === 1 ? "Gelbe Rose" : "Gelbe Rosen"} in einem einzigen Geschenk an einen Spieler. Der Buff gilt für dich als Absender.`,
    copy: "Für Allianz-Chat kopieren",
    copied: "Kopiert",
    chat: (n, buff, duration) =>
      `🟡 Rose der Woche: ${n} → ${buff} (${duration}). Schicke genau ${n} Gelbe ${n === 1 ? "Rose" : "Rosen"} in einem Geschenk an einen Spieler. Der Buff gilt für den Absender.`,
    hint: "Zahl aus dem Last Z Wiki, wird montags aktualisiert. Im Zweifel gilt der Wert im Spiel.",
  },
  en: {
    kicker: "Lucky Rose this week",
    unit: (n) => (n === 1 ? "Yellow Rose" : "Yellow Roses"),
    valid: "Valid",
    zone: "Apocalypse Time",
    howTo: (n) =>
      `Send exactly ${n} Yellow ${n === 1 ? "Rose" : "Roses"} to one player in a single gift. The buff applies to you, the sender.`,
    copy: "Copy for alliance chat",
    copied: "Copied",
    chat: (n, buff, duration) =>
      `🟡 Lucky Rose this week: ${n} → ${buff} (${duration}). Send exactly ${n} Yellow ${n === 1 ? "Rose" : "Roses"} to one player in a single gift. The buff applies to the sender.`,
    hint: "Taken from the Last Z Wiki, updated on Mondays. If in doubt, the in-game value counts.",
  },
};

/* Bekannte Buffs übersetzen, alles andere bleibt im Original */
const roseBuffsDe = [
  [/construction speed/i, "Baugeschwindigkeit"],
  [/research speed/i, "Forschungsgeschwindigkeit"],
  [/troop attack/i, "Truppenangriff"],
  [/troop defense/i, "Truppenverteidigung"],
  [/troop hp/i, "Truppenleben"],
  [/troop damage/i, "Truppenschaden"],
  [/gathering speed/i, "Sammelgeschwindigkeit"],
  [/march speed/i, "Marschgeschwindigkeit"],
  [/training speed/i, "Trainingsgeschwindigkeit"],
];

function translateRoseBuff(buff) {
  if (currentLanguage !== "de") {
    return buff;
  }

  let result = buff;

  for (const [pattern, text] of roseBuffsDe) {
    result = result.replace(pattern, text);
  }

  return result;
}

function translateRoseDuration(duration) {
  if (currentLanguage !== "de") {
    return duration;
  }

  return duration
    .replace(/\bhrs?\b|\bhs\b|\bhours?\b/i, "Std.")
    .replace(/\bmins?\b|\bminutes?\b/i, "Min.");
}

async function fetchRose() {
  const response = await fetch(ROSE_SOURCE_URL, { cache: "no-cache" });

  if (!response.ok) {
    throw new Error(`rose: HTTP ${response.status}`);
  }

  const html = await response.text();

  const amount = Number(html.match(/const rosaCantidad\s*=\s*(\d{1,3})\s*;/)?.[1]);
  const buff = html.match(/const rosaBuff\s*=\s*"([^"]{1,80})"/)?.[1]?.trim();
  const duration = html.match(/const rosaDuracion\s*=\s*"([^"]{1,20})"/)?.[1]?.trim();

  if (!Number.isInteger(amount) || amount < 1 || !buff || !duration) {
    throw new Error("rose: Werte nicht gefunden");
  }

  return { amount, buff, duration };
}

function loadCachedRose() {
  try {
    const cached = JSON.parse(localStorage.getItem(ROSE_CACHE_KEY));

    return cached?.amount && cached?.buff ? cached : null;
  } catch {
    return null;
  }
}

function saveCachedRose(rose) {
  try {
    localStorage.setItem(ROSE_CACHE_KEY, JSON.stringify(rose));
  } catch {
    /* Speichern ist optional */
  }
}

let currentRose = null;

async function initRose() {
  try {
    currentRose = await fetchRose();
    saveCachedRose(currentRose);
  } catch (error) {
    console.warn("Rose:", error);
    currentRose = loadCachedRose();
  }

  renderRose();
}

/* Gültigkeit: Montag bis Sonntag der aktuellen Spielwoche (Apo-Zeit) */
function getRoseWeekLabel() {
  const apo = getApoParts();
  const todayUtc = Date.UTC(
    Number(apo.year),
    Number(apo.month) - 1,
    Number(apo.day)
  );

  const mondayUtc = todayUtc - ((getGameDay() + 6) % 7) * 86400000;
  const format = new Intl.DateTimeFormat(
    currentLanguage === "en" ? "en" : "de-DE",
    { timeZone: "UTC", day: "numeric", month: "short" }
  );

  return `${format.format(new Date(mondayUtc))} – ${format.format(new Date(mondayUtc + 6 * 86400000))}`;
}

function renderRose() {
  const card = document.querySelector("#rose-strip");

  if (!card) {
    return;
  }

  card.hidden = !currentRose;

  if (!currentRose) {
    return;
  }

  const texts = roseTexts[currentLanguage] ?? roseTexts.de;
  const escape = escapeAllianceDuelHtml;
  const buff = translateRoseBuff(currentRose.buff);
  const duration = translateRoseDuration(currentRose.duration);
  const amount = currentRose.amount;

  card.innerHTML = `
    <div class="rose-main">
      <span class="rose-icon" aria-hidden="true">
        <img src="assets/images/icons/yellow-rose.png" alt="" width="67" height="87">
      </span>

      <div>
        <p class="rose-kicker">${escape(texts.kicker)}</p>

        <p class="rose-count">
          <span class="rose-number">${escape(amount)}</span>
          <span class="rose-unit">${escape(texts.unit(amount))}</span>
        </p>

        <p class="rose-buff">${escape(buff)} · ${escape(duration)}</p>

        <p class="rose-valid">
          ${escape(texts.valid)} ${escape(getRoseWeekLabel())} · ${escape(texts.zone)}
        </p>
      </div>
    </div>

    <div class="rose-side">
      <p class="rose-howto">${escape(texts.howTo(amount))}</p>

      <button type="button" class="rose-copy" data-rose-copy>
        ${escape(texts.copy)}
      </button>

      <small class="rose-hint">${escape(texts.hint)}</small>
    </div>
  `;

  const button = card.querySelector("[data-rose-copy]");

  button.addEventListener("click", async () => {
    const message = texts.chat(amount, buff, duration);

    try {
      await navigator.clipboard.writeText(message);
    } catch {
      const field = document.createElement("textarea");

      field.value = message;
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.append(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }

    button.textContent = texts.copied;
    button.classList.add("copied");

    window.setTimeout(() => {
      button.textContent = texts.copy;
      button.classList.remove("copied");
    }, 1500);
  });
}
