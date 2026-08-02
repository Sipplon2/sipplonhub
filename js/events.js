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
      `${upcomingCount} bevorstehend`;
  }

  nextEventContainer.innerHTML =
    nextEvent
      ? createNextEventCard(nextEvent)
      : createNoUpcomingEvents();

  listContainer.innerHTML =
    relevantEvents.length > 0
      ? relevantEvents
          .slice(1)
          .map(createEventListItem)
          .join("")
      : "";
}

function refreshEventOccurrences() {
  eventEntries = rawEventEntries
    .map(getNextOccurrence)
    .filter(Boolean)
    .sort(sortEvents);
}

function createNextEventCard(entry) {
  const status =
    getEventStatus(entry);

  const eventLabel =
    status === "running"
      ? (
          currentLanguage === "en"
            ? "EVENT IS LIVE"
            : "EVENT LÄUFT GERADE"
        )
      : (
          currentLanguage === "en"
            ? "NEXT EVENT"
            : "NÄCHSTES EVENT"
        );

  const countdownLabel =
    status === "running"
      ? (
          currentLanguage === "en"
            ? "ENDING IN"
            : "ENDET IN"
        )
      : (
          currentLanguage === "en"
            ? "STARTING IN"
            : "STARTET IN"
        );

  const loadingText =
    currentLanguage === "en"
      ? "Calculating …"
      : "Wird berechnet …";

  return `
    <article
      class="next-event-card ${status}"
      style="
        background-image:
          linear-gradient(
            90deg,
            rgba(15, 18, 22, 0.94) 0%,
            rgba(15, 18, 22, 0.78) 45%,
            rgba(15, 18, 22, 0.35) 100%
          ),
          url('${escapeEventHtml(
            entry.background ?? ""
          )}');
      "
    >
      <div class="next-event-icon">
        <img
          src="${escapeEventHtml(
            entry.icon ?? ""
          )}"
          alt="${escapeEventHtml(
            entry.title ?? ""
          )}"
        >
      </div>

      <div class="next-event-content">
        <p class="next-event-label">
          ${eventLabel}
        </p>

        <h3>
          ${escapeEventHtml(
            entry.title
          )}
        </h3>

        <p>
          ${escapeEventHtml(
            entry.description ?? ""
          )}
        </p>

        <span class="next-event-date">
          ${formatEventDate(
            entry.start
          )}
        </span>
      </div>

      <div class="next-event-countdown">
        <small>
          ${countdownLabel}
        </small>

        <strong
          data-event-countdown
          data-event-start="${escapeEventHtml(
            entry.start
          )}"
          data-event-end="${escapeEventHtml(
            entry.end ?? ""
          )}"
        >
          ${loadingText}
        </strong>
      </div>
    </article>
  `;
}

function createEventListItem(entry) {
  const status =
    getEventStatus(entry);

  return `
    <article
      class="event-list-item ${status}"
      style="
  background-image:
    linear-gradient(
      90deg,
      rgba(15, 18, 22, 0.96) 0%,
      rgba(15, 18, 22, 0.84) 50%,
      rgba(15, 18, 22, 0.5) 100%
    ),
    url('${escapeEventHtml(entry.background ?? "")}');
"
      <div class="event-list-icon">
  <img
    src="${escapeEventHtml(entry.icon)}"
    alt="${escapeEventHtml(entry.title)}"
  >
</div>

      <div class="event-list-content">
        <div class="event-list-title">
          <h3>
            ${escapeEventHtml(
              entry.title
            )}
          </h3>

          <span class="event-status">
            ${getEventStatusText(status)}
          </span>
        </div>

        <p>
          ${escapeEventHtml(
            entry.description ?? ""
          )}
        </p>

        <small>
          ${formatEventDate(
            entry.start
          )}
        </small>
      </div>

      <strong
        class="event-list-countdown"
        data-event-countdown
        data-event-start="${escapeEventHtml(
          entry.start
        )}"
        data-event-end="${escapeEventHtml(
          entry.end ?? ""
        )}"
      >
        Wird berechnet …
      </strong>
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
      ".next-event-card, .event-list-item"
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
  const date =
    parseEventDate(value);

  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    currentLanguage === "en"
    ? "en-US"
    : "de-DE",
    {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
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