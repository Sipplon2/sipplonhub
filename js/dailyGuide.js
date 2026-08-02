"use strict";

let dailyGuideEntries = [];
let selectedDailyGuideDay = null;

async function initDailyGuide() {
  try {
    const response = await fetch(
      "data/de/today.json",
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(
        `today.json: HTTP ${response.status}`
      );
    }

    const entries =
      await response.json();

    if (!Array.isArray(entries)) {
      throw new Error(
        "today.json enthält keine gültige Liste."
      );
    }

    dailyGuideEntries = entries;

    selectedDailyGuideDay =
      getCurrentDailyGuideDay();

    renderDailyGuideTabs();
    renderDailyGuideContent();
  } catch (error) {
    console.error(
      "Tagesguide:",
      error
    );

    const container =
      document.querySelector(
        "#daily-guide-content"
      );

    if (container) {
      container.innerHTML = `
        <p class="panel-eyebrow">
          Fehler
        </p>

        <h3>
          Tagesguide konnte nicht geladen werden
        </h3>

        <p class="panel-subtitle">
          Prüfe data/de/today.json.
        </p>
      `;
    }
  }
}

function getCurrentDailyGuideDay() {
  const javascriptDay =
    new Date().getDay();

  return javascriptDay === 0
    ? 7
    : javascriptDay;
}

function renderDailyGuideTabs() {
  const tabs =
    document.querySelector(
      "#daily-tabs"
    );

  if (!tabs) {
    return;
  }

  const shortNames = {
    1: "MO",
    2: "DI",
    3: "MI",
    4: "DO",
    5: "FR",
    6: "SA",
    7: "SO",
  };

  tabs.innerHTML =
    dailyGuideEntries
      .map((entry) => {
        const isActive =
          Number(entry.day) ===
          Number(selectedDailyGuideDay);

        return `
          <button
            type="button"
            class="day-tab ${
              isActive ? "active" : ""
            }"
            data-day="${Number(entry.day)}"
            aria-pressed="${isActive}"
          >
            <span>
              ${shortNames[entry.day] ?? ""}
            </span>

            <small>
              ${escapeDailyGuideHtml(
                entry.dayName
              )}
            </small>
          </button>
        `;
      })
      .join("");

  registerDailyGuideTabEvents();
}

function registerDailyGuideTabEvents() {
  for (const button of document.querySelectorAll(
    ".day-tab"
  )) {
    button.addEventListener(
      "click",
      () => {
        selectedDailyGuideDay =
          Number(button.dataset.day);

        renderDailyGuideTabs();
        renderDailyGuideContent();
      }
    );
  }
}

function renderDailyGuideContent() {
  const container =
    document.querySelector(
      "#daily-guide-content"
    );

  if (!container) {
    return;
  }

  const entry =
    dailyGuideEntries.find(
      (item) =>
        Number(item.day) ===
        Number(selectedDailyGuideDay)
    );

  if (!entry) {
    return;
  }

  const actions =
    Array.isArray(entry.actions)
      ? entry.actions
      : [];

  container.innerHTML = `
    <p class="panel-eyebrow">
      ${escapeDailyGuideHtml(
        entry.dayName
      )}
    </p>

    <h3>
      ${escapeDailyGuideHtml(
        entry.title
      )}
    </h3>

    <p class="panel-subtitle">
      ${escapeDailyGuideHtml(
        entry.subtitle
      )}
    </p>

    <div class="panel-section">
      <h4>
        Wichtige Aktionen
      </h4>

      <ul class="task-list">
        ${actions
          .map(
            (action) => `
              <li>
                ${escapeDailyGuideHtml(
                  action
                )}
              </li>
            `
          )
          .join("")}
      </ul>
    </div>

    <article class="tip-card">
      <strong>
        Tipp des Tages
      </strong>

      <p>
        ${escapeDailyGuideHtml(
          entry.tip
        )}
      </p>
    </article>
  `;
}

function escapeDailyGuideHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}