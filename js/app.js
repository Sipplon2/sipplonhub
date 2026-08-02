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