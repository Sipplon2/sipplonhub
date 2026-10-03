"use strict";

let invasionData = null;
let invasionTimer = null;

/*
 * Kriegswoche = von Sonntag 00:00 Apo-Zeit vor dem Serverkrieg bis zum Ende des Krieges.
 * Der Termin kommt aus events.json (Event "server-war").
 */
function isInvasionWeek() {
  if (typeof eventEntries === "undefined") {
    return false;
  }

  const war = eventEntries.find((entry) => entry.id === "server-war");
  const warStart = war ? parseEventDate(war.start) : null;
  const warEnd = war ? parseEventDate(war.end) : null;

  if (!warStart) {
    return false;
  }

  const apo = getApoParts(warStart);

  /* Samstag minus 6 Tage = Sonntag, 00:00 Apo-Zeit (UTC−2) = 02:00 UTC */
  const weekStart = Date.UTC(
    Number(apo.year),
    Number(apo.month) - 1,
    Number(apo.day) - 6,
    2,
    0
  );

  const now = Date.now();
  const end = (warEnd ?? warStart).getTime();

  return now >= weekStart && now <= end;
}

async function initInvasion() {
  try {
    const response = await fetch(
      `data/${currentLanguage}/invasion.json`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error(`invasion.json: HTTP ${response.status}`);
    }

    invasionData = await response.json();
  } catch (error) {
    console.error("Invasion:", error);
    invasionData = null;
  }

  renderInvasion();

  if (invasionTimer) {
    window.clearInterval(invasionTimer);
  }

  invasionTimer = window.setInterval(renderInvasion, 60000);
}

function renderInvasion() {
  const section = document.querySelector("#invasion");

  if (!section) {
    return;
  }

  const visible = Boolean(invasionData) && isInvasionWeek();

  section.hidden = !visible;
  document.body.classList.toggle("invasion-week", visible);

  if (!visible) {
    return;
  }

  const data = invasionData;
  const escape = escapeAllianceDuelHtml;

  section.querySelector("#invasion-title").textContent = data.title;
  section.querySelector("#invasion-subtitle").textContent = data.subtitle;

  section.querySelector("#invasion-body").innerHTML = `
    <h4 class="block-title">${escape(data.groupsTitle)}</h4>

    <div class="invasion-groups">
      ${data.groups
        .map(
          (group) => `
            <div class="invasion-group">
              <p class="invasion-group-name">${escape(group.name)}</p>

              ${group.tasks
                .map(
                  (task) => `
                    <div class="task">
                      <span class="task-icon invasion-icon" aria-hidden="true">${task.icon}</span>
                      <span class="task-name">${escape(task.name)}</span>
                    </div>
                  `
                )
                .join("")}

              ${
                group.note
                  ? `<p class="invasion-group-note">${applyTimeTokens(escape(group.note))}</p>`
                  : ""
              }
            </div>
          `
        )
        .join("")}
    </div>

    <aside class="invasion-info">
      <p class="invasion-info-title">
        <span aria-hidden="true">ℹ️</span>
        ${escape(data.infoTitle)}
      </p>

      <ul>
        <li>
          <span class="dot win" aria-hidden="true"></span>
          <span><strong>${escape(data.attackerTitle)}:</strong> ${escape(data.attackerText)}</span>
        </li>
        <li>
          <span class="dot lose" aria-hidden="true"></span>
          <span><strong>${escape(data.defenderTitle)}:</strong> ${escape(data.defenderText)}</span>
        </li>
      </ul>
    </aside>
  `;
}
