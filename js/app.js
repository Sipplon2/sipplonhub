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
    comingSoon: "Coming Soon",
    comingSoonText: "Die Saison-Aufgaben erscheinen, sobald die Saison startet.",
    introEyebrow: "Heute",
    introSub: "Inoffizieller Community-Hub für Last Z.",
    navAlliance: "Allianz-Duell",
    navSeason: "Saison",
    navEvents: "Events",
  },

  en: {
    allianceTitle: "Alliance Duel",
    allianceSubtitle: "Weekly Plan and Strategy",
    seasonTitle: "Season Missions",
    seasonSubtitle: "Weekly Missions and Objectives",
    eventsEyebrow: "Dates & Countdowns",
    eventsTitle: "Events",
    eventsSubtitle: "Upcoming Last Z events at a glance.",
    comingSoon: "Coming Soon",
    comingSoonText: "Season missions will appear as soon as the season starts.",
    introEyebrow: "Today",
    introSub: "Unofficial community hub for Last Z.",
    navAlliance: "Alliance Duel",
    navSeason: "Season",
    navEvents: "Events",
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

  setTextContent("#season-soon-title", texts.comingSoon);
  setTextContent("#season-soon-text", texts.comingSoonText);
  setTextContent("#intro-eyebrow", texts.introEyebrow);
  setTextContent("#nav-alliance", texts.navAlliance);
  setTextContent("#nav-season", texts.navSeason);
  setTextContent("#nav-events", texts.navEvents);

  const dayName = new Intl.DateTimeFormat(
    currentLanguage === "en" ? "en-US" : "de-DE",
    { weekday: "long" }
  ).format(new Date());

  setTextContent("#intro-day", dayName);
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