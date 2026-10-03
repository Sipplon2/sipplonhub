"use strict";

let rawEventEntries = [];
let eventEntries = [];
let eventCountdownTimer = null;

async function initEvents() {
  const nextEventContainer =
    document.querySelector("#next-event");

  if (!nextEventContainer) {
    return;
  }

  try {
    const response = await fetch(
      `data/${currentLanguage}/events.json`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(
        `events.json: HTTP ${response.status}`
      );
    }

    const entries = await response.json();

    if (!Array.isArray(entries)) {
      throw new Error(
        "events.json enthält keine gültige Liste."
      );
    }

    rawEventEntries =
      entries.filter(isValidEvent);

    refreshEventOccurrences();  

    renderEvents();
    startEventCountdowns();
  } catch (error) {
    console.error("Events:", error);

    nextEventContainer.innerHTML = `
      <article class="events-error">
        <strong>
          Events konnten nicht geladen werden
        </strong>

        <p>
          Prüfe data/de/events.json.
        </p>
      </article>
    `;
  }
}

function isValidEvent(entry) {
  return (
    entry &&
    entry.title &&
    parseEventDate(entry.start)
  );
}

function sortEvents(first, second) {
  return (
    parseEventDate(first.start).getTime() -
    parseEventDate(second.start).getTime()
  );
}

function renderEvents() {
  refreshEventOccurrences();
  const nextEventContainer =
    document.querySelector("#next-event");

  const listContainer =
    document.querySelector("#events-list");

  const countElement =
    document.querySelector(
      "#events-upcoming-count"
    );

  if (
    !nextEventContainer ||
    !listContainer
  ) {
    return;
  }

  const now = Date.now();

  const relevantEvents =
    eventEntries.filter((entry) => {
      const endDate =
        parseEventDate(entry.end);

      const startDate =
        parseEventDate(entry.start);

      return (
        endDate?.getTime() ??
        startDate.getTime()
      ) >= now;
    });

  /* Laufende Events zuerst (das mit dem frühesten Ende vorn), dann kommende. */
  relevantEvents.sort((first, second) => {
    const firstRunning = getEventStatus(first) === "running";
    const secondRunning = getEventStatus(second) === "running";

    if (firstRunning !== secondRunning) {
      return firstRunning ? -1 : 1;
    }

    const firstTime = firstRunning
      ? (parseEventDate(first.end)?.getTime() ?? Infinity)
      : parseEventDate(first.start).getTime();

    const secondTime = secondRunning
      ? (parseEventDate(second.end)?.getTime() ?? Infinity)
      : parseEventDate(second.start).getTime();

    return firstTime - secondTime;
  });

  const nextEvent =
    relevantEvents[0] ?? null;

  const upcomingCount =
    relevantEvents.filter(
      (entry) =>
        getEventStatus(entry) ===
        "upcoming"
    ).length;

  if (countElement) {
    countElement.textContent =
      currentLanguage === "en"
        ? `${upcomingCount} upcoming`
        : `${upcomingCount} bevorstehend`;
  }

  /* Hero: bis zu 2 laufende Events + das nächste kommende (max. 3 Zeilen) */
  const runningEvents = relevantEvents.filter(
    (entry) => getEventStatus(entry) === "running"
  );

  const upcomingEvents = relevantEvents.filter(
    (entry) => getEventStatus(entry) === "upcoming"
  );

  const heroRunning = runningEvents.slice(0, 2);
  const heroUpcoming = upcomingEvents.slice(0, heroRunning.length === 0 ? 2 : 1);

  nextEventContainer.innerHTML =
    nextEvent
      ? createNextEventCard(nextEvent, heroRunning, heroUpcoming)
      : createNoUpcomingEvents();

  /* Liste unten zeigt immer alle Events, auch die im Banner. */
  listContainer.innerHTML = relevantEvents
    .map(createEventListItem)
    .join("");
}

function refreshEventOccurrences() {
  eventEntries = rawEventEntries
    .map(getNextOccurrence)
    .filter(Boolean)
    .sort(sortEvents);
}

function createNextEventCard(entry, runningEvents = [], upcomingEvents = []) {
  const status = getEventStatus(entry);
  const isEnglish = currentLanguage === "en";
  const todayNumber = getGameDay();

  const todayName = getGameWeekdayName();

  const todayDuel =
    typeof allianceDuelEntries !== "undefined"
      ? allianceDuelEntries.find(
          (item) => Number(item.day) === todayNumber
        )
      : null;

  const todayTitle =
    todayDuel?.title ??
    (isEnglish ? "No duel today" : "Heute kein Duell-Tag");

  const groups = [];

  if (runningEvents.length > 0) {
    groups.push(
      createHeroGroup(
        isEnglish ? "RUNNING NOW" : "LÄUFT JETZT",
        "running",
        runningEvents
      )
    );
  }

  if (upcomingEvents.length > 0) {
    groups.push(
      createHeroGroup(
        isEnglish ? "UP NEXT" : "ALS NÄCHSTES",
        "upcoming",
        upcomingEvents
      )
    );
  }

  return `
    <article class="next-event-card ${status}">
      ${createEventBackground(entry)}

      <div class="hero-today">
        <p class="eyebrow">
          ${isEnglish ? "Today" : "Heute"} · ${escapeEventHtml(todayName)}
        </p>

        <h1>${escapeEventHtml(todayTitle)}</h1>

        ${
          typeof isInvasionWeek === "function" && isInvasionWeek()
            ? `<a class="war-badge" href="#invasion">
                ⚔️ ${isEnglish ? "War week · battle for the invasion" : "Kriegswoche · Kampf um die Invasion"}
              </a>`
            : ""
        }

        ${
          todayDuel
            ? `<a class="hero-button" href="#alliance">
                ${isEnglish ? "To today's plan" : "Zum Tagesplan"} →
              </a>`
            : ""
        }
      </div>

      <div class="hero-event">
        ${groups.join("")}
      </div>
    </article>
  `;
}

function createHeroGroup(label, kind, entries) {
  const loadingText =
    currentLanguage === "en" ? "…" : "…";

  return `
    <div class="hero-group ${kind}">
      <p class="next-event-label">${label}</p>

      ${entries
        .map((entry) => {
          const isRunning = kind === "running";
          const crop = Number(entry.backgroundCrop) || 0;

          return `
            <div class="hero-row ${kind}">
              <span
                class="hero-row-thumb"
                style="background-image: url('${escapeEventHtml(entry.background ?? "")}'); background-position: center ${crop > 0 ? "85%" : "center"};"
              ></span>

              <div class="hero-row-info">
                <strong>${escapeEventHtml(entry.title)}</strong>
                <small>
                  ${
                    isRunning
                      ? (currentLanguage === "en" ? "ending in" : "endet in")
                      : formatEventDate(entry.start)
                  }
                </small>
              </div>

              <strong
                class="hero-row-countdown"
                data-event-countdown
                data-event-start="${escapeEventHtml(entry.start)}"
                data-event-end="${escapeEventHtml(entry.end ?? "")}"
              >
                ${loadingText}
              </strong>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function createEventBackground(entry) {
  const crop = Number(entry.backgroundCrop) || 0;

  return `
    <div
      class="event-bg"
      style="
        background-image: url('${escapeEventHtml(entry.background ?? "")}');
        --crop: ${crop};
      "
    ></div>
  `;
}

function createEventGuide(entry) {
  if (!Array.isArray(entry.guide) || entry.guide.length === 0) {
    return "";
  }

  return `
    <details class="event-guide" data-guide-id="${escapeEventHtml(entry.id ?? "")}">
      <summary>${currentLanguage === "en" ? "Quick guide" : "Kurzguide"}</summary>

      <ul>
        ${entry.guide
          .map((line) => `<li>${applyTimeTokens(escapeEventHtml(line))}</li>`)
          .join("")}
      </ul>
    </details>
  `;
}

function createEventListItem(entry) {
  const status =
    getEventStatus(entry);

  return `
    <article class="event-list-item ${status}">
      ${createEventBackground(entry)}

      <div class="event-list-top">
        <h3>${escapeEventHtml(entry.title)}</h3>
        <span class="event-status">${getEventStatusText(status)}</span>
      </div>

      <p>${escapeEventHtml(entry.description ?? "")}</p>

      ${createEventGuide(entry)}

      <div class="event-list-foot">
        <small>${formatEventDate(entry.start)}</small>

        <strong
          class="event-list-countdown"
          data-event-countdown
          data-event-start="${escapeEventHtml(entry.start)}"
          data-event-end="${escapeEventHtml(entry.end ?? "")}"
        >
          …
        </strong>
      </div>
    </article>
  `;
}

function startEventCountdowns() {
  if (eventCountdownTimer) {
    window.clearInterval(
      eventCountdownTimer
    );
  }

  updateEventCountdowns();

  eventCountdownTimer =
    window.setInterval(
      updateEventCountdowns,
      1000
    );
}

function updateEventCountdowns() {
  const now = Date.now();

  for (const element of document.querySelectorAll(
    "[data-event-countdown]"
  )) {
    const startDate = parseEventDate(
      element.dataset.eventStart
    );

    const endDate = parseEventDate(
      element.dataset.eventEnd
    );

    if (!startDate) {
      element.textContent = "—";
      continue;
    }

    const eventCard = element.closest(
      ".hero-row, .next-event-card, .event-list-item"
    );

    const isCurrentlyDisplayedAsRunning =
      eventCard?.classList.contains("running");

    const hasStarted =
      now >= startDate.getTime();

    const hasEnded =
      endDate
        ? now > endDate.getTime()
        : false;

    /*
     * Event hat gerade begonnen:
     * Karte sofort neu rendern.
     */
    if (
      hasStarted &&
      !hasEnded &&
      !isCurrentlyDisplayedAsRunning
    ) {
      renderEvents();
      return;
    }

    /*
     * Event ist gerade abgelaufen:
     * Liste und Wiederholungen neu berechnen.
     */
    if (hasEnded) {
      renderEvents();
      return;
    }

    const targetDate =
      hasStarted && endDate
        ? endDate
        : startDate;

    const difference =
      targetDate.getTime() - now;

    element.textContent =
      formatCountdown(difference);
  }
}

function getEventStatus(entry) {
  const now = Date.now();

  const startDate =
    parseEventDate(entry.start);

  const endDate =
    parseEventDate(entry.end);

  if (!startDate) {
    return "ended";
  }

  if (now < startDate.getTime()) {
    return "upcoming";
  }

  if (
    !endDate ||
    now <= endDate.getTime()
  ) {
    return "running";
  }

  return "ended";
}

function getEventStatusText(status) {
  switch (status) {
    case "running":
      return "Läuft";

    case "upcoming":
      return "Bevorstehend";

    default:
      return "Beendet";
  }
}

function formatCountdown(milliseconds) {
  const totalSeconds = Math.max(
    0,
    Math.floor(milliseconds / 1000)
  );

  const days = Math.floor(
    totalSeconds / 86400
  );

  const hours = Math.floor(
    (totalSeconds % 86400) / 3600
  );

  const minutes = Math.floor(
    (totalSeconds % 3600) / 60
  );

  const seconds =
    totalSeconds % 60;

  const parts = [];

  if (days > 0) {
    parts.push(`${days}d`);
  }

  if (days > 0 || hours > 0) {
    parts.push(`${hours}h`);
  }

  if (
    days > 0 ||
    hours > 0 ||
    minutes > 0
  ) {
    parts.push(`${minutes}m`);
  }

  parts.push(`${seconds}s`);

  return parts.join(" ");
}

function parseEventDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date;
}

function formatEventDate(value) {
  const date = parseEventDate(value);

  if (!date) {
    return "—";
  }

  const formatted = new Intl.DateTimeFormat(
    currentLanguage === "en" ? "en-US" : "de-DE",
    {
      timeZone: getDisplayTimeZone(),
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }
  ).format(date);

  if (timeMode !== "apo") {
    return formatted;
  }

  return currentLanguage === "en"
    ? `${formatted} Apo Time`
    : `${formatted} Apo-Time`;
}

function createNoUpcomingEvents() {
  return `
    <article class="events-empty">
      <span>📅</span>

      <div>
        <h3>
          Keine kommenden Events
        </h3>

        <p>
          Momentan sind keine Termine eingetragen.
        </p>
      </div>
    </article>
  `;
}

function escapeEventHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getNextOccurrence(entry) {
  const originalStart = parseEventDate(entry.start);
  const originalEnd = parseEventDate(entry.end);

  if (!originalStart) {
    return null;
  }

  const repeatDays = Number(entry.repeatDays);

  if (!Number.isFinite(repeatDays) || repeatDays <= 0) {
    return {
      ...entry
    };
  }

  /*
   * Zyklus-Events (z. B. Serverkrieg): wiederholt sich alle repeatDays,
   * aber nur in den ersten activeDays eines cycleDays-Zyklus.
   * Kalendertage statt Millisekunden, damit die Uhrzeit bei
   * Sommer-/Winterzeit-Wechsel stabil bleibt.
   */
  const cycleDays = Number(entry.cycleDays);
  const activeDays = Number(entry.activeDays);

  if (
    Number.isFinite(cycleDays) &&
    Number.isFinite(activeDays) &&
    cycleDays > 0
  ) {
    const cycleDuration =
      originalEnd
        ? Math.max(
            0,
            originalEnd.getTime() -
              originalStart.getTime()
          )
        : 0;

    for (let step = 0; step < 400; step += 1) {
      const offsetDays = step * repeatDays;

      if (offsetDays % cycleDays >= activeDays) {
        continue;
      }

      const occurrenceStart = new Date(originalStart);

      occurrenceStart.setDate(
        originalStart.getDate() + offsetDays
      );

      const occurrenceEnd = new Date(
        occurrenceStart.getTime() + cycleDuration
      );

      if (occurrenceEnd.getTime() > Date.now()) {
        return {
          ...entry,
          start: formatLocalEventDate(occurrenceStart),
          end: originalEnd
            ? formatLocalEventDate(occurrenceEnd)
            : null
        };
      }
    }

    return null;
  }

  const repeatMilliseconds =
    repeatDays * 24 * 60 * 60 * 1000;

  const duration =
    originalEnd
      ? Math.max(
          0,
          originalEnd.getTime() -
            originalStart.getTime()
        )
      : 0;

  const now = Date.now();

  let occurrenceStart =
    originalStart.getTime();

  let occurrenceEnd =
    occurrenceStart + duration;

  /*
   * Solange das Event bereits vollständig beendet ist,
   * wird es um einen Wiederholungszeitraum verschoben.
   */
  if (occurrenceEnd <= now) {
    const elapsedSinceStart =
      now - occurrenceStart;

    const completedIntervals =
      Math.floor(
        elapsedSinceStart /
          repeatMilliseconds
      );

    occurrenceStart +=
      completedIntervals *
      repeatMilliseconds;

    occurrenceEnd =
      occurrenceStart + duration;

    /*
     * Falls auch dieser berechnete Termin schon vorbei ist,
     * direkt eine weitere Periode vorspringen.
     */
    if (occurrenceEnd <= now) {
      occurrenceStart +=
        repeatMilliseconds;

      occurrenceEnd =
        occurrenceStart + duration;
    }
  }

  return {
    ...entry,

    start: formatLocalEventDate(
      new Date(occurrenceStart)
    ),

    end: originalEnd
      ? formatLocalEventDate(
          new Date(occurrenceEnd)
        )
      : null
  };
}

function formatLocalEventDate(date) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  const hours =
    String(
      date.getHours()
    ).padStart(2, "0");

  const minutes =
    String(
      date.getMinutes()
    ).padStart(2, "0");

  const seconds =
    String(
      date.getSeconds()
    ).padStart(2, "0");

  return (
    `${year}-${month}-${day}` +
    `T${hours}:${minutes}:${seconds}`
  );
}