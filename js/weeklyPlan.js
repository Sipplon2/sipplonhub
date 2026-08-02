"use strict";

let weeklyTaskEntries = [];
let selectedWeeklyTaskDay = null;

async function initWeeklyPlan() {
  try {
    const response = await fetch(
      `data/${currentLanguage}/weekly_tasks.json`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(
        `weekly_tasks.json: HTTP ${response.status}`
      );
    }

    const entries = await response.json();

    if (
      !Array.isArray(entries) ||
      entries.length === 0
    ) {
      throw new Error(
        "weekly_tasks.json enthält keine gültigen Einträge."
      );
    }

    weeklyTaskEntries = entries.sort(
      (first, second) =>
        Number(first.day) -
        Number(second.day)
    );

    const currentDay =
      new Date().getDay();

    selectedWeeklyTaskDay =
      currentDay >= 1 &&
      currentDay <= 7
        ? currentDay
        : 1;

    renderWeeklyPlanTabs();
    renderWeeklyPlanContent();
  } catch (error) {
    console.error(
      "Saison-Aufgaben:",
      error
    );

    const container =
      document.querySelector(
        "#season-content"
      );

    if (container) {
      container.innerHTML = `
        <p class="panel-eyebrow">
          Fehler
        </p>

        <h3>
          Saison-Aufgaben konnten nicht geladen werden
        </h3>

        <p class="panel-subtitle">
          Prüfe data/de/weekly_tasks.json.
        </p>
      `;
    }
  }
}

function renderWeeklyPlanTabs() {
  const tabs =
    document.querySelector(
      "#season-tabs"
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
    weeklyTaskEntries
      .map((entry) => {
        const day =
          Number(entry.day);

        const isActive =
          day ===
          Number(
            selectedWeeklyTaskDay
          );

        return `
          <button
            type="button"
            class="day-tab ${
              isActive ? "active" : ""
            }"
            data-season-day="${day}"
            aria-pressed="${isActive}"
          >
            <span>
              ${shortNames[day] ?? ""}
            </span>

            <small>
              ${escapeWeeklyPlanHtml(
                entry.dayName ?? ""
              )}
            </small>
          </button>
        `;
      })
      .join("");

  registerWeeklyPlanTabEvents();
}

function registerWeeklyPlanTabEvents() {
  for (const button of document.querySelectorAll(
    "[data-season-day]"
  )) {
    button.addEventListener(
      "click",
      () => {
        selectedWeeklyTaskDay =
          Number(
            button.dataset.seasonDay
          );

        renderWeeklyPlanTabs();
        renderWeeklyPlanContent();
      }
    );
  }
}

function renderWeeklyPlanContent() {
  const container =
    document.querySelector(
      "#season-content"
    );

  if (!container) {
    return;
  }

  const entry =
    weeklyTaskEntries.find(
      (item) =>
        Number(item.day) ===
        Number(
          selectedWeeklyTaskDay
        )
    );

  if (!entry) {
    return;
  }

  const tasks =
    Array.isArray(entry.tasks)
      ? entry.tasks
      : [];

  const imagePath =
  entry.image
    ? `/assets/images/season/${entry.image}`
    : "";

  container.innerHTML = `
    <section
      class="season-feature"
      ${
        imagePath
          ? `style="--season-image: url('${escapeWeeklyPlanHtml(
              imagePath
            )}')"`
          : ""
      }
    >
      <div class="season-feature-overlay"></div>

      <div class="season-feature-content">
        <p class="panel-eyebrow">
          ${escapeWeeklyPlanHtml(
            entry.dayName ?? ""
          )}
        </p>

        <h3>
          ${escapeWeeklyPlanHtml(
            entry.title ?? ""
          )}
        </h3>

        <div class="season-feature-section">
          <h4>
            Aufgaben
          </h4>

          <ul class="season-feature-list">
            ${tasks
              .map(
                (task) => `
                  <li>
                    ${escapeWeeklyPlanHtml(
                      task.name ?? task
                    )}
                  </li>
                `
              )
              .join("")}
          </ul>
        </div>

        ${
          entry.hint
            ? `
              <article class="season-feature-hint">
                <strong>
                  Strategie-Hinweis
                </strong>

                <p>
                  ${escapeWeeklyPlanHtml(
                    entry.hint
                  )}
                </p>
              </article>
            `
            : ""
        }
      </div>
    </section>
  `;
}

function escapeWeeklyPlanHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}