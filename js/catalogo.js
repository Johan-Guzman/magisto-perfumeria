/* =========================================================
   CATÁLOGO — categorías, búsqueda, tarjetas y ficha de producto.
   ========================================================= */
(function () {
  "use strict";

  const CFG = window.CONFIG;
  const DATA = window.FRAGANCIAS || [];
  const { $, esc, fmt, precioUnitario, agregar, abrirCarrito } = window.Tienda;

  // slug (para la URL #dama) → nombre de categoría en los datos
  const CATEGORIAS = [
    { slug: "todas", nombre: "Todas", titulo: "Todas las fragancias" },
    { slug: "dama", nombre: "Dama" },
    { slug: "caballero", nombre: "Caballero" },
    { slug: "unisex", nombre: "Unisex" },
    { slug: "arabe", nombre: "Árabe", titulo: "Árabes" },
    { slug: "nicho", nombre: "Nicho" }
  ];

  const estado = { categoria: "todas", busqueda: "" };

  const normalizar = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  const textoBusqueda = new Map(DATA.map((f) => [f.id, normalizar(`${f.nombre} ${f.casa}`)]));
  const catActual = () => CATEGORIAS.find((c) => c.slug === estado.categoria);

  // Tono de la etiqueta tipográfica según categoría principal
  function tono(f) {
    if (f.categorias.includes("Nicho")) return "nicho";
    if (f.categorias.includes("Árabe")) return "arabe";
    if (f.categorias.includes("Unisex")) return "unisex";
    return f.genero === "Dama" ? "dama" : "caballero";
  }

  function precioDesde(f) {
    const precios = CFG.presentaciones.map((p) => precioUnitario(f, p.ml, null)).filter((n) => n !== null);
    return precios.length ? `Desde ${fmt(Math.min(...precios))}` : "Por cotizar";
  }

  /* ---------- Filtros de categoría ---------- */
  function pintarCategorias() {
    $("#categorias").innerHTML = CATEGORIAS.map((c) => {
      const n = c.slug === "todas" ? DATA.length : DATA.filter((f) => f.categorias.includes(c.nombre)).length;
      return `<button type="button" class="chip" data-cat="${c.slug}" aria-pressed="${c.slug === estado.categoria}">
        ${esc(c.nombre)} <span class="chip-n">${n}</span></button>`;
    }).join("");
  }

  function filtrar() {
    const cat = catActual();
    const q = normalizar(estado.busqueda);
    return DATA.filter((f) =>
      (cat.slug === "todas" || f.categorias.includes(cat.nombre)) &&
      (!q || textoBusqueda.get(f.id).includes(q))
    );
  }

  /* ---------- Tarjetas ---------- */
  function tarjeta(f) {
    return `<li class="card">
      <div class="tile tone-${tono(f)}">
        <span class="tile-brand" aria-hidden="true">Magisto</span>
        <h3 class="tile-name">${esc(f.nombre)}</h3>
        <span class="tile-cat">${esc(f.categorias.join(" · "))}</span>
      </div>
      <div class="card-body">
        ${f.casa ? `<p class="card-house">Inspiración · ${esc(f.casa)}</p>` : `<p class="card-house">Fragancia inspirada</p>`}
        <p class="card-price">${precioDesde(f)}</p>
        <button type="button" class="card-link" data-abrir="${esc(f.id)}" aria-label="Elegir ${esc(f.nombre)}">Elegir</button>
      </div>
    </li>`;
  }

  function pintarGrid() {
    const lista = filtrar();
    const cat = catActual();
    $("#grid").innerHTML = lista.map(tarjeta).join("");
    $("#cat-titulo").textContent = cat.titulo || cat.nombre;
    $("#cat-conteo").textContent = `${lista.length} ${lista.length === 1 ? "fragancia" : "fragancias"}`;
    $("#sin-resultados").hidden = lista.length > 0;
    $("#buscar-todas").hidden = !(lista.length === 0 && cat.slug !== "todas" && estado.busqueda);
    if (!lista.length) {
      $("#sin-resultados p").textContent = estado.busqueda
        ? "No encontramos fragancias con esa búsqueda."
        : "Aún no hay fragancias en esta categoría.";
    }
    document.querySelectorAll("[data-cat]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.cat === cat.slug)));
  }

  /* ---------- Navegación por URL (#dama, #nicho…) ---------- */
  function leerHash(desplazar) {
    const slug = location.hash.slice(1);
    if (!CATEGORIAS.some((c) => c.slug === slug)) return;
    estado.categoria = slug;
    pintarGrid();
    if (desplazar) document.getElementById("catalogo").scrollIntoView({ behavior: "smooth" });
  }

  function irACategoria(slug) {
    if (location.hash.slice(1) !== slug) history.replaceState(null, "", "#" + slug);
    leerHash(false);
  }

  /* ---------- Ficha de producto ---------- */
  const ficha = $("#ficha");
  let actual = null;
  let disparador = null;

  const pendiente = () => `<span class="pending">Pendiente</span>`;

  function filaDato(etiqueta, valor) {
    const vacio = !valor || (Array.isArray(valor) && !valor.length);
    if (vacio && !CFG.mostrarPendientes) return "";
    const texto = vacio ? pendiente() : esc(Array.isArray(valor) ? valor.join(", ") : valor);
    return `<div><dt>${etiqueta}</dt><dd>${texto}</dd></div>`;
  }

  function imagenEmpaque(e) {
    const ph = `<span class="pack-ph" aria-hidden="true">Foto pendiente</span>`;
    if (!e.imagen) return ph;
    return `<img src="${esc(e.imagen)}" alt="" loading="lazy" data-fallback="${esc(ph)}">`;
  }

  function abrirFicha(id, boton) {
    actual = DATA.find((f) => f.id === id);
    if (!actual) return;
    disparador = boton;
    const f = actual;

    $("#ficha-media").innerHTML = `<div class="tile tile-lg tone-${tono(f)}" aria-hidden="true">
        <span class="tile-brand">Magisto</span>
        <span class="tile-name">${esc(f.nombre)}</span>
        <span class="tile-cat">${esc(f.categorias.join(" · "))}</span>
      </div>`;

    $("#ficha-form").innerHTML = `
      <p class="eyebrow">${esc(f.categorias.join(" · "))}</p>
      <h2 class="pd-name" id="ficha-nombre">${esc(f.nombre)}</h2>
      <p class="pd-inspired">Fragancia inspirada en el perfil olfativo de ${esc(f.nombre)}${f.casa ? ` de ${esc(f.casa)}` : ""}.</p>

      <dl class="pd-list">
        ${filaDato("Casa de referencia", f.casa)}
        ${filaDato("Descripción", f.descripcion)}
        ${filaDato("Notas de salida", f.notas?.salida)}
        ${filaDato("Notas de corazón", f.notas?.corazon)}
        ${filaDato("Notas de fondo", f.notas?.fondo)}
      </dl>

      <fieldset class="opt-group">
        <legend class="pd-label">Presentación</legend>
        <div class="sizes">
          ${CFG.presentaciones.map((p, i) => {
            const precio = precioUnitario(f, p.ml, null);
            return `<label class="size-option">
              <input type="radio" name="ml" value="${p.ml}" ${i === 0 ? "checked" : ""}>
              <span><strong>${p.ml} ml</strong><small>${esc(p.onzas)}</small><em>${fmt(precio)}</em></span>
            </label>`;
          }).join("")}
        </div>
      </fieldset>

      <fieldset class="opt-group">
        <legend class="pd-label">Empaque</legend>
        <div class="packs">
          ${CFG.empaques.map((e, i) => `
            <label class="pack-option">
              <input type="radio" name="empaque" value="${esc(e.id)}" ${i === 0 ? "checked" : ""}>
              <span class="pack-card">
                <span class="pack-img">${imagenEmpaque(e)}</span>
                <span class="pack-name">${esc(e.nombre)}</span>
              </span>
            </label>`).join("")}
        </div>
      </fieldset>

      <div class="opt-group">
        <p class="pd-label" id="cant-label">Cantidad</p>
        <div class="qty" role="group" aria-labelledby="cant-label">
          <button type="button" data-paso="-1" aria-label="Restar uno">−</button>
          <output id="ficha-cantidad" aria-live="polite">1</output>
          <button type="button" data-paso="1" aria-label="Sumar uno">+</button>
        </div>
      </div>

      <div class="pd-buy">
        <p class="pd-price" id="ficha-precio"></p>
        <button type="submit" class="btn">Agregar al pedido</button>
      </div>`;

    actualizarPrecioFicha();
    ficha.showModal();
    ficha.querySelector(".pd-close").focus();
  }

  function seleccion() {
    const form = $("#ficha-form");
    return {
      ml: Number(form.elements.ml.value),
      empaque: form.elements.empaque.value,
      cantidad: Number($("#ficha-cantidad").textContent)
    };
  }

  function actualizarPrecioFicha() {
    const s = seleccion();
    const pu = precioUnitario(actual, s.ml, s.empaque);
    $("#ficha-precio").innerHTML = pu === null
      ? `Por cotizar`
      : `${fmt(pu * s.cantidad)}${s.cantidad > 1 ? `<small>${fmt(pu)} c/u</small>` : ""}`;
  }

  function initFicha() {
    $("#grid").addEventListener("click", (e) => {
      const b = e.target.closest("[data-abrir]");
      if (b) abrirFicha(b.dataset.abrir, b);
    });

    ficha.addEventListener("click", (e) => {
      if (e.target === ficha || e.target.closest("[data-cerrar]")) return ficha.close();
      const paso = e.target.closest("[data-paso]");
      if (paso) {
        const out = $("#ficha-cantidad");
        out.textContent = Math.max(1, Math.min(99, Number(out.textContent) + Number(paso.dataset.paso)));
        actualizarPrecioFicha();
      }
    });

    ficha.addEventListener("change", actualizarPrecioFicha);

    $("#ficha-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const s = seleccion();
      agregar(actual.id, s.ml, s.empaque, s.cantidad);
      const emp = CFG.empaques.find((x) => x.id === s.empaque);
      ficha.close();
      avisar(`${s.cantidad > 1 ? s.cantidad + " × " : ""}${actual.nombre} · ${s.ml} ml · ${emp.nombre}`);
    });

    ficha.addEventListener("close", () => disparador?.focus());
  }

  /* ---------- Aviso discreto ---------- */
  let avisoTimer;
  function avisar(texto) {
    const t = $("#aviso");
    t.innerHTML = `<span><strong>Agregado al pedido</strong>${esc(texto)}</span>
      <button type="button" class="link-btn" data-ver-pedido>Ver pedido</button>`;
    t.hidden = false;
    requestAnimationFrame(() => t.classList.add("is-visible"));
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(() => { t.classList.remove("is-visible"); setTimeout(() => (t.hidden = true), 250); }, 4000);
  }

  /* ---------- Imágenes que aún no existen → placeholder ---------- */
  document.addEventListener("error", (e) => {
    const img = e.target;
    if (img.tagName === "IMG" && img.dataset.fallback) img.outerHTML = img.dataset.fallback;
  }, true);

  /* ---------- Menú móvil y footer ---------- */
  function initNav() {
    const toggle = $(".nav-toggle");
    const menu = $("#nav-menu");
    const set = (abierto) => { toggle.setAttribute("aria-expanded", String(abierto)); menu.classList.toggle("is-open", abierto); };
    toggle.addEventListener("click", () => set(toggle.getAttribute("aria-expanded") !== "true"));
    menu.addEventListener("click", (e) => { if (e.target.closest("a")) set(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") set(false); });
    document.addEventListener("click", (e) => { if (!e.target.closest(".nav")) set(false); });
  }

  function pintarFooter() {
    const ph = (t) => `<span class="ph">${t}</span>`;
    const wa = String(CFG.whatsapp || "").replace(/\D/g, "");
    $("#footer-contacto").innerHTML =
      `<li>${wa ? `<a href="https://wa.me/${wa}" target="_blank" rel="noopener">WhatsApp +${wa}</a>` : `WhatsApp ${ph("número pendiente")}`}</li>`;
    const r = CFG.redes || {};
    const red = (n, u) => `<li>${u ? `<a href="${esc(u)}" target="_blank" rel="noopener">${n}</a>` : `${n} ${ph("URL pendiente")}`}</li>`;
    $("#footer-redes").innerHTML = red("Instagram", r.instagram) + red("Facebook", r.facebook);
    $("#anio").textContent = new Date().getFullYear();
  }

  /* ---------- Inicio ---------- */
  function init() {
    pintarCategorias();
    pintarFooter();
    initNav();
    initFicha();

    $("#categorias").addEventListener("click", (e) => {
      const b = e.target.closest("[data-cat]");
      if (b) irACategoria(b.dataset.cat);
    });

    let t;
    $("#buscar").addEventListener("input", (e) => {
      clearTimeout(t);
      t = setTimeout(() => { estado.busqueda = e.target.value; pintarGrid(); }, 120);
    });
    $("#buscar-todas").addEventListener("click", () => irACategoria("todas"));

    $("#aviso").addEventListener("click", (e) => { if (e.target.closest("[data-ver-pedido]")) abrirCarrito(); });

    window.addEventListener("hashchange", () => leerHash(true));
    pintarGrid();
    if (location.hash) leerHash(true);
  }

  init();
})();
