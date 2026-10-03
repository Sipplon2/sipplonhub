"use strict";

let seasonGuideData = null;
let selectedSeasonId = null;

async function initSeasonGuide() {
  try {
    const response = await fetch(
      `data/${currentLanguage}/seasons.json`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error(`seasons.json: HTTP ${response.status}`);
    }

    seasonGuideData = await response.json();
  } catch (error) {
    console.error("Saison-Guide:", error);
    seasonGuideData = null;
  }

  /* Standard: die neueste Saison (steht in der Datei zuerst) */
  if (
    seasonGuideData &&
    !seasonGuideData.seasons.some((item) => item.id === selectedSeasonId)
  ) {
    selectedSeasonId = seasonGuideData.seasons[0]?.id ?? null;
  }

  renderSeasonGuide();
}

function renderSeasonGuide() {
  const body = document.querySelector("#saison-body");

  if (!body || !seasonGuideData) {
    return;
  }

  const data = seasonGuideData;
  const escape = escapeAllianceDuelHtml;
  const fill = (text) => applyTimeTokens(escape(text));
  const seasonWord = currentLanguage === "en" ? "Season" : "Saison";

  const season =
    data.seasons.find((item) => item.id === selectedSeasonId) ??
    data.seasons[0];

  document.querySelector("#saison-title").textContent = data.title;
  document.querySelector("#saison-subtitle").textContent = data.subtitle;

  const renderItem = (item, type) => `
    <article class="sg-card ${type === "steps" ? "sg-step" : ""}">
      <span class="sg-icon" aria-hidden="true">${escape(item.icon)}</span>

      <div class="sg-text">
        <h4>
          ${escape(item.title)}
          ${item.badge ? `<span class="sg-badge">${fill(item.badge)}</span>` : ""}
        </h4>
        <p>${fill(item.text)}</p>
      </div>
    </article>
  `;

  const seasonCards = data.seasons
    .map((item) => {
      const number = item.tab.replace(/\D/g, "");

      /* Optionales eigenes Titelbild: "cover": "assets/images/seasons/s5.webp" */
      const cover = item.cover
        ? `<img src="${escape(item.cover)}" alt="" loading="lazy">`
        : `<span class="sg-cover-letter">${escape(item.tab)}</span>`;

      return `
        <button
          type="button"
          class="sg-season ${item.id === season.id ? "active" : ""}"
          data-season="${escape(item.id)}"
          aria-pressed="${item.id === season.id}"
        >
          <span
            class="sg-cover ${escape(item.id)} ${item.cover ? "has-image" : ""}"
          >
            ${item.cover ? "" : `<span class="sg-season-badge ${escape(item.id)}">${escape(item.tab)}</span>`}
            ${cover}
          </span>

          <span class="sg-season-info">
            <strong>${seasonWord} ${escape(number)}</strong>
            <span>${escape(item.name)}</span>
            <small>${escape(item.meta)}</small>
            <em class="sg-ended">${escape(data.endedLabel)}</em>
          </span>
        </button>
      `;
    })
    .join("");

  /* Kommende Saison: nicht anklickbar, nur "Coming Soon" */
  const upcomingCard = data.upcoming
    ? `
        <div class="sg-season upcoming" aria-disabled="true">
          <span class="sg-cover ${escape(data.upcoming.id)}">
            <span class="sg-season-badge ${escape(data.upcoming.id)}">${escape(data.upcoming.tab)}</span>
            <span class="sg-cover-letter">${escape(data.upcoming.tab)}</span>
          </span>

          <span class="sg-season-info">
            <strong>${seasonWord} ${escape(data.upcoming.tab.replace(/\D/g, ""))}</strong>
            <span>${escape(data.upcoming.name)}</span>
            <small>${escape(data.upcoming.meta)}</small>
            <em class="sg-soon">${escape(data.upcoming.soonLabel)}</em>
          </span>
        </div>
      `
    : "";

  body.innerHTML = `
    <div class="sg-season-grid">${upcomingCard}${seasonCards}</div>

    <div class="sg-detail" id="sg-detail">
      <div class="sg-ended-banner" role="status">
        <span class="sg-ended-flag" aria-hidden="true">🏁</span>

        <div>
          <strong>${escape(data.endedLabel)}</strong>
          <p>${escape(data.endedText)}</p>
        </div>
      </div>

      <article class="sg-intro">
        <div class="sg-intro-head">
          <h3>${escape(season.theme)} ${seasonWord} ${escape(season.tab.replace(/\D/g, ""))}: ${escape(season.name)}</h3>
        </div>

        <p>${escape(season.intro)}</p>
      </article>

      ${season.sections
        .map(
          (section) => `
            <section class="sg-section">
              <h3 class="block-title">${escape(section.title)}</h3>

              <div class="sg-grid ${section.type === "steps" ? "steps" : ""}">
                ${section.items.map((item) => renderItem(item, section.type)).join("")}
              </div>

              ${section.note ? `<p class="invasion-group-note">${fill(section.note)}</p>` : ""}
            </section>
          `
        )
        .join("")}
    </div>
  `;

  for (const button of body.querySelectorAll("[data-season]")) {
    button.addEventListener("click", () => {
      selectedSeasonId = button.dataset.season;
      renderSeasonGuide();

      document
        .querySelector("#sg-detail")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
}
