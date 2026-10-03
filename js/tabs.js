"use strict";

/*
 * Reiter-Navigation: Die Leiste oben schaltet zwischen Bereichen um,
 * statt an eine Stelle einer langen Seite zu scrollen.
 * Der Reiter steht in der Adresse (#events), Links lassen sich also teilen.
 */
const TAB_BY_HASH = {
  today: "today",
  top: "today",
  alliance: "today",
  season: "today",
  events: "events",
  saison: "saison",
  war: "war",
  invasion: "war",
  codes: "codes",
};

/* Hash-Ziele, zu denen innerhalb eines Reiters gescrollt wird */
const SCROLL_TARGETS = ["alliance", "season", "events", "invasion", "codes"];

function getTabLinks() {
  return [...document.querySelectorAll("[data-tab-link]")];
}

function isTabAvailable(name) {
  const link = getTabLinks().find((item) => item.dataset.tabLink === name);

  return Boolean(link) && !link.hidden;
}

function getTabFromHash() {
  const tab = TAB_BY_HASH[location.hash.slice(1)] ?? "today";

  return isTabAvailable(tab) ? tab : "today";
}

function showTab(name) {
  for (const panel of document.querySelectorAll("[data-tab-panel]")) {
    panel.hidden = panel.dataset.tabPanel !== name;
  }

  for (const link of getTabLinks()) {
    const isActive = link.dataset.tabLink === name;

    link.classList.toggle("active", isActive);

    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  }
}

function routeTabs() {
  showTab(getTabFromHash());

  const id = location.hash.slice(1);
  const target = SCROLL_TARGETS.includes(id)
    ? document.getElementById(id)
    : null;

  if (target && !target.hidden) {
    target.scrollIntoView();
  } else {
    window.scrollTo(0, 0);
  }
}

/*
 * Kriegswoche und Codes erscheinen nur, wenn ihr Bereich sichtbar ist.
 * Das Skript beobachtet deshalb deren hidden-Attribut.
 */
function syncTabAvailability() {
  const rules = [
    ["war", "#invasion"],
    ["codes", "#codes"],
  ];

  for (const [tab, selector] of rules) {
    const link = getTabLinks().find((item) => item.dataset.tabLink === tab);
    const section = document.querySelector(selector);

    if (link && section) {
      link.hidden = section.hidden;
    }
  }

  showTab(getTabFromHash());
}

function initTabs() {
  const observer = new MutationObserver(syncTabAvailability);

  for (const selector of ["#invasion", "#codes"]) {
    const section = document.querySelector(selector);

    if (section) {
      observer.observe(section, {
        attributes: true,
        attributeFilter: ["hidden"],
      });
    }
  }

  syncTabAvailability();
  window.addEventListener("hashchange", routeTabs);
}

initTabs();
