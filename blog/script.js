/* ===========================================================
   Christian Cattaneo — Blog · script.js
   Motor del home: grilla, filtro por categoría, buscador,
   tema claro/oscuro y menú móvil. Vanilla JS, sin dependencias.
   -----------------------------------------------------------
   LOS DATOS DE LOS ARTÍCULOS VIVEN EN  articles.js  (window.ARTICULOS).
   Para agregar artículos NO se toca este archivo: usá panel.html.
   =========================================================== */

/* ---------- 1. Datos ---------- */
/* Estáticos desde articles.js + dinámicos desde la nube (los que marcás "para el blog" en el panel). */
let ARTICULOS = Array.isArray(window.ARTICULOS) ? window.ARTICULOS.slice() : [];

/* Config Firebase (misma nube del panel/app) */
const CC_FB = {
  apiKey:'AIzaSyDkSgbqAJJRdlLwzcn-2vSMjVIUJbkVUGQ',
  authDomain:'entrenamiento-laboratorio.firebaseapp.com',
  projectId:'entrenamiento-laboratorio',
  storageBucket:'entrenamiento-laboratorio.firebasestorage.app',
  messagingSenderId:'399177627945',
  appId:'1:399177627945:web:2b4fef0894480f70dc1f38'
};
function _stripHtml(s){ return String(s||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim(); }
function _tsDeId(id){ const m=String(id||'').match(/(\d{10,})/); return m?parseInt(m[1]):0; }
/* Trae del panel los artículos publicados y marcados para el blog, y los suma a la grilla */
async function cargarArticulosNube(){
  try{
    if(!window.firebase) return;
    if(!firebase.apps.length) firebase.initializeApp(CC_FB);
    const doc = await firebase.firestore().collection('alumnos').doc('zz_articulos_global').get();
    if(!doc.exists) return;
    const remotos = (doc.data().articulos||[])
      .filter(a => a && a.enBlog === true && a.publicado !== false && a.titulo)
      .map(a => {
        const texto = _stripHtml(a.contenido || a.descripcion || '');
        const bajada = (a.subtitulo && a.subtitulo.trim()) ? a.subtitulo.trim() : (texto.slice(0,150) + (texto.length>150?'…':''));
        return {
          titulo: a.titulo,
          categoria: a.categoria || 'General',
          fecha: a.ts ? new Date(a.ts).toISOString() : (a.fecha || ''),
          fechaTexto: a.fecha || '',
          tiempoLectura: Math.max(2, Math.round(texto.split(' ').length/200)) + ' min',
          extracto: bajada,
          imagen: a.portada || 'img/cover-gluteo-mayor-evidencia.svg',
          url: 'articulo.html?id=' + encodeURIComponent(a.id),
          _dinamico: true
        };
      });
    if(remotos.length){
      // Evitar duplicar si ya existiera algún slug igual
      ARTICULOS = ARTICULOS.concat(remotos);
      ordenados = [...ARTICULOS].sort(porFecha);
      renderDestacados(); renderChips(); renderGrid();
    }
  }catch(e){ console.warn('blog nube:', e); }
}

/* Mapa categoría -> clase de color del chip/etiqueta */
const CAT_CLASS = {
  "Hipertrofia": "cat-hipertrofia",
  "Fuerza": "cat-fuerza",
  "Biomecánica": "cat-biomecanica",
  "Salud y dolor": "cat-salud",
  "Movilidad": "cat-movilidad",
  "Nutrición": "cat-nutricion",
  "Rendimiento": "cat-rendimiento"
};

/* ---------- 2. Utilidades ---------- */
const $ = (sel) => document.querySelector(sel);
const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const porFecha = (a, b) => new Date(b.fecha) - new Date(a.fecha);

function tarjeta(a) {
  const clase = CAT_CLASS[a.categoria] || "cat-fuerza";
  return `
  <a class="article-card" href="${a.url}">
    <div class="thumb"><img src="${a.imagen}" alt="Portada: ${a.titulo}" loading="lazy"></div>
    <div class="body">
      <span class="cat ${clase}">${a.categoria}</span>
      <h3>${a.titulo}</h3>
      <p class="excerpt">${a.extracto}</p>
      <div class="meta"><span>${a.tiempoLectura} de lectura</span><span>·</span><span>${a.fechaTexto}</span></div>
      <span class="read-more">LEER MÁS →</span>
    </div>
  </a>`;
}

/* ---------- 3. Render ---------- */
let ordenados = [...ARTICULOS].sort(porFecha);

/* Destacados: los 3 más recientes */
function renderDestacados() {
  const cont = $("#featuredGrid");
  if (cont) cont.innerHTML = ordenados.slice(0, 3).map(tarjeta).join("");
}

/* Estado de filtros para la grilla completa */
let categoriaActiva = "Todas";
let busqueda = "";

function renderGrid() {
  const cont = $("#articleGrid");
  if (!cont) return;
  const filtrados = ordenados.filter((a) => {
    const okCat = categoriaActiva === "Todas" || a.categoria === categoriaActiva;
    const q = norm(busqueda);
    const okBusq = !q || norm(a.titulo).includes(q) || norm(a.extracto).includes(q) || norm(a.categoria).includes(q);
    return okCat && okBusq;
  });
  cont.innerHTML = filtrados.length
    ? filtrados.map(tarjeta).join("")
    : `<p class="no-results">No se encontraron artículos para esa búsqueda. Probá con otro término.</p>`;
}

/* Chips de categoría (generados desde los datos) */
function renderChips() {
  const cont = $("#chips");
  if (!cont) return;
  const cats = ["Todas", ...Array.from(new Set(ARTICULOS.map((a) => a.categoria)))];
  cont.innerHTML = cats
    .map((c) => `<button class="chip${c === "Todas" ? " active" : ""}" data-cat="${c}">${c}</button>`)
    .join("");
  cont.querySelectorAll(".chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      cont.querySelectorAll(".chip").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      categoriaActiva = btn.dataset.cat;
      renderGrid();
    });
  });
}

/* ---------- 4. Buscador ---------- */
function initBuscador() {
  const input = $("#searchInput");
  if (!input) return;
  input.addEventListener("input", (e) => {
    busqueda = e.target.value;
    renderGrid();
  });
}

/* ---------- 5. Tema claro/oscuro (persistente) ---------- */
function initTema() {
  const btn = $("#themeToggle");
  const html = document.documentElement;
  const guardado = localStorage.getItem("cc-tema");
  if (guardado) html.setAttribute("data-theme", guardado);
  const pintar = () => { if (btn) btn.textContent = html.getAttribute("data-theme") === "light" ? "☀️" : "🌙"; };
  pintar();
  if (btn) btn.addEventListener("click", () => {
    const nuevo = html.getAttribute("data-theme") === "light" ? "dark" : "light";
    html.setAttribute("data-theme", nuevo);
    localStorage.setItem("cc-tema", nuevo);
    pintar();
  });
}

/* ---------- 6. Menú móvil ---------- */
function initMenu() {
  const btn = $("#navToggle");
  const nav = $("#mainNav");
  if (!btn || !nav) return;
  btn.addEventListener("click", () => {
    const abierto = nav.classList.toggle("open");
    btn.setAttribute("aria-expanded", abierto ? "true" : "false");
  });
  nav.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      nav.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
    })
  );
}

/* ---------- 7. Init ---------- */
document.addEventListener("DOMContentLoaded", () => {
  renderDestacados();
  renderChips();
  renderGrid();
  initBuscador();
  initTema();
  initMenu();
  cargarArticulosNube();   // sumar los artículos marcados "para el blog" desde la nube
});
