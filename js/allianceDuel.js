"use strict";

let allianceDuelEntries = [];
let selectedAllianceDuelDay = null;

async function initAllianceDuel() {
  const contentContainer =
    document.querySelector("#alliance-content");

  try {
    const response = await fetch(
      `data/${currentLanguage}/alliance_duel.json`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(
        `alliance_duel.json: HTTP ${response.status}`
      );
    }

    const entries = await response.json();

    if (
      !Array.isArray(entries) ||
      entries.length === 0
    ) {
      throw new Error(
        "alliance_duel.json enthält keine gültigen Einträge."
      );
    }

    allianceDuelEntries = entries
      .filter(isValidAllianceDuelEntry)
      .sort(
        (first, second) =>
          Number(first.day) -
          Number(second.day)
      );

    if (allianceDuelEntries.length === 0) {
      throw new Error(
        "Es wurden keine gültigen Allianz-Duell-Einträge gefunden."
      );
    }

    selectedAllianceDuelDay =
      getInitialAllianceDuelDay();

    renderAllianceDuelTabs();
    renderAllianceDuelContent();
  } catch (error) {
    console.error(
      "Allianz-Duell:",
      error
    );

    if (!contentContainer) {
      return;
    }

    contentContainer.innerHTML = `
      <p class="panel-eyebrow">
        Fehler
      </p>

      <h3>
        Allianz-Duell konnte nicht geladen werden
      </h3>

      <p class="panel-subtitle">
        Prüfe data/de/alliance_duel.json.
      </p>
    `;
  }
}

function isValidAllianceDuelEntry(entry) {
  return (
    entry &&
    Number.isInteger(Number(entry.day)) &&
    Number(entry.day) >= 1 &&
    Number(entry.day) <= 6
  );
}

function getInitialAllianceDuelDay() {
  const currentDay =
    new Date().getDay();

  const availableDays =
    allianceDuelEntries.map(
      (entry) => Number(entry.day)
    );

  if (availableDays.includes(currentDay)) {
    return currentDay;
  }

  return availableDays[0] ?? 1;
}

function renderAllianceDuelTabs() {
  const tabsContainer =
    document.querySelector("#alliance-tabs");

  if (!tabsContainer) {
    return;
  }

  const shortNames = {
    1: "MO",
    2: "DI",
    3: "MI",
    4: "DO",
    5: "FR",
    6: "SA",
  };

  tabsContainer.innerHTML =
    allianceDuelEntries
      .map((entry) => {
        const day =
          Number(entry.day);

        const isActive =
          day ===
          Number(selectedAllianceDuelDay);

        return `
          <button
            type="button"
            class="day-tab ${
              isActive ? "active" : ""
            }"
            data-alliance-day="${day}"
            aria-pressed="${isActive}"
          >
            <span>
              ${shortNames[day] ?? ""}
            </span>

            <small>
              ${escapeAllianceDuelHtml(
                entry.dayName ?? ""
              )}
            </small>
          </button>
        `;
      })
      .join("");

  registerAllianceDuelTabEvents();
}

function registerAllianceDuelTabEvents() {
  for (const button of document.querySelectorAll(
    "[data-alliance-day]"
  )) {
    button.addEventListener(
      "click",
      () => {
        const selectedDay =
          Number(
            button.dataset.allianceDay
          );

        if (
          !Number.isInteger(selectedDay)
        ) {
          return;
        }

        selectedAllianceDuelDay =
          selectedDay;

        renderAllianceDuelTabs();
        renderAllianceDuelContent();
      }
    );
  }
}

function renderAllianceDuelContent() {
  const contentContainer =
    document.querySelector(
      "#alliance-content"
    );

  if (!contentContainer) {
    return;
  }

  const entry =
    allianceDuelEntries.find(
      (item) =>
        Number(item.day) ===
        Number(selectedAllianceDuelDay)
    );

  if (!entry) {
    contentContainer.innerHTML = `
      <p class="panel-eyebrow">
        Fehler
      </p>

      <h3>
        Keine Daten gefunden
      </h3>

      <p class="panel-subtitle">
        Für diesen Tag wurde kein Eintrag gefunden.
      </p>
    `;

    return;
  }

  const tasks =
    Array.isArray(entry.tasks)
      ? entry.tasks
      : [];

  const imagePath =
  entry.image
    ? `/assets/images/alliance/${entry.image}`
    : "";

  contentContainer.innerHTML = `
    <div
  class="alliance-header"
  style="--header-image:url('${imagePath}')"
>
  <div class="alliance-header-overlay">
    <div class="alliance-header-content">

      <div class="alliance-day">
        ${escapeAllianceDuelHtml(
          (entry.dayName ?? "").toUpperCase()
        )}
      </div>

      <h2>
        ${escapeAllianceDuelHtml(
          entry.title ?? ""
        )}
      </h2>

      ${
        entry.boss
          ? `
            <div class="alliance-boss">
              ☠ Boss:
              <strong>
                ${escapeAllianceDuelHtml(
                  entry.boss
                )}
              </strong>
            </div>
          `
          : ""
      }

    </div>
  </div>
</div>

    <div class="panel-section">
      <h4>
        Aufgaben
      </h4>

      ${
        tasks.length > 0
          ? `
            <div class="alliance-task-list">
              ${tasks
                .map(
                  createAllianceDuelTask
                )
                .join("")}
            </div>
          `
          : `
            <p class="panel-subtitle">
              Für diesen Tag sind keine Aufgaben eingetragen.
            </p>
          `
      }
    </div>

    ${
      entry.strategy
        ? `
          <article class="strategy-card">
            <strong>
              TOTALE BEWAFFNUNG
            </strong>

            <p>
              ${escapeAllianceDuelHtml(
                entry.strategy
              )}
            </p>
          </article>
        `
        : ""
    }
  `;
}

function createAllianceDuelTask(task) {
  const isObject =
    task !== null &&
    typeof task === "object" &&
    !Array.isArray(task);

  const icon =
    isObject
      ? task.icon ?? "•"
      : "•";

  const name =
    isObject
      ? task.name ?? ""
      : task;

  return `
  <article class="alliance-task">
    <div class="alliance-task-icon">
      <img
        src="/assets/images/icons/alliance/${escapeAllianceDuelHtml(
          icon
        )}"
        alt=""
        loading="lazy"
      >
    </div>

    <strong>
      ${escapeAllianceDuelHtml(name)}
    </strong>
  </article>
`;
}

function escapeAllianceDuelHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}