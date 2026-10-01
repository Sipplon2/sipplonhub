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

  const today = new Date().getDay();

  tabs.innerHTML =
    weeklyTaskEntries
      .map((entry) => {
        const day = Number(entry.day);
        const isActive =
          day === Number(selectedWeeklyTaskDay);

        return `
          <button
            type="button"
            class="day-tab day-${day} ${isActive ? "active" : ""} ${day === today ? "today" : ""}"
            data-season-day="${day}"
            title="${escapeWeeklyPlanHtml(entry.dayName ?? "")}"
            aria-pressed="${isActive}"
          >
            <span class="day-tab-short">${escapeWeeklyPlanHtml((entry.dayName ?? "").slice(0, 2).toUpperCase())}</span>
            <span class="day-tab-full">${escapeWeeklyPlanHtml(entry.dayName ?? "")}</span>
          </button>
        `;
      })
      .join("");

  const activeTab = tabs.querySelector(".day-tab.active");
  if (activeTab) {
    tabs.scrollLeft =
      activeTab.offsetLeft - (tabs.clientWidth - activeTab.offsetWidth) / 2;
  }

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

  const seasonImage =
    entry.image
      ? `url('/assets/images/season/${escapeWeeklyPlanHtml(entry.image)}')`
      : "none";

  /* Fallback: Tagesbild aus dem Allianz-Duell, falls kein Saison-Bild existiert */
  const dayImage =
    typeof allianceDuelEntries !== "undefined"
      ? allianceDuelEntries.find(
          (item) => Number(item.day) === Number(entry.day)
        )?.image
      : null;

  const dayImageCss =
    dayImage
      ? `url('/assets/images/alliance/${escapeWeeklyPlanHtml(dayImage)}')`
      : "none";

  const isEnglish = currentLanguage === "en";

  container.innerHTML = `
    <div class="season day-${Number(entry.day)}">
      <div
        class="duel-hero"
        style="--season-image: ${seasonImage}; --day-image: ${dayImageCss}"
      >
        <span class="duel-day">
          ${escapeWeeklyPlanHtml(entry.dayName ?? "")}
        </span>

        <h3>${escapeWeeklyPlanHtml(entry.title ?? "")}</h3>
      </div>

      <div class="duel-main">
        <div>
          <h4 class="block-title">${isEnglish ? "Missions" : "Aufgaben"}</h4>

          <ul class="quest-list">
            ${tasks
              .map((task) => {
                const name = task.name ?? task;

                return `
                  <li class="quest">
                    <div class="quest-body">
                      <span class="quest-name">${escapeWeeklyPlanHtml(name)}</span>
                      ${
                        task.progress
                          ? `<span class="quest-progress">${escapeWeeklyPlanHtml(task.progress)}</span>`
                          : ""
                      }
                    </div>
                    ${
                      task.reward
                        ? `<span class="quest-reward">${escapeWeeklyPlanHtml(task.reward)}</span>`
                        : ""
                    }
                  </li>
                `;
              })
              .join("")}
          </ul>
        </div>

        ${
          entry.hint
            ? `
              <article class="callout">
                <span class="callout-mark" aria-hidden="true">💡</span>
                <div>
                  <strong>${isEnglish ? "Strategy tip" : "Strategie-Hinweis"}</strong>
                  <p>${escapeWeeklyPlanHtml(entry.hint)}</p>
                </div>
              </article>
            `
            : ""
        }
      </div>
    </div>
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