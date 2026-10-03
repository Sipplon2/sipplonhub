"use strict";

/*
 * Zeitanzeige: Lokale Zeit oder Weltuntergangszeit (Apo-Zeit, Spielzeit).
 * Apo-Zeit = UTC−2, ohne Sommerzeit. Etc/GMT+2 ist die IANA-Schreibweise dafür.
 */
const APO_TIME_ZONE = "Etc/GMT+2";

let timeMode = loadTimeMode();

function loadTimeMode() {
  try {
    return localStorage.getItem("timeMode") === "apo"
      ? "apo"
      : "local";
  } catch {
    return "local";
  }
}

function setTimeMode(mode) {
  timeMode = mode === "apo" ? "apo" : "local";

  try {
    localStorage.setItem("timeMode", timeMode);
  } catch {
    /* Speichern ist optional */
  }
}

/* undefined = Zeitzone des Browsers */
function getDisplayTimeZone() {
  return timeMode === "apo" ? APO_TIME_ZONE : undefined;
}

function getApoParts(date = new Date()) {
  const parts = {};

  for (const part of new Intl.DateTimeFormat("en-US", {
    timeZone: APO_TIME_ZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "short",
    hourCycle: "h23",
    hour: "numeric",
    minute: "numeric",
  }).formatToParts(date)) {
    parts[part.type] = part.value;
  }

  return parts;
}

/* Spieltag (0 = Sonntag … 6 = Samstag): wechselt um 00:00 Apo-Zeit */
function getGameDay() {
  const weekdays = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return weekdays[getApoParts().weekday] ?? new Date().getDay();
}

function getGameWeekdayName() {
  return new Intl.DateTimeFormat(
    currentLanguage === "en" ? "en-US" : "de-DE",
    { timeZone: APO_TIME_ZONE, weekday: "long" }
  ).format(new Date());
}

function formatClock(date = new Date()) {
  return new Intl.DateTimeFormat("de-DE", {
    timeZone: getDisplayTimeZone(),
    hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

/*
 * Ersetzt Platzhalter {{apo 08:00}} in Texten:
 *  - Apo-Modus:   "08:00 Apo-Time"
 *  - Lokal-Modus: heutige lokale Entsprechung, z. B. "12:00 Uhr"
 */
function applyTimeTokens(text) {
  const isEnglish = currentLanguage === "en";

  const formatPoint = (hours, minutes, apoToday) => {
    const label = String(hours).padStart(2, "0") + ":" + minutes;

    if (timeMode === "apo") {
      return label;
    }

    /* UTC−2: UTC-Zeit = Apo-Zeit + 2 Stunden */
    const instant = new Date(
      Date.UTC(
        Number(apoToday.year),
        Number(apoToday.month) - 1,
        Number(apoToday.day),
        Number(hours) + 2,
        Number(minutes)
      )
    );

    return new Intl.DateTimeFormat("de-DE", {
      hourCycle: "h23",
      hour: "2-digit",
      minute: "2-digit",
    }).format(instant);
  };

  return String(text ?? "").replace(
    /\{\{apo (\d{1,2}):(\d{2})(?:-(\d{1,2}):(\d{2}))?\}\}/g,
    (match, hours, minutes, endHours, endMinutes) => {
      const apoToday = getApoParts();

      let label = formatPoint(hours, minutes, apoToday);

      if (endHours !== undefined) {
        label += "–" + formatPoint(endHours, endMinutes, apoToday);
      }

      if (timeMode === "apo") {
        return isEnglish ? `${label} Apo Time` : `${label} Apo-Time`;
      }

      return isEnglish ? label : `${label} Uhr`;
    }
  );
}
