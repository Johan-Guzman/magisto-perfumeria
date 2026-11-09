/* =========================================================
   CARRITO — estado, persistencia (localStorage), panel y WhatsApp.
   Expone window.Tienda para que catalogo.js pueda agregar productos.
   ========================================================= */
(function () {
  "use strict";

  const CFG = window.CONFIG;
  const DATA = window.FRAGANCIAS || [];
  const porId = new Map(DATA.map((f) => [f.id, f]));
  const CLAVE = "magisto-carrito-v1";

  /* ---------- Utilidades compartidas ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const dinero = new Intl.NumberFormat(CFG.moneda.locale, { style: "currency", currency: CFG.moneda.codigo, maximumFractionDigits: 0 });
  const fmt = (n) => (typeof n === "number" ? dinero.format(n) : "Por cotizar");

  const presentacion = (ml) => CFG.presentaciones.find((p) => p.ml === ml);
  const empaque = (id) => CFG.empaques.find((e) => e.id === id);
  const textoPresentacion = (ml) => `${ml} ml (${presentacion(ml)?.onzas || ""})`;

  // Precio unitario: precio propio de la fragancia > precio general; + recargo del empaque si existe.
  function precioUnitario(frag, ml, empaqueId) {
    const propio = frag?.precios?.[ml];
    const base = typeof propio === "number" ? propio : CFG.precios[ml];
    if (typeof base !== "number") return null;
    const recargo = empaque(empaqueId)?.recargo;
    return base + (typeof recargo === "number" ? recargo : 0);
  }

  /* ---------- Estado ---------- */
  let lineas = cargar();

  function cargar() {
    try {
      const datos = JSON.parse(localStorage.getItem(CLAVE) || "[]");
      // Descarta líneas de fragancias, tamaños o empaques que ya no existan
      return datos.filter((l) => porId.has(l.id) && presentacion(l.ml) && empaque(l.empaque) && l.cantidad > 0);
    } catch { return []; }
  }
  function guardar() {
    try { localStorage.setItem(CLAVE, JSON.stringify(lineas)); } catch { /* sin almacenamiento: funciona en memoria */ }
  }

  const igual = (a, b) => a.id === b.id && a.ml === b.ml && a.empaque === b.empaque;
  const totalUnidades = () => lineas.reduce((s, l) => s + l.cantidad, 0);

  function agregar(id, ml, empaqueId, cantidad) {
    const nueva = { id, ml, empaque: empaqueId, cantidad };
    const existente = lineas.find((l) => igual(l, nueva));
    if (existente) existente.cantidad += cantidad;
    else lineas.push(nueva);
    cambio();
  }

  // Cambiar tamaño/empaque de una línea; si queda igual a otra, se unen.
  function editar(i, campo, valor) {
    const l = lineas[i];
    l[campo] = valor;
    const otra = lineas.findIndex((x, j) => j !== i && igual(x, l));
    if (otra > -1) { lineas[otra].cantidad += l.cantidad; lineas.splice(i, 1); }
    cambio();
  }

  function cambio() {
    guardar();
    actualizarContadores();
    if ($("#carrito").open) pintarCarrito();
  }

  function resumen() {
    let total = 0, sinPrecio = 0;
    lineas.forEach((l) => {
      const p = precioUnitario(porId.get(l.id), l.ml, l.empaque);
      if (p === null) sinPrecio += l.cantidad; else total += p * l.cantidad;
    });
    return { total, sinPrecio };
  }

  /* ---------- Contadores y barra móvil ---------- */
  function actualizarContadores() {
    const n = totalUnidades();
    document.querySelectorAll("[data-cart-count]").forEach((el) => {
      el.textContent = n;
      el.classList.toggle("is-empty", n === 0);
    });
    $("#abrir-carrito").setAttribute("aria-label", `Ver pedido, ${n} ${n === 1 ? "producto" : "productos"}`);

    const barra = $("#barra-pedido");
    barra.hidden = n === 0;
    if (n) {
      const { total, sinPrecio } = resumen();
      const precio = total ? fmt(total) + (sinPrecio ? " + por cotizar" : "") : "Por cotizar";
      barra.innerHTML = `<span>Ver pedido · ${n} ${n === 1 ? "producto" : "productos"}</span><strong>${precio}</strong>`;
    }
  }

  /* ---------- Panel del carrito ---------- */
  const opciones = (lista, actual) => lista.map((o) => `<option value="${o.v}" ${o.v == actual ? "selected" : ""}>${esc(o.t)}</option>`).join("");

  function pintarCarrito() {
    const lista = $("#carrito-lista");
    const pie = $("#carrito-resumen");

    if (!lineas.length) {
      lista.innerHTML = `<div class="cart-empty">
          <p class="cart-empty-title">Tu pedido está vacío</p>
          <p>Explora el catálogo y agrega las fragancias que te gusten.</p>
          <button type="button" class="btn" data-seguir>Explorar fragancias</button>
        </div>`;
      pie.innerHTML = "";
      return;
    }

    lista.innerHTML = `<ul class="cart-lines" role="list">${lineas.map((l, i) => {
      const f = porId.get(l.id);
      const pu = precioUnitario(f, l.ml, l.empaque);
      return `<li class="line" data-i="${i}">
        <div class="line-top">
          <div>
            <p class="line-name">${esc(f.nombre)}</p>
            <p class="line-meta">${esc(f.categorias.join(" · "))}${f.casa ? " · " + esc(f.casa) : ""}</p>
          </div>
          <button type="button" class="link-btn line-remove" data-quitar aria-label="Eliminar ${esc(f.nombre)}">Eliminar</button>
        </div>
        <div class="line-opts">
          <label><span>Presentación</span>
            <select data-campo="ml">${opciones(CFG.presentaciones.map((p) => ({ v: p.ml, t: textoPresentacion(p.ml) })), l.ml)}</select>
          </label>
          <label><span>Empaque</span>
            <select data-campo="empaque">${opciones(CFG.empaques.map((e) => ({ v: e.id, t: e.nombre })), l.empaque)}</select>
          </label>
        </div>
        <div class="line-bottom">
          <div class="qty" role="group" aria-label="Cantidad de ${esc(f.nombre)}">
            <button type="button" data-qty="-1" aria-label="Restar uno">−</button>
            <output aria-live="polite">${l.cantidad}</output>
            <button type="button" data-qty="1" aria-label="Sumar uno">+</button>
          </div>
          <div class="line-prices">
            <span class="line-unit">${pu === null ? "Precio por cotizar" : fmt(pu) + " c/u"}</span>
            ${pu === null ? "" : `<strong>${fmt(pu * l.cantidad)}</strong>`}
          </div>
        </div>
      </li>`;
    }).join("")}</ul>`;

    const { total, sinPrecio } = resumen();
    const n = totalUnidades();
    const url = urlWhatsApp();
    pie.innerHTML = `
      <div class="cart-total">
        <span>${n} ${n === 1 ? "producto" : "productos"}</span>
        <strong>${total ? fmt(total) : "Por cotizar"}</strong>
      </div>
      ${sinPrecio && total ? `<p class="cart-note">${sinPrecio} ${sinPrecio === 1 ? "producto" : "productos"} sin precio configurado: se cotizan por WhatsApp.</p>` : ""}
      ${url
        ? `<a class="btn btn-wa" href="${esc(url)}" target="_blank" rel="noopener">Finalizar pedido por WhatsApp</a>`
        : `<span class="btn btn-wa is-disabled" aria-disabled="true">Finalizar pedido por WhatsApp</span>
           <p class="cart-note"><span class="ph">Configura el número de WhatsApp en js/configuracion.js</span></p>`}
      <div class="cart-actions">
        <button type="button" class="link-btn" data-seguir>← Seguir explorando</button>
        <button type="button" class="link-btn" data-vaciar>Vaciar pedido</button>
      </div>`;
  }

  /* ---------- Mensaje de WhatsApp ---------- */
  function mensaje() {
    const partes = [`Hola, ${CFG.negocio}. Estoy interesado en realizar el siguiente pedido:`, ""];
    lineas.forEach((l, i) => {
      const f = porId.get(l.id);
      const pu = precioUnitario(f, l.ml, l.empaque);
      partes.push(`${i + 1}. Fragancia: ${f.nombre}${f.casa ? ` (${f.casa})` : ""}`);
      partes.push(`   - Categoría: ${f.categorias.join(" / ")}.`);
      partes.push(`   - Presentación: ${textoPresentacion(l.ml)}.`);
      partes.push(`   - Empaque: ${empaque(l.empaque).nombre}.`);
      partes.push(`   - Cantidad: ${l.cantidad}.`);
      if (pu !== null) {
        partes.push(`   - Precio unitario: ${fmt(pu)}.`);
        partes.push(`   - Subtotal: ${fmt(pu * l.cantidad)}.`);
      } else {
        partes.push(`   - Precio: por cotizar.`);
      }
      partes.push("");
    });
    const { total, sinPrecio } = resumen();
    if (total && !sinPrecio) partes.push(`Total del pedido: ${fmt(total)}.`, "");
    else if (total) partes.push(`Total de los productos con precio: ${fmt(total)} (más los productos por cotizar).`, "");
    partes.push("Quisiera confirmar disponibilidad y continuar con mi pedido.", "", "¡Gracias!");
    return partes.join("\n");
  }

  function urlWhatsApp() {
    const numero = String(CFG.whatsapp || "").replace(/\D/g, "");
    if (!numero || !lineas.length) return null;
    return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje())}`;
  }

  /* ---------- Eventos del panel ---------- */
  const dialogo = $("#carrito");
  let vaciarTimer;

  function abrir() { pintarCarrito(); dialogo.showModal(); }
  function cerrar() { dialogo.close(); }

  function init() {
    $("#abrir-carrito").addEventListener("click", abrir);
    $("#barra-pedido").addEventListener("click", abrir);

    dialogo.addEventListener("click", (e) => {
      if (e.target === dialogo || e.target.closest("[data-cerrar]")) return cerrar();
      if (e.target.closest("[data-seguir]")) {
        cerrar();
        document.getElementById("catalogo").scrollIntoView({ behavior: "smooth" });
        return;
      }

      // Vaciar en dos pasos (sin ventanas emergentes)
      const vaciar = e.target.closest("[data-vaciar]");
      if (vaciar) {
        if (vaciar.dataset.confirmar) { lineas = []; cambio(); return; }
        vaciar.dataset.confirmar = "1";
        vaciar.textContent = "¿Seguro? Toca otra vez para vaciar";
        clearTimeout(vaciarTimer);
        vaciarTimer = setTimeout(() => { vaciar.removeAttribute("data-confirmar"); vaciar.textContent = "Vaciar pedido"; }, 4000);
        return;
      }

      const li = e.target.closest(".line");
      if (!li) return;
      const i = Number(li.dataset.i);
      if (e.target.closest("[data-quitar]")) { lineas.splice(i, 1); cambio(); return; }
      const q = e.target.closest("[data-qty]");
      if (q) {
        const nueva = lineas[i].cantidad + Number(q.dataset.qty);
        if (nueva < 1) lineas.splice(i, 1); else lineas[i].cantidad = nueva;
        cambio();
        // Mantener el foco en el mismo control tras repintar
        $(`.line[data-i="${i}"] [data-qty="${q.dataset.qty}"]`, dialogo)?.focus();
      }
    });

    dialogo.addEventListener("change", (e) => {
      const sel = e.target.closest("select[data-campo]");
      if (!sel) return;
      const i = Number(sel.closest(".line").dataset.i);
      editar(i, sel.dataset.campo, sel.dataset.campo === "ml" ? Number(sel.value) : sel.value);
    });

    actualizarContadores();
  }

  window.Tienda = { $, esc, fmt, precioUnitario, textoPresentacion, empaque, agregar, abrirCarrito: abrir, mensaje, lineas: () => lineas };
  init();
})();
