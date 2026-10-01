"use strict";

let currentLanguage = "de";

const staticTexts = {
  de: {
    allianceTitle: "Allianz-Duell",
    allianceSubtitle: "Wochenplan und Strategie",
    seasonTitle: "Saison-Aufgaben",
    seasonSubtitle: "Wöchentliche Aufgaben und Ziele",
    eventsEyebrow: "Termine & Countdowns",
    eventsTitle: "Events",
    eventsSubtitle: "Kommende Last-Z-Termine auf einen Blick.",
  },

  en: {
    allianceTitle: "Alliance Duel",
    allianceSubtitle: "Weekly Plan and Strategy",
    seasonTitle: "Season Missions",
    seasonSubtitle: "Weekly Missions and Objectives",
    eventsEyebrow: "Dates & Countdowns",
    eventsTitle: "Events",
    eventsSubtitle: "Upcoming Last Z events at a glance.",
  },
};

async function initializeWebsite() {
  console.log(
    `Sipplon's Last Z Hub gestartet – Sprache: ${currentLanguage}`
  );

  updateStaticTexts();

  try {
    if (typeof initAllianceDuel === "function") {
      await initAllianceDuel();
    }

    if (typeof initWeeklyPlan === "function") {
      await initWeeklyPlan();
    }

    if (typeof initEvents === "function") {
      await initEvents();
    }

    renderWeekOverview();
  } catch (error) {
    console.error(
      "Fehler beim Initialisieren der Webseite:",
      error
    );
  }
}

function renderWeekOverview() {
  const container = document.querySelector("#week-overview");

  if (!container) {
    return;
  }

  const dayNames = currentLanguage === "en"
    ? ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    : ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

  const shortNames = currentLanguage === "en"
    ? ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
    : ["MO", "DI", "MI", "DO", "FR", "SA", "SO"];

  const today = new Date();
  const currentDay = today.getDay() === 0 ? 7 : today.getDay();
  const selectedDay = Number(selectedWeeklyTaskDay ?? currentDay);

  container.innerHTML = dayNames.map((name, index) => {
    const day = index + 1;
    const isToday = day === currentDay;
    const isSelected = day === selectedDay;

    return `
      <button
        type="button"
        class="week-overview-day${isToday ? " is-today" : ""}${isSelected ? " is-selected" : ""}"
        data-week-day="${day}"
        aria-pressed="${isSelected}"
      >
        <span>${shortNames[index]}</span>
        <strong>${name}</strong>
        <small>${isToday ? (currentLanguage === "en" ? "Today" : "Heute") : `0${day}`}</small>
      </button>
    `;
  }).join("");

  const todayName = document.querySelector("#today-name");
  const todayDate = document.querySelector("#today-date");

  if (todayName) {
    todayName.textContent = dayNames[currentDay - 1];
  }

  if (todayDate) {
    todayDate.textContent = new Intl.DateTimeFormat(
      currentLanguage === "en" ? "en-US" : "de-DE",
      { day: "2-digit", month: "long" }
    ).format(today);
  }

  for (const button of container.querySelectorAll("[data-week-day]")) {
    button.addEventListener("click", () => selectWeekDay(Number(button.dataset.weekDay)));
  }
}

function selectWeekDay(day) {
  const allianceButton = document.querySelector(`[data-alliance-day="${day}"]`);
  const seasonButton = document.querySelector(`[data-season-day="${day}"]`);

  allianceButton?.click();
  seasonButton?.click();
  renderWeekOverview();
}

function updateStaticTexts() {
  const texts =
    staticTexts[currentLanguage] ??
    staticTexts.de;

  setTextContent(
    "#alliance-title",
    texts.allianceTitle
  );

  setTextContent(
    "#alliance-subtitle",
    texts.allianceSubtitle
  );

  setTextContent(
    "#season-title",
    texts.seasonTitle
  );

  setTextContent(
    "#season-subtitle",
    texts.seasonSubtitle
  );

  setTextContent(
    "#events-eyebrow",
    texts.eventsEyebrow
  );

  setTextContent(
    "#events-title",
    texts.eventsTitle
  );

  setTextContent(
    "#events-subtitle",
    texts.eventsSubtitle
  );

  document.documentElement.lang =
    currentLanguage;
}

function setTextContent(selector, text) {
  const element =
    document.querySelector(selector);

  if (element) {
    element.textContent = text;
  }
}

function registerLanguageButtons() {
  for (const button of document.querySelectorAll(
    "[data-language]"
  )) {
    button.addEventListener(
      "click",
      async () => {
        const language =
          button.dataset.language;

        if (
          language !== "de" &&
          language !== "en"
        ) {
          return;
        }

        if (language === currentLanguage) {
          return;
        }

        currentLanguage = language;

        for (const languageButton of document.querySelectorAll(
          "[data-language]"
        )) {
          languageButton.classList.toggle(
            "active",
            languageButton.dataset.language ===
              currentLanguage
          );
        }

        await initializeWebsite();
      }
    );
  }
}

registerLanguageButtons();
initializeWebsite();
