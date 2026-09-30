"use strict";

const WEDDING_CONFIG = {
  couple: {
    firstName: "Agustina",
    secondName: "Leonel",
    names: "Agustina & Leonel",
    initials: "A & L",
  },
  event: {
    dateISO: "2026-11-06T10:30:00-03:00",
    endDateISO: "2026-11-06T15:00:00-03:00",
    dateLong: "viernes 6 de noviembre de 2026",
    dateShort: "06 · 11 · 2026",
    time: "10:30",
    timezone: "America/Argentina/Buenos_Aires",
    city: "San Luis",
    country: "Argentina",
  },
  ceremony: {
    type: "Ceremonia civil",
    venue: "Sala de Matrimonios (Segundo subsuelo)",
    location: "Terrazas del Portezuelo",
    city: "San Luis",
    address: "Sala de Matrimonios (Segundo subsuelo), Terrazas del Portezuelo, San Luis",
    mapsUrl: "https://maps.app.goo.gl/EVLk1KJ878vP67cr8",
  },
  lunch: {
    venue: "Espacio Gales",
    location: "Potrero de los Funes · San Luis",
    mapsUrl: "https://maps.app.goo.gl/wNEC6HWqcoYS7iA76?g_st=iw",
    cost: 40000,
    currency: "ARS",
    costUnit: "por invitado",
    condition: "Opcional · Cada invitado abona su menú",
  },
  rsvp: {
    deadlineText: "31 de octubre",
    whatsappPhone: "+5492657234650",
  },
  dressCode: {
    title: "Smart casual",
    summary: "Elegante y cómodo. No hace falta traje ni vestido de gala.",
    outfits: [
      {
        title: "Vestido o conjunto",
        description: "Vestido corto o midi, mono, falda o pantalón de vestir. Calzado elegante y cómodo.",
      },
      {
        title: "Camisa y pantalón",
        description: "Camisa, chomba o remera lisa; pantalón de vestir, chino o jean oscuro. Saco y corbata, opcionales.",
      },
    ],
    avoid: "Ropa deportiva, ojotas, prendas demasiado informales o vestimenta de gala completa.",
  },
  music: {
    title: "Those Eyes",
    artist: "New West",
    spotifyUrl: "https://open.spotify.com/track/50x1Ic8CaXkYNvjmxe3WXy",
    spotifyUri: "spotify:track:50x1Ic8CaXkYNvjmxe3WXy",
    startAtSeconds: 48,
    sdkUrl: "https://open.spotify.com/embed/iframe-api/v1",
  },
  social: {
    siteUrl: "https://agusyleo.growi.ar/",
    ogImagePath: "assets/og-preview.jpg",
    title: "Agustina & Leonel · Nos casamos",
    description: "6 de noviembre de 2026 · San Luis",
    imageAlt: "Agustina y Leonel, 6 de noviembre de 2026",
  },
};

window.WEDDING_CONFIG = WEDDING_CONFIG;

const PLACEHOLDER_PATTERN = /REEMPLAZAR|X{2,}/i;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let toastTimer;
let pendingWhatsAppMessage = "";
let spotifyController;
let spotifyControllerReady = false;
let spotifyTrackPrepared = false;
let spotifyPlaybackRequested = false;
let spotifyPlaybackStarted = false;
let spotifyPlaybackTimeout;
let spotifyControlTimeout;
let spotifyRequestFromOpening = false;
let spotifySdkFailed = false;
let spotifySeekCorrectionAttempted = false;

document.addEventListener("DOMContentLoaded", () => {
  applyConfig();
  setupOpening();
  setupNavigation();
  setupRevealAnimations();
  setupScenes();
  setupDressCode();
  setupCountdown();
  setupMaps();
  setupCalendar();
  setupRsvp();
  setupMusic();
});

function byId(id) {
  return document.getElementById(id);
}

function setupNavigation() {
  const links = [...document.querySelectorAll(".site-nav a[href^='#']")];
  const sections = links
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);
  if (!links.length || !sections.length) return;

  const setCurrent = (id = "") => {
    links.forEach((link) => {
      const isCurrent = link.getAttribute("href") === `#${id}`;
      if (isCurrent) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  };

  links.forEach((link) => {
    link.addEventListener("click", () => setCurrent(link.getAttribute("href").slice(1)));
  });

  if (!("IntersectionObserver" in window)) return;
  const visibleSections = new Map();
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) visibleSections.set(entry.target.id, entry.intersectionRatio);
        else visibleSections.delete(entry.target.id);
      });

      const current = [...visibleSections.entries()].sort((a, b) => b[1] - a[1])[0];
      setCurrent(current?.[0]);
    },
    { rootMargin: "-18% 0px -68% 0px", threshold: [0, 0.01] },
  );

  sections.forEach((section) => observer.observe(section));
}

function setText(id, value) {
  const element = byId(id);
  if (element) element.textContent = value;
}

function isPlaceholder(value) {
  return !value || PLACEHOLDER_PATTERN.test(String(value));
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatMoney(value, currency) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function applyConfig() {
  const { couple, event, ceremony, lunch, rsvp, dressCode, music, social } = WEDDING_CONFIG;
  const ogImageUrl = resolvePublicAssetUrl(social.siteUrl, social.ogImagePath);

  const lunchCost = formatMoney(lunch.cost, lunch.currency);

  setText("openingMonogram", couple.initials);
  setText("openingDate", `${capitalize(event.dateLong.replace(/ de \d{4}$/, ""))} · ${event.city}`);
  setText("heroNameOne", couple.firstName);
  setText("heroNameTwo", couple.secondName);
  setText("heroDate", capitalize(event.dateLong.replace(/ de \d{4}$/, "")));
  setText("heroTime", `${event.time} hs`);
  setText("heroCity", event.city);
  setText("ceremonyTitle", ceremony.type);
  setText("ceremonyDate", capitalize(event.dateLong));
  setText("ceremonyTime", `${event.time} hs`);
  setText("ceremonyVenue", ceremony.venue);
  setText("ceremonyLocation", `${ceremony.location} · ${ceremony.city}`);
  setTitleWithEmphasis("lunchTitle", "Almuerzo en", lunch.venue);
  setText("lunchLocation", lunch.location);
  setText("lunchCondition", lunch.condition);
  setText("lunchCost", lunchCost);
  setText("lunchCostUnit", lunch.costUnit);
  setText("lunchHint", `Opcional · ${lunchCost} ${lunch.costUnit}`);
  setText("rsvpDeadline", rsvp.deadlineText);
  const [dressFirst, ...dressRest] = dressCode.title.split(" ");
  setTitleWithEmphasis("dressTitle", dressFirst, dressRest.join(" "));
  setText("closingSignature", couple.names);
  setText("closingDate", event.dateShort);
  setText("songTitle", music.title);
  setText("songArtist", music.artist);
  setText("playerSongTitle", `${music.title} · ${music.artist}`);

  const dressLead = document.querySelector(".dress__lead");
  if (dressLead) dressLead.textContent = dressCode.summary;

  // outfits: [0] ellas, [1] ellos. Ambas guías viven apiladas en la misma celda (sin saltos de
  // altura al cambiar de pestaña); "Mejor evitar" es común a las dos.
  ["women", "men"].forEach((set, index) => {
    const outfit = dressCode.outfits[index];
    if (!outfit) return;
    document.querySelectorAll(`#dressOutfit .dress__swap[data-set="${set}"]`).forEach((node) => {
      node.textContent = node.closest(".dress__outfit-title") ? outfit.title : outfit.description;
    });
  });

  const avoidText = document.querySelector(".avoid-note dd");
  if (avoidText) avoidText.textContent = dressCode.avoid;

  [byId("spotifySectionLink")].forEach((link) => {
    if (!link || isPlaceholder(music.spotifyUrl)) return;
    link.href = music.spotifyUrl;
    link.setAttribute("aria-label", `Abrir en Spotify: ${music.title} de ${music.artist}`);
  });

  byId("spotifyEmbed")?.setAttribute("aria-label", `Reproductor de ${music.title} de ${music.artist} en Spotify`);

  document.title = social.title;
  updateMeta("meta[name='description']", social.description);
  updateMeta("meta[property='og:title']", social.title);
  updateMeta("meta[property='og:description']", social.description);
  updateMeta("meta[property='og:url']", social.siteUrl);
  updateMeta("meta[property='og:image']", ogImageUrl);
  updateMeta("meta[property='og:image:secure_url']", ogImageUrl);
  updateMeta("meta[property='og:image:alt']", social.imageAlt);
  updateMeta("meta[name='twitter:title']", social.title);
  updateMeta("meta[name='twitter:description']", social.description);
  updateMeta("meta[name='twitter:image']", ogImageUrl);
  updateMeta("meta[name='twitter:image:alt']", social.imageAlt);

  const canonical = document.querySelector("link[rel='canonical']");
  if (canonical) canonical.href = social.siteUrl;
}

function setTitleWithEmphasis(id, lead, emphasis) {
  const element = byId(id);
  if (!element) return;
  const em = document.createElement("em");
  em.textContent = emphasis;
  element.replaceChildren(`${lead} `, em);
}

function showDressGuide(set) {
  document.querySelectorAll("#dressOutfit .dress__swap").forEach((node) => {
    node.classList.toggle("is-active", node.dataset.set === set);
  });
}

function resolvePublicAssetUrl(siteUrl, assetPath) {
  try {
    return new URL(assetPath, siteUrl).href;
  } catch {
    return "";
  }
}

function updateMeta(selector, content) {
  const element = document.querySelector(selector);
  if (element) element.setAttribute("content", content);
}

function setupOpening() {
  const cover = byId("openingCover");
  const openButton = byId("openInvitation");
  const main = byId("main-content");
  const header = byId("siteHeader");
  const lockedElements = [
    main,
    header,
    document.querySelector(".site-footer"),
    byId("musicPlayer"),
    document.querySelector(".skip-link"),
  ].filter(Boolean);
  if (!cover || !openButton || !main) return;

  document.body.classList.add("is-locked");
  lockedElements.forEach((element) => element.setAttribute("inert", ""));

  // Obturador de entrada: dos frames para que el estado inicial (cerrado) llegue a pintarse.
  requestAnimationFrame(() => requestAnimationFrame(() => cover.classList.add("is-in")));
  prepareInvitationBehindCover(cover);

  openButton.addEventListener("click", () => {
    // El gesto queda reservado para Spotify: play() sobre la pista ya preparada.
    tryPlayMusic(true);
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    openButton.disabled = true;
    // La invitación se ve durante la salida, pero sigue inerte hasta que la portada desaparece:
    // el teclado no puede llegar a controles que todavía están tapados.
    document.body.classList.add("invitation-open");
    cover.classList.add("is-opening");
    updateScenes();

    // Salida: las barras se retiran (700 ms), la portada funde a los 450 ms y el hero entra en foco.
    const reduced = reducedMotion.matches;
    window.setTimeout(() => {
      cover.classList.add("is-gone");
      byId("inicio")?.classList.add("is-in");
    }, reduced ? 0 : 450);
    window.setTimeout(() => {
      cover.hidden = true;
      cover.setAttribute("aria-hidden", "true");
      lockedElements.forEach((element) => element.removeAttribute("inert"));
      document.body.classList.remove("is-locked");
      const heading = byId("heroTitle");
      heading?.setAttribute("tabindex", "-1");
      heading?.focus({ preventScroll: true });
    }, reduced ? 200 : 1050);
  });
}

/* La invitación no se renderiza mientras carga la portada (LCP). Una vez cargada la
   página, en tiempo ocioso y sólo si la portada sigue cerrada, se maqueta oculta: el hero
   (lazy) carga y se decodifica detrás de la portada y el clic ya no paga el layout. */
function prepareInvitationBehindCover(cover) {
  const idle = window.requestIdleCallback || ((callback) => window.setTimeout(callback, 600));
  const prepare = () => {
    if (cover.hidden || document.body.classList.contains("invitation-open")) return;
    document.body.classList.add("is-prepared");
    const hero = document.querySelector(".hero__photo img");
    if (hero?.decode) hero.decode().catch(() => {});
  };
  const schedule = () => idle(prepare, { timeout: 2500 });
  if (document.readyState === "complete") schedule();
  else window.addEventListener("load", schedule, { once: true });
}

/* Escenas vinculadas al scroll (dolly del hero, iris de la ceremonia).
   Escribe --p (progreso lineal) y --e (smoothstep sobre el primer 75 %) en cada [data-scene].
   Un único listener pasivo + rAF; sólo se actualizan las escenas cercanas al viewport.
   Con reduced motion no corre: el CSS fija --p y --e en 1 y quita el sticky. */
const scenes = [];
let sceneFrame = 0;

function setupScenes() {
  scenes.push(...document.querySelectorAll("[data-scene]"));
  if (!scenes.length || reducedMotion.matches) return;
  const request = () => {
    if (!sceneFrame) sceneFrame = requestAnimationFrame(updateScenes);
  };
  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", request);
}

function updateScenes() {
  sceneFrame = 0;
  if (reducedMotion.matches) return;
  const viewport = window.innerHeight;
  // Primero todas las lecturas de layout, después todas las escrituras: sin flushes intercalados.
  const updates = scenes
    .map((scene) => [scene, scene.getBoundingClientRect()])
    .filter(([, rect]) => rect.bottom >= -viewport && rect.top <= viewport * 2)
    .map(([scene, rect]) => {
      const travel = rect.height - viewport;
      const progress = travel > 0 ? Math.min(1, Math.max(0, -rect.top / travel)) : 1;
      const t = Math.min(1, progress / 0.75);
      return [scene, progress, t * t * (3 - 2 * t)];
    });
  updates.forEach(([scene, progress, eased]) => {
    scene.style.setProperty("--p", progress.toFixed(4));
    scene.style.setProperty("--e", eased.toFixed(4));
  });
}

/* Dress code: tira de fotogramas con recortes reales de los collages.
   Cada recorte es [x, y, w, h] en px de la fuente y se muestra con escala uniforme
   dentro de un marco 3:5 (nunca se deforma). Los rótulos usan sólo prendas del texto
   confirmado de cada guía. */
const DRESS_REFERENCES = {
  women: {
    tab: "Ellas",
    outfit: 0,
    src: "assets/dresscode/women-lg.webp",
    width: 720,
    height: 1280,
    crops: [
      ["Vestido midi", 105, 100, 240, 400],
      ["Pantalón de vestir", 241, 0, 258, 430],
      ["Vestido corto", 474, 390, 246, 410],
      ["Falda", 90, 470, 270, 450],
      ["Mono", 205, 880, 240, 400],
      ["Pantalón de vestir", 225, 330, 300, 500],
    ],
  },
  men: {
    tab: "Ellos",
    outfit: 1,
    src: "assets/dresscode/men-lg.webp",
    width: 900,
    height: 1600,
    crops: [
      ["Camisa", 339, 0, 252, 420],
      ["Chomba", 20, 590, 312, 520],
      ["Pantalón de vestir", 260, 380, 420, 700],
      ["Remera lisa", 470, 880, 330, 550],
      ["Camisa", 160, 20, 240, 400],
      ["Chino", 0, 1060, 324, 540],
    ],
  },
};

function setupDressCode() {
  const strip = byId("dressStrip");
  const tabs = [...document.querySelectorAll(".tabs__tab")];
  const navButtons = [...document.querySelectorAll(".strip-nav button")];
  if (!strip || !tabs.length) return;

  const syncNav = () => {
    const max = strip.scrollWidth - strip.clientWidth - 2;
    navButtons.forEach((button) => {
      button.disabled = Number(button.dataset.dir) < 0 ? strip.scrollLeft <= 2 : strip.scrollLeft >= max;
    });
  };

  const render = (key) => {
    const set = DRESS_REFERENCES[key];
    strip.replaceChildren(
      ...set.crops.map(([label, x, y, w, h], index) => {
        const figure = document.createElement("figure");
        const crop = document.createElement("div");
        const image = document.createElement("img");
        const caption = document.createElement("figcaption");
        const name = document.createElement("b");
        const number = document.createElement("span");
        figure.className = "frame";
        crop.className = "frame__crop";
        crop.style.transitionDelay = reducedMotion.matches ? "0ms" : `${index * 70}ms`;
        image.src = set.src;
        image.alt = `${set.tab}: referencia de ${label.toLowerCase()}`;
        image.loading = "lazy";
        image.decoding = "async";
        image.width = set.width;
        image.height = set.height;
        Object.assign(image.style, {
          width: `${(set.width / w) * 100}%`,
          left: `${(-x / w) * 100}%`,
          top: `${(-y / h) * 100}%`,
        });
        name.textContent = label;
        number.textContent = String(index + 1).padStart(2, "0");
        crop.append(image);
        caption.append(name, number);
        figure.append(crop, caption);
        return figure;
      }),
    );
    showDressGuide(key);
    strip.scrollLeft = 0;
    syncNav();
  };

  let switchTimer;
  const select = (tab, { immediate = false } = {}) => {
    if (tab.getAttribute("aria-selected") === "true") return;
    tabs.forEach((item) => {
      const selected = item === tab;
      item.setAttribute("aria-selected", String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    strip.setAttribute("aria-labelledby", tab.id);
    window.clearTimeout(switchTimer);
    // Teclado (acción repetible) o reduced motion: el cambio es inmediato, sin animación.
    if (immediate || reducedMotion.matches) {
      strip.classList.remove("is-switching");
      strip.classList.add("is-instant");
      render(tab.dataset.set);
      return;
    }
    strip.classList.remove("is-instant");
    // Puntero: cierre corto (180 ms), cambio de referencias y re-apertura escalonada.
    strip.classList.add("is-switching");
    switchTimer = window.setTimeout(() => {
      const wasVisible = strip.classList.contains("is-visible");
      strip.classList.remove("is-visible", "is-switching");
      render(tab.dataset.set);
      if (wasVisible) requestAnimationFrame(() => requestAnimationFrame(() => strip.classList.add("is-visible")));
    }, 180);
  };

  tabs.forEach((tab) => tab.addEventListener("click", () => select(tab)));
  tabs[0].parentElement.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const current = tabs.findIndex((tab) => tab.getAttribute("aria-selected") === "true");
    const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (current + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    select(tabs[next], { immediate: true });
    tabs[next].focus();
  });

  navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      strip.scrollBy({ left: Number(button.dataset.dir) * strip.clientWidth * 0.8, behavior: reducedMotion.matches ? "auto" : "smooth" });
    });
  });
  strip.addEventListener("scroll", syncNav, { passive: true });
  // La tira se arma con la invitación todavía oculta (ancho 0): se re-mide cuando obtiene tamaño real.
  if ("ResizeObserver" in window) new ResizeObserver(syncNav).observe(strip);
  else window.addEventListener("resize", syncNav);

  render(tabs.find((tab) => tab.getAttribute("aria-selected") === "true")?.dataset.set || "women");
}

function setupRevealAnimations() {
  const items = document.querySelectorAll("[data-reveal]");
  if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
  );

  items.forEach((item) => observer.observe(item));

  // Navegación por teclado: nunca dejar el foco dentro de un bloque todavía invisible.
  document.addEventListener("focusin", (event) => {
    for (let node = event.target.closest?.("[data-reveal]"); node; node = node.parentElement?.closest("[data-reveal]")) {
      node.classList.add("is-visible");
      observer.unobserve(node);
    }
  });
}

// Días de calendario (no horas) en la zona del evento: "mañana" significa mañana en San Luis.
function daysUntilEvent(now = new Date()) {
  const { dateISO, timezone } = WEDDING_CONFIG.event;
  const dayInZone = (date) => new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(date);
  const toUtcDay = (isoDay) => Date.UTC(...isoDay.split("-").map((part, index) => Number(part) - (index === 1 ? 1 : 0)));
  return Math.round((toUtcDay(dateISO.slice(0, 10)) - toUtcDay(dayInZone(now))) / 86400000);
}

function countdownText(days) {
  if (days > 1) return `Faltan ${days} días`;
  if (days === 1) return "Es mañana";
  if (days === 0) return "Es hoy";
  return "Gracias por acompañarnos";
}

function setupCountdown() {
  const update = () => setText("countdownStatus", countdownText(daysUntilEvent()));
  update();
  window.setInterval(update, 60000);
}

function setupMaps() {
  const { ceremony, lunch } = WEDDING_CONFIG;
  configureExternalLink(byId("ceremonyMap"), ceremony.mapsUrl, "la ubicación de la ceremonia");
  configureExternalLink(byId("lunchMap"), lunch.mapsUrl, "la ubicación del almuerzo");
  if (!isPlaceholder(ceremony.mapsUrl)) byId("ceremonyMap")?.setAttribute("aria-label", "Cómo llegar a la ceremonia (abre Google Maps)");
  if (!isPlaceholder(lunch.mapsUrl)) byId("lunchMap")?.setAttribute("aria-label", `Cómo llegar a ${lunch.venue} (abre Google Maps)`);
}

function configureExternalLink(element, url, label) {
  if (!element) return;
  if (isPlaceholder(url)) {
    element.href = "#";
    element.setAttribute("aria-label", `${capitalize(label)} todavía no disponible`);
    element.addEventListener("click", (event) => {
      event.preventDefault();
      showToast(`${capitalize(label)} todavía no está disponible.`);
    });
    return;
  }
  element.href = url;
}

async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    const helper = document.createElement("textarea");
    helper.value = value;
    helper.setAttribute("readonly", "");
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.append(helper);
    helper.select();
    const copied = document.execCommand("copy");
    helper.remove();
    return copied;
  }
}

function setupCalendar() {
  const googleCalendar = byId("googleCalendar");
  if (googleCalendar) googleCalendar.href = buildGoogleCalendarUrl();
}

function toGoogleDate(dateISO) {
  return new Date(dateISO).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

// El evento de calendario es la ceremonia; el almuerzo opcional sólo se menciona en la descripción.
function calendarDescription() {
  const { lunch } = WEDDING_CONFIG;
  const lines = [`Ceremonia civil. Después, almuerzo opcional en ${lunch.venue}, ${lunch.location} (${formatMoney(lunch.cost, lunch.currency)} ${lunch.costUnit}; cada invitado abona su menú).`];
  if (!isPlaceholder(lunch.mapsUrl)) lines.push(`Cómo llegar al almuerzo: ${lunch.mapsUrl}`);
  return lines.join("\n");
}

function buildGoogleCalendarUrl() {
  const { couple, event, ceremony } = WEDDING_CONFIG;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Casamiento de ${couple.firstName} y ${couple.secondName}`,
    dates: `${toGoogleDate(event.dateISO)}/${toGoogleDate(event.endDateISO)}`,
    details: calendarDescription(),
    location: ceremony.address,
    ctz: event.timezone,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function setupRsvp() {
  const form = byId("rsvpForm");
  const dialog = byId("rsvpDialog");
  if (!form || !dialog) return;

  setupRsvpProgressiveFields(form);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearFormErrors(form);
    const result = validateRsvp(form);
    if (!result.valid) {
      setText("formStatus", "Faltan algunas respuestas.");
      result.firstInvalid?.focus();
      return;
    }

    setText("formStatus", "");
    const data = result.data;
    pendingWhatsAppMessage = buildWhatsAppMessage(data);
    renderRsvpSummary(data);

    const phoneReady = isValidPhone(WEDDING_CONFIG.rsvp.whatsappPhone);
    setText(
      "rsvpDialogHint",
      phoneReady
        ? "En WhatsApp solo te queda enviar el mensaje."
        : "No podemos abrir WhatsApp desde acá. Copiá el mensaje y envialo vos.",
    );
    const confirmLabel = byId("confirmRsvp")?.querySelector("span");
    if (confirmLabel) confirmLabel.textContent = phoneReady ? "Ir a WhatsApp" : "Copiar mensaje";

    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else if (window.confirm("¿Abrimos WhatsApp con tu respuesta?")) {
      sendOrCopyRsvp();
    }
  });

  byId("confirmRsvp")?.addEventListener("click", sendOrCopyRsvp);
}

function setupRsvpProgressiveFields(form) {
  const exactChoice = form.querySelector("input[name='guestCount'][value='5+']");
  const exactField = byId("guestCountExactField");
  const exactInput = byId("guestCountExact");
  const decrease = byId("guestCountDecrease");
  const increase = byId("guestCountIncrease");
  const foodYes = form.querySelector("input[name='foodPreference'][value='Sí']");
  const foodDetailsField = byId("foodDetailsField");
  const foodDetails = byId("foodDetails");

  const setExactVisibility = (visible) => {
    if (!exactField || !exactInput) return;
    exactField.hidden = !visible;
    exactInput.disabled = !visible;
    if (!visible) {
      exactInput.removeAttribute("aria-invalid");
      setText("guestCountExactError", "");
    }
  };

  const setFoodDetailsVisibility = (visible) => {
    if (!foodDetailsField || !foodDetails) return;
    foodDetailsField.hidden = !visible;
    foodDetails.disabled = !visible;
    if (!visible) {
      foodDetails.removeAttribute("aria-invalid");
      setText("foodDetailsError", "");
    }
  };

  form.querySelectorAll("input[name='guestCount']").forEach((radio) => {
    radio.addEventListener("change", () => setExactVisibility(radio.value === "5+"));
  });

  form.querySelectorAll("input[name='foodPreference']").forEach((radio) => {
    radio.addEventListener("change", () => setFoodDetailsVisibility(radio.value === "Sí"));
  });

  const syncStepper = () => {
    if (!exactInput || !decrease) return;
    const value = Number(exactInput.value);
    decrease.disabled = Number.isFinite(value) && value <= 5;
  };

  decrease?.addEventListener("click", () => {
    const current = Number(exactInput?.value);
    if (exactInput) exactInput.value = String(Math.max(5, Number.isInteger(current) ? current - 1 : 5));
    syncStepper();
  });

  increase?.addEventListener("click", () => {
    const current = Number(exactInput?.value);
    if (exactInput) exactInput.value = String(Number.isInteger(current) && current >= 5 ? current + 1 : 5);
    syncStepper();
  });

  exactInput?.addEventListener("input", syncStepper);
  setExactVisibility(exactChoice?.checked === true);
  setFoodDetailsVisibility(foodYes?.checked === true);
  syncStepper();
}

function clearFormErrors(form) {
  form.querySelectorAll("[aria-invalid='true']").forEach((field) => field.removeAttribute("aria-invalid"));
  form.querySelectorAll(".field__error").forEach((error) => {
    error.textContent = "";
  });
}

function setError(field, errorId, message) {
  field?.setAttribute("aria-invalid", "true");
  setText(errorId, message);
}

function validateRsvp(form) {
  const data = new FormData(form);
  const name = String(data.get("guestName") || "").trim();
  const ceremony = String(data.get("ceremonyAttendance") || "");
  const lunch = String(data.get("lunchAttendance") || "");
  const countChoice = String(data.get("guestCount") || "");
  const count = countChoice === "5+" ? Number(data.get("guestCountExact")) : Number(countChoice);
  const foodPreference = String(data.get("foodPreference") || "");
  const foodDetails = String(data.get("foodDetails") || "").trim();
  let firstInvalid = null;

  const remember = (field) => {
    if (!firstInvalid) firstInvalid = field;
  };

  const nameField = byId("guestName");
  if (name.length < 3) {
    setError(nameField, "guestNameError", "Escribí al menos un nombre.");
    remember(nameField);
  }

  const ceremonyField = form.querySelector("input[name='ceremonyAttendance']");
  if (!ceremony) {
    setError(ceremonyField, "ceremonyAttendanceError", "Falta responder si vienen a la ceremonia civil.");
    remember(ceremonyField);
  }

  const lunchField = form.querySelector("input[name='lunchAttendance']");
  if (!lunch) {
    setError(lunchField, "lunchAttendanceError", "Falta responder si se suman al almuerzo.");
    remember(lunchField);
  }

  const countField = form.querySelector("input[name='guestCount']");
  if (!countChoice) {
    setError(countField, "guestCountError", "Falta elegir cuántos son en total.");
    remember(countField);
  }

  const exactField = byId("guestCountExact");
  if (countChoice === "5+" && (!Number.isInteger(count) || count < 5)) {
    setError(exactField, "guestCountExactError", "Ingresá una cantidad de 5 o más.");
    remember(exactField);
  }

  const foodField = form.querySelector("input[name='foodPreference']");
  if (!foodPreference) {
    setError(foodField, "foodPreferenceError", "Falta responder si hay alguna restricción alimentaria.");
    remember(foodField);
  }

  const detailsField = byId("foodDetails");
  if (foodPreference === "Sí" && foodDetails.length < 3) {
    setError(detailsField, "foodDetailsError", "Contanos qué restricción tenemos que tener en cuenta.");
    remember(detailsField);
  }

  return {
    valid: !firstInvalid,
    firstInvalid,
    data: {
      name,
      ceremony,
      lunch,
      count,
      hasFoodRestriction: foodPreference === "Sí",
      foodDetails,
    },
  };
}

function formatAttendanceChoice(value, singularYes, pluralYes, singularNo, pluralNo, isPlural) {
  if (value === "Sí") return isPlural ? pluralYes : singularYes;
  return isPlural ? pluralNo : singularNo;
}

function getRsvpWording(data) {
  const isPlural = data.count !== 1;
  return {
    ceremony: formatAttendanceChoice(data.ceremony, "Sí, voy", "Sí, vamos", "No voy", "No vamos", isPlural),
    lunch: formatAttendanceChoice(data.lunch, "Sí, me sumo", "Sí, nos sumamos", "No, no me sumo", "No, no nos sumamos", isPlural),
  };
}

function buildWhatsAppMessage(data) {
  const wording = getRsvpWording(data);
  const lines = [
    "¡Hola, Agus y Leo!",
    "",
    `Confirmación de ${data.name}`,
    `• Ceremonia civil: ${wording.ceremony}`,
    `• Almuerzo: ${wording.lunch}`,
    `• Personas: ${data.count}`,
  ];
  if (data.hasFoodRestriction) lines.push(`• Restricción alimentaria: ${capitalize(data.foodDetails)}`);
  lines.push("", "¡Gracias!");
  return lines.join("\n");
}

function renderRsvpSummary(data) {
  const summary = byId("rsvpSummary");
  if (!summary) return;
  const wording = getRsvpWording(data);
  const rows = [
    ["Nombres", data.name],
    ["Ceremonia", wording.ceremony],
    ["Almuerzo", wording.lunch],
    ["Personas", data.count],
  ];
  if (data.hasFoodRestriction) rows.push(["Restricción alimentaria", capitalize(data.foodDetails)]);

  summary.replaceChildren(
    ...rows.map(([label, value]) => {
      const row = document.createElement("div");
      row.className = "summary-row";
      const key = document.createElement("span");
      const content = document.createElement("strong");
      key.textContent = label;
      content.textContent = String(value);
      row.append(key, content);
      return row;
    }),
  );
}

function isValidPhone(phone) {
  const digits = String(phone).replace(/\D/g, "");
  return !isPlaceholder(phone) && digits.length >= 8 && digits.length <= 15;
}

async function sendOrCopyRsvp() {
  const dialog = byId("rsvpDialog");
  const phone = WEDDING_CONFIG.rsvp.whatsappPhone;
  if (isValidPhone(phone)) {
    const digits = phone.replace(/\D/g, "");
    const url = `https://wa.me/${digits}?text=${encodeURIComponent(pendingWhatsAppMessage)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    dialog?.close();
    showToast("Listo. Enviá el mensaje desde WhatsApp para confirmar.");
    return;
  }

  const copied = await copyText(pendingWhatsAppMessage);
  dialog?.close();
  showToast(
    copied
      ? "Mensaje copiado. Podés pegarlo en WhatsApp."
      : "No pudimos copiar el mensaje. Volvé a intentarlo.",
  );
}

function setupMusic() {
  const { music } = WEDDING_CONFIG;
  const player = byId("musicPlayer");
  const toggle = byId("musicToggle");
  const spotifySection = byId("spotifySectionLink");
  const minimize = byId("musicMinimize");
  if (!player || !toggle || !minimize) return;

  if (isPlaceholder(music.spotifyUrl)) {
    if (spotifySection) spotifySection.hidden = true;
    updateMusicUi(false, "Canción pendiente");
  } else {
    if (spotifySection) spotifySection.href = music.spotifyUrl;
  }

  const storedCompact = readSession("weddingPlayerCompact");
  const compactByDefault = window.matchMedia("(max-width: 599px), (max-height: 499px)").matches;
  setMusicPlayerCompact(player, minimize, storedCompact === null ? compactByDefault : storedCompact === "true");

  minimize.addEventListener("click", () => {
    const nextCompact = !player.classList.contains("is-compact");
    setMusicPlayerCompact(player, minimize, nextCompact);
    writeSession("weddingPlayerCompact", String(nextCompact));
  });

  toggle.addEventListener("click", () => {
    if (player.classList.contains("is-compact")) {
      setMusicPlayerCompact(player, minimize, false);
      writeSession("weddingPlayerCompact", "false");
    }

    if (player.classList.contains("is-loading")) return;

    if (player.classList.contains("is-playing") && spotifyController) {
      spotifyController.pause();
      player.classList.add("is-loading");
      setText("musicStatus", "Pausando…");
      window.clearTimeout(spotifyControlTimeout);
      spotifyControlTimeout = window.setTimeout(() => {
        if (!player.classList.contains("is-playing")) return;
        player.classList.remove("is-loading");
        setText("musicStatus", "Reproduciendo");
        showToast("Spotify no respondió. Podés controlarlo desde “Nuestra canción”.");
      }, 2000);
      return;
    }
    writeSession("weddingMusicPaused", "false");
    tryPlayMusic(false);
  });

  setupSpotifyController();
}

function setMusicPlayerCompact(player, button, compact) {
  player.classList.toggle("is-compact", compact);
  button.setAttribute("aria-expanded", String(!compact));
  button.setAttribute("aria-label", compact ? "Mostrar controles del reproductor" : "Minimizar reproductor");
}

function setupSpotifyController() {
  const { music } = WEDDING_CONFIG;
  const target = byId("spotifyEmbed");
  if (!target || isPlaceholder(music.spotifyUrl) || isPlaceholder(music.sdkUrl)) return;

  window.onSpotifyIframeApiReady = (IFrameAPI) => {
    const options = {
      width: "100%",
      height: 152,
      uri: music.spotifyUri,
    };

    IFrameAPI.createController(target, options, (controller) => {
      spotifyController = controller;
      spotifyControllerReady = true;

      const iframe = document.querySelector(".song__player iframe");
      iframe?.setAttribute("title", `Spotify: ${music.title} de ${music.artist}`);
      iframe?.classList.add("spotify-embed__frame");
      // El SDK crea el iframe con loading="lazy": como "Nuestra canción" está al final, el embed
      // no cargaba hasta que el invitado llegaba ahí y el play() de la apertura se perdía.
      // Se fuerza la carga después del evento load, para no competir con la foto de portada.
      const loadEmbedNow = () => iframe?.setAttribute("loading", "eager");
      if (document.readyState === "complete") loadEmbedNow();
      else window.addEventListener("load", loadEmbedNow, { once: true });

      controller.addListener("ready", () => {
        spotifyControllerReady = true;
        prepareSpotifyTrack();
        if (spotifyPlaybackRequested) {
          startSpotifyPlayback(spotifyRequestFromOpening);
          return;
        }
        // "Listo" sólo cuando Spotify lo confirma, y sin pisar un estado posterior.
        const player = byId("musicPlayer");
        if (!spotifyPlaybackStarted && !player?.classList.contains("is-loading") && !player?.classList.contains("is-playing")) {
          updateMusicUi(false, "Listo para escuchar");
        }
      });

      // playback_started llega ~2 s antes de que haya sonido: Spotify aceptó el pedido, nada más.
      controller.addListener("playback_started", () => {
        spotifyPlaybackRequested = false;
        window.clearTimeout(spotifyPlaybackTimeout);
        window.clearTimeout(spotifyControlTimeout);
        if (!spotifyPlaybackStarted) updateMusicUi(false, "Iniciando…");
      });

      controller.addListener("playback_update", (event) => {
        const state = event?.data;
        if (!state) return;
        if (state.isBuffering) {
          updateMusicUi(false, "Cargando canción…", true);
          return;
        }
        if (!state.isPaused) {
          // Sólo se confirma la reproducción cuando la duración es conocida y la posición avanza.
          if (!(state.duration > 0) || !(state.position > 0)) {
            if (!spotifyPlaybackStarted) updateMusicUi(false, "Iniciando…");
            return;
          }
          const expectedPosition = music.startAtSeconds * 1000;
          const isPreview = state.duration > 0 && state.duration <= expectedPosition;
          const startConfirmed = !isPreview && state.position >= expectedPosition - 3000;

          if (!isPreview && !startConfirmed && !spotifySeekCorrectionAttempted) {
            spotifySeekCorrectionAttempted = true;
            controller.seek(music.startAtSeconds);
            updateMusicUi(false, "Ajustando el inicio…", true);
            return;
          }

          spotifyPlaybackStarted = true;
          spotifyPlaybackRequested = false;
          window.clearTimeout(spotifyPlaybackTimeout);
          window.clearTimeout(spotifyControlTimeout);
          updateMusicUi(
            true,
            isPreview
              ? "Vista previa de Spotify"
              : "Reproduciendo",
          );
          return;
        }
        // Pausas antes de confirmar el sonido son parte del arranque, no una decisión del invitado.
        if (!spotifyPlaybackStarted) return;
        window.clearTimeout(spotifyControlTimeout);
        if (state.duration > 0 && state.position >= state.duration - 500) {
          // Terminó la pista (o la vista previa de ~30 s sin sesión): no es una pausa elegida.
          spotifyPlaybackStarted = false;
          updateMusicUi(false, state.duration <= music.startAtSeconds * 1000 ? "Terminó la vista previa" : "Terminó la canción");
          return;
        }
        writeSession("weddingMusicPaused", "true");
        updateMusicUi(false, "Pausado");
      });

      prepareSpotifyTrack();
      if (spotifyPlaybackRequested) startSpotifyPlayback(spotifyRequestFromOpening);
    });
  };

  const script = document.createElement("script");
  script.src = music.sdkUrl;
  script.async = true;
  script.dataset.spotifyIframeApi = "true";
  script.addEventListener("error", () => {
    spotifySdkFailed = true;
    byId("musicPlayer")?.classList.add("is-unavailable");
    updateMusicUi(false, "Spotify no cargó");
    const fallback = target.querySelector("p");
    if (fallback) fallback.textContent = "Spotify no pudo cargarse. Podés abrir la canción con el enlace.";
  });
  document.body.append(script);
}

function prepareSpotifyTrack() {
  const { music } = WEDDING_CONFIG;
  if (!spotifyController || spotifyTrackPrepared) return;

  try {
    spotifyController.loadEntity(music.spotifyUrl, false, music.startAtSeconds);
    spotifyTrackPrepared = true;
    // Todavía no hay confirmación del proveedor: el botón sigue disponible, pero no se afirma "Listo".
    if (!spotifyPlaybackStarted) updateMusicUi(false, "Cargando canción…");
  } catch {
    spotifyTrackPrepared = false;
    updateMusicUi(false, "Listo para escuchar");
  }
}

function tryPlayMusic(fromOpening) {
  const { music } = WEDDING_CONFIG;
  if (isPlaceholder(music.spotifyUrl)) {
    updateMusicUi(false, "Canción pendiente");
    return;
  }

  // Si el SDK no cargó, ese es el estado real, aunque la sesión recuerde una pausa previa.
  if (fromOpening && readSession("weddingMusicPaused") === "true" && !spotifySdkFailed) {
    updateMusicUi(false, "Pausado");
    return;
  }

  spotifyPlaybackRequested = true;
  spotifyRequestFromOpening = fromOpening;

  if (!spotifyController || !spotifyControllerReady) {
    updateMusicUi(false, spotifySdkFailed ? "Spotify no cargó" : "Cargando Spotify…");
    if (!fromOpening && spotifySdkFailed) showToast("Spotify no pudo cargarse. Usá el enlace para abrir la canción.");
    return;
  }

  startSpotifyPlayback(fromOpening);
}

function startSpotifyPlayback(fromOpening) {
  const { music } = WEDDING_CONFIG;
  if (!spotifyController) return;

  try {
    spotifyPlaybackRequested = false;
    prepareSpotifyTrack();
    spotifyController.play();
    updateMusicUi(false, "Iniciando…", true);

    window.clearTimeout(spotifyPlaybackTimeout);
    spotifyPlaybackTimeout = window.setTimeout(() => {
      if (byId("musicPlayer")?.classList.contains("is-playing")) return;
      updateMusicUi(false, "Tocá play para escuchar");
      if (!fromOpening) showToast("Spotify no arrancó. Tocá play de nuevo o usá el reproductor de “Nuestra canción”.");
    }, 2600);
  } catch {
    updateMusicUi(false, "Tocá play para escuchar");
    if (!fromOpening) showToast("El navegador bloqueó la reproducción. Probá nuevamente o abrí la canción en Spotify.");
  }
}

function updateMusicUi(isPlaying, status, isLoading = false) {
  const { music } = WEDDING_CONFIG;
  const player = byId("musicPlayer");
  const toggle = byId("musicToggle");
  player?.classList.toggle("is-playing", isPlaying);
  player?.classList.toggle("is-loading", isLoading);
  toggle?.setAttribute(
    "aria-label",
    isPlaying
      ? `Pausar ${music.title}`
      : `Reproducir ${music.title}`,
  );
  setText("musicStatus", status);
}

function readSession(key) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSession(key, value) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // La sesión privada puede impedir guardar preferencias; la reproducción sigue funcionando.
  }
}

function showToast(message) {
  const toast = byId("toast");
  if (!toast) return;
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 3600);
}
