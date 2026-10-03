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
    timeLocal: "Lokal",
    timeApo: "Apo",
    timeLocalTitle: "Deine lokale Zeit anzeigen",
    timeApoTitle: "Weltuntergangszeit (Spielzeit) anzeigen",
    comingSoon: "Coming Soon",
    comingSoonText: "Die Saison-Aufgaben erscheinen, sobald die Saison startet.",
    introEyebrow: "Heute",
    introSub: "Inoffizieller Community-Hub für Last Z.",
    navToday: "Heute",
    navEvents: "Events",
    navSaison: "Saison",
    navWar: "Kriegswoche",
    navCodes: "Codes",
  },

  en: {
    allianceTitle: "Alliance Duel",
    allianceSubtitle: "Weekly Plan and Strategy",
    seasonTitle: "Season Missions",
    seasonSubtitle: "Weekly Missions and Objectives",
    eventsEyebrow: "Dates & Countdowns",
    eventsTitle: "Events",
    eventsSubtitle: "Upcoming Last Z events at a glance.",
    timeLocal: "Local",
    timeApo: "Apo",
    timeLocalTitle: "Show your local time",
    timeApoTitle: "Show Apocalypse time (in-game time)",
    comingSoon: "Coming Soon",
    comingSoonText: "Season missions will appear as soon as the season starts.",
    introEyebrow: "Today",
    introSub: "Unofficial community hub for Last Z.",
    navToday: "Today",
    navEvents: "Events",
    navSaison: "Season",
    navWar: "War week",
    navCodes: "Codes",
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

    /* Saison-Aufgaben: Coming Soon – initWeeklyPlan() wieder aktivieren, sobald die Saison startet. */

    if (typeof initEvents === "function") {
      await initEvents();
    }

    if (typeof initInvasion === "function") {
      await initInvasion();
    }

    if (typeof initCodes === "function") {
      await initCodes();
    }

    if (typeof initSeasonGuide === "function") {
      await initSeasonGuide();
    }

    if (typeof initRose === "function") {
      await initRose();
    }
  } catch (error) {
    console.error(
      "Fehler beim Initialisieren der Webseite:",
      error
    );
  }
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

  setTextContent("#time-local", texts.timeLocal);
  setTextContent("#time-apo", texts.timeApo);
  document.querySelector("#time-local")?.setAttribute("title", texts.timeLocalTitle);
  document.querySelector("#time-apo")?.setAttribute("title", texts.timeApoTitle);

  setTextContent("#season-soon-title", texts.comingSoon);
  setTextContent("#season-soon-text", texts.comingSoonText);
  setTextContent("#intro-eyebrow", texts.introEyebrow);
  setTextContent("#nav-today", texts.navToday);
  setTextContent("#nav-events", texts.navEvents);
  setTextContent("#nav-saison", texts.navSaison);
  setTextContent("#nav-war", texts.navWar);
  setTextContent("#nav-codes", texts.navCodes);

  setTextContent("#intro-sub", texts.introSub);

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

function updateTimeModeUi() {
  for (const button of document.querySelectorAll("[data-time-mode]")) {
    const isActive = button.dataset.timeMode === timeMode;

    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  }

  const clock = document.querySelector("#time-clock");

  if (clock) {
    clock.textContent = formatClock();
    clock.classList.toggle("apo", timeMode === "apo");
  }
}

function registerTimeModeButtons() {
  for (const button of document.querySelectorAll("[data-time-mode]")) {
    button.addEventListener("click", () => {
      if (button.dataset.timeMode === timeMode) {
        return;
      }

      setTimeMode(button.dataset.timeMode);
      updateTimeModeUi();

      if (typeof renderEvents === "function") {
        renderEvents();
      }

      if (typeof renderAllianceDuelContent === "function") {
        renderAllianceDuelContent();
      }

      if (typeof renderInvasion === "function") {
        renderInvasion();
      }

      if (typeof renderSeasonGuide === "function") {
        renderSeasonGuide();
      }
    });
  }

  updateTimeModeUi();
  window.setInterval(updateTimeModeUi, 1000);
}

registerTimeModeButtons();
