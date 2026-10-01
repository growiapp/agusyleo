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
    deadlineText: "15 de octubre",
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
    // Grabación autorizada (Home Session), recortada para empezar en el 00:48 del original
    // (sin seek al iniciar). A los invitados sólo se les muestra título y artista.
    src: "assets/audio/those-eyes-home-session.mp3",
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
let songAudio;
let musicLoadTimer;
let musicTimedOut = false;

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
    // iOS sólo permite sonido dentro del gesto: play() va primero y sin nada asíncrono antes.
    playMusic(true);
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
  // El recorrido es el del sticky: alto de la escena menos alto del escenario (100svh). En iOS,
  // innerHeight cambia al mostrarse u ocultarse las barras de Safari y hacía saltar el progreso.
  const updates = scenes
    .map((scene) => [scene, scene.getBoundingClientRect(), scene.querySelector(".stage")?.offsetHeight || viewport])
    .filter(([, rect]) => rect.bottom >= -viewport && rect.top <= viewport * 2)
    .map(([scene, rect, stageHeight]) => {
      const travel = rect.height - stageHeight;
      const progress = travel > 0 ? Math.min(1, Math.max(0, -rect.top / travel)) : 1;
      const t = Math.min(1, progress / 0.75);
      // Salida suave (no smoothstep): responde desde el primer píxel de scroll y aterriza igual.
      // Con smoothstep, los primeros 40-60 px de dedo casi no movían el iris ni el cierre.
      return [scene, progress, 1 - (1 - t) * (1 - t)];
    });
  // Sólo las escenas cercanas llevan sus fotos en capa propia (will-change): no se repintan
  // en cada frame y el resto de la página no reserva memoria para ellas.
  scenes.forEach((scene) => {
    const live = updates.some(([candidate]) => candidate === scene);
    if (scene.classList.contains("is-live") !== live) scene.classList.toggle("is-live", live);
  });
  updates.forEach(([scene, progress, eased]) => {
    scene.style.setProperty("--p", progress.toFixed(4));
    scene.style.setProperty("--e", eased.toFixed(4));
  });
}

/* Dress code: tira de fotogramas, una foto por marco 3:5 (recortada y llevada a B&N en
   tools/process-images.py). AVIF con WebP de respaldo; las rutas van completas para que
   build-site.mjs las publique. Los rótulos usan sólo prendas del texto confirmado de cada guía. */
const DRESS_REFERENCES = {
  women: {
    tab: "Ellas",
    outfit: 0,
    frames: [
      ["Vestido midi", "assets/dresscode/women-01-lg.avif", "assets/dresscode/women-01-lg.webp"],
      ["Pantalón de vestir", "assets/dresscode/women-02-lg.avif", "assets/dresscode/women-02-lg.webp"],
      ["Vestido corto", "assets/dresscode/women-03-lg.avif", "assets/dresscode/women-03-lg.webp"],
      ["Conjunto", "assets/dresscode/women-04-lg.avif", "assets/dresscode/women-04-lg.webp"],
      ["Pantalón de vestir", "assets/dresscode/women-05-lg.avif", "assets/dresscode/women-05-lg.webp"],
    ],
  },
  men: {
    tab: "Ellos",
    outfit: 1,
    frames: [
      ["Camisa", "assets/dresscode/men-01-lg.avif", "assets/dresscode/men-01-lg.webp"],
      ["Chomba", "assets/dresscode/men-02-lg.avif", "assets/dresscode/men-02-lg.webp"],
      ["Pantalón de vestir", "assets/dresscode/men-03-lg.avif", "assets/dresscode/men-03-lg.webp"],
      ["Remera lisa", "assets/dresscode/men-04-lg.avif", "assets/dresscode/men-04-lg.webp"],
      ["Chino", "assets/dresscode/men-05-lg.avif", "assets/dresscode/men-05-lg.webp"],
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
      ...set.frames.map(([label, avif, webp], index) => {
        const figure = document.createElement("figure");
        const crop = document.createElement("picture");
        const source = document.createElement("source");
        const image = document.createElement("img");
        const caption = document.createElement("figcaption");
        const name = document.createElement("b");
        const number = document.createElement("span");
        figure.className = "frame";
        crop.className = "frame__crop";
        crop.style.transitionDelay = reducedMotion.matches ? "0ms" : `${index * 55}ms`;
        source.type = "image/avif";
        source.srcset = avif;
        image.src = webp;
        image.alt = `${set.tab}: referencia de ${label.toLowerCase()}`;
        image.loading = "lazy";
        image.decoding = "async";
        image.width = 720;
        image.height = 1200;
        name.textContent = label;
        number.textContent = String(index + 1).padStart(2, "0");
        crop.append(source, image);
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
        ? "Tu respuesta está lista para enviar."
        : "No podemos abrir WhatsApp desde acá. Copiá el mensaje y envialo vos.",
    );
    const confirmLabel = byId("confirmRsvp")?.querySelector("span");
    if (confirmLabel) confirmLabel.textContent = phoneReady ? "Enviar por WhatsApp" : "Copiar mensaje";

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
    // Sin "noopener" en las opciones: con esa opción window.open devuelve null siempre y no se
    // podría saber si el navegador bloqueó la pestaña. El opener se corta a mano.
    const tab = window.open(url, "_blank");
    if (!tab) {
      // Bloqueada (algunos navegadores internos de apps): WhatsApp se abre en esta misma pestaña,
      // así la respuesta nunca se pierde con un aviso de éxito.
      window.location.href = url;
      return;
    }
    tab.opener = null;
    dialog?.close();
    showToast("Enviá el mensaje en WhatsApp para que recibamos tu respuesta.");
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
  const minimize = byId("musicMinimize");
  const songToggle = byId("songToggle");
  songAudio = byId("songAudio");
  if (!player || !toggle || !minimize || !songAudio) return;

  const storedCompact = readSession("weddingPlayerCompact");
  const compactByDefault = window.matchMedia("(max-width: 599px), (max-height: 499px)").matches;
  setMusicPlayerCompact(player, minimize, storedCompact === null ? compactByDefault : storedCompact === "true");

  minimize.addEventListener("click", () => {
    const nextCompact = !player.classList.contains("is-compact");
    setMusicPlayerCompact(player, minimize, nextCompact);
    writeSession("weddingPlayerCompact", String(nextCompact));
  });

  if (isPlaceholder(music.src)) {
    player.classList.add("is-unavailable");
    if (songToggle) songToggle.hidden = true;
    updateMusicUi(false, "Canción pendiente");
    return;
  }

  // preload="none": nada se descarga hasta el primer play(), así no compite con la portada.
  songAudio.src = music.src;
  if ("mediaSession" in navigator && "MediaMetadata" in window) {
    navigator.mediaSession.metadata = new MediaMetadata({ title: music.title, artist: music.artist });
  }

  // "Abrir invitación" es siempre un gesto nuevo y explícito: pide reproducir aunque en una
  // visita anterior de esta pestaña se haya pausado. Las pausas se respetan mientras se navega
  // porque, después de abrir, nada reproduce solo. Se borra la marca que guardaban versiones previas.
  try {
    sessionStorage.removeItem("weddingMusicPaused");
  } catch {
    // Sin acceso al almacenamiento no hay nada que limpiar.
  }

  // Un solo <audio>: tocar varias veces nunca duplica la reproducción; con la carga en curso, pausa.
  const togglePlayback = () => {
    if (songAudio.paused) playMusic(false);
    else songAudio.pause();
  };

  toggle.addEventListener("click", () => {
    if (player.classList.contains("is-compact")) {
      setMusicPlayerCompact(player, minimize, false);
      writeSession("weddingPlayerCompact", "false");
    }
    togglePlayback();
  });
  songToggle?.addEventListener("click", togglePlayback);

  // El estado visible sale de los eventos del navegador, nunca de la intención.
  songAudio.addEventListener("playing", () => {
    window.clearTimeout(musicLoadTimer);
    player.classList.remove("is-unavailable");
    updateMusicUi(true, "Reproduciendo");
  });
  const onBuffering = () => {
    // stalled también llega mientras suena lo ya descargado: sólo cuenta si falta audio de verdad.
    // Si ya está cargando, no se reinicia la espera (stalled se repite y nunca vencería).
    if (songAudio.paused || songAudio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA || player.classList.contains("is-loading")) return;
    updateMusicUi(true, "Cargando…", true);
    armMusicTimeout();
  };
  songAudio.addEventListener("waiting", onBuffering);
  songAudio.addEventListener("stalled", onBuffering);
  songAudio.addEventListener("progress", () => {
    if (player.classList.contains("is-loading")) armMusicTimeout();
  });
  songAudio.addEventListener("pause", () => {
    window.clearTimeout(musicLoadTimer);
    // Tras un error, el navegador también pausa: el estado que vale es el del error.
    if (songAudio.ended || songAudio.error) return;
    updateMusicUi(false, musicTimedOut ? "Tocá play para reintentar" : "Pausado");
    musicTimedOut = false;
  });
  songAudio.addEventListener("ended", () => updateMusicUi(false, "Terminó la canción"));
  songAudio.addEventListener("error", () => {
    window.clearTimeout(musicLoadTimer);
    player.classList.add("is-unavailable");
    updateMusicUi(false, "La canción no cargó");
  });
}

function setMusicPlayerCompact(player, button, compact) {
  player.classList.toggle("is-compact", compact);
  button.setAttribute("aria-expanded", String(!compact));
  button.setAttribute("aria-label", compact ? "Mostrar controles del reproductor" : "Minimizar reproductor");
}

function playMusic(fromOpening) {
  if (!songAudio?.getAttribute("src")) return;

  // Después de un error de red, load() descarta el estado roto y el mismo gesto reintenta.
  if (songAudio.error) songAudio.load();
  let request;
  try {
    request = songAudio.play();
  } catch (error) {
    request = Promise.reject(error);
  }
  updateMusicUi(true, "Cargando…", true);
  armMusicTimeout();

  Promise.resolve(request).catch((error) => {
    window.clearTimeout(musicLoadTimer);
    // AbortError: una pausa pedida durante la carga; el evento pause ya actualizó la interfaz.
    if (error?.name === "AbortError" || songAudio.error) return;
    updateMusicUi(false, "Tocá play para escuchar");
    if (!fromOpening) showToast("El navegador no dejó iniciar la canción. Probá tocar play de nuevo.");
  });
}

// La interfaz nunca queda cargando para siempre: sin datos nuevos en 15 s, se ofrece reintentar.
function armMusicTimeout() {
  window.clearTimeout(musicLoadTimer);
  musicLoadTimer = window.setTimeout(() => {
    if (songAudio.paused || songAudio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) return;
    musicTimedOut = true;
    songAudio.pause();
  }, 15000);
}

function updateMusicUi(isPlaying, status, isLoading = false) {
  const { music } = WEDDING_CONFIG;
  const player = byId("musicPlayer");
  const toggle = byId("musicToggle");
  const songToggle = byId("songToggle");
  player?.classList.toggle("is-playing", isPlaying);
  player?.classList.toggle("is-loading", isLoading);
  toggle?.setAttribute("aria-label", `${isPlaying ? "Pausar" : "Reproducir"} ${music.title}`);
  if (songToggle) {
    songToggle.classList.toggle("is-playing", isPlaying);
    songToggle.querySelector("span").textContent = isPlaying ? "Pausar" : "Escuchar";
  }
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
