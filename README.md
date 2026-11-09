# Magisto Perfumería — Catálogo digital

Catálogo con carrito y pedido por WhatsApp. HTML + CSS + JavaScript, sin backend: se abre directamente en el navegador.

## Estructura

```
magisto-perfumeria-catalogo/
├── index.html
├── css/styles.css          Diseño (colores en :root)
├── js/configuracion.js     WhatsApp, precios, empaques, redes  ← lo que más vas a editar
├── js/carrito.js           Carrito, localStorage y mensaje de WhatsApp
├── js/catalogo.js          Categorías, búsqueda, tarjetas y ficha
├── data/fragancias.js      Las 225 fragancias (desde el Excel)
└── assets/
    ├── favicon.svg
    └── empaques/           Fotos de los empaques
```

## Ver el catálogo

Doble clic en `index.html`. O, para probar en el celular dentro de la misma red Wi‑Fi:

```bash
python3 -m http.server 8000      # dentro de la carpeta
```

y abre `http://IP-DE-TU-PC:8000`.

## Cambiar el número de WhatsApp

`js/configuracion.js` → `whatsapp: "57XXXXXXXXXX"` (indicativo 57 + celular, solo dígitos).
Mientras esté vacío, el botón "Finalizar pedido por WhatsApp" aparece desactivado.

## Modificar precios

`js/configuracion.js` → `precios`:

```js
precios: { 30: 20000, 50: 30000, 100: null }
```

- Valores sin puntos ni símbolos. `null` = "Por cotizar" (el cliente igual puede pedir).
- 30 ml y 50 ml vienen de la hoja "Ventas" del Excel (1 oz = $20.000, 2 oz = $30.000). **Verifícalos.**
- Precio especial para una sola fragancia: en `data/fragancias.js` cambia su `"precios": null` por `"precios": {"30": 25000, "50": 35000, "100": 60000}`.
- Recargo por empaque: `recargo` en cada empaque de `configuracion.js` (ej. `recargo: 5000`).

## Agregar las fotos reales de los empaques

Guarda cada foto en `assets/empaques/` con estos nombres exactos:

| Empaque | Archivo |
|---|---|
| Cartier | `cartier.jpg` |
| Bala | `bala.jpg` |
| Tapa Plana | `tapa-plana.jpg` |
| Palito Largo | `palito-largo.jpg` |
| Especial | `especial.jpg` |

Formato cuadrado, unos 600×600 px. Aparecen solos; mientras no existan se ve "Foto pendiente".
Para usar otro nombre o formato (.png, .webp), cambia `imagen` en `configuracion.js`.

## Editar o agregar fragancias

En `data/fragancias.js`, cada línea es una fragancia. Para agregar una, copia una línea, cambia el `id` (único) y los datos:

```js
{"id": "nueva-dama", "nombre": "Nueva", "casa": "Casa", "genero": "Dama",
 "categorias": ["Dama", "Nicho"], "hoja": "Manual",
 "descripcion": "", "notas": {"salida": [], "corazon": [], "fondo": []}, "precios": null},
```

- `categorias` decide en qué secciones aparece: `"Dama"`, `"Caballero"`, `"Unisex"`, `"Árabe"`, `"Nicho"` (puede tener varias).
- Notas: listas de texto, ej. `"salida": ["Bergamota", "Limón"]`.
- Cuando completes los datos, puedes poner `mostrarPendientes: false` en `configuracion.js` para ocultar los "Pendiente".

## Publicar

Arrastra la carpeta a **Netlify Drop** (app.netlify.com/drop), o súbela a GitHub Pages, Vercel o Cloudflare Pages. No requiere build.
Después completa `og:url` y usa una URL absoluta en `og:image` dentro de `index.html`.

## Cómo se construyó la información

- **Fuente:** hojas Femeninas (104), Masculinas (122) y Ventas del Excel.
- **Duplicados exactos unidos (2):** "212 VIP Black" y "Solo" aparecían dos veces en Masculinas. "Solo" conservó la casa Loewe.
- **Agregada desde Ventas (1):** "Bianco Latte" (Giardini Di Toscana), vendida pero ausente de las hojas de catálogo.
- **Unisex:** "Bade'e Al Oud Amethyst", registrada como Unisex en Ventas ("AI Oud Amethyst").
- **Árabe:** fragancias marcadas "Arabe" en el Excel, casas árabes (Al Haramain, Lataffa, Orientica) y coincidencias con la sección "Fragancias Árabes" del folleto.
- **Nicho:** casas de nicho (Montale, Tiziana Terenzi, Xerjoff, Kilian, Maison Francis Kurkdjian, Parfums de Marly, Initio, Ilmin) y coincidencias con la sección "Fragancias de Nicho" del folleto.
- **Nombres:** se conservaron tal cual aparecen en el Excel, incluidos errores de escritura (p. ej. "Cassiopeda", "Givenchi", "Pacco Rabanne"). Puedes corregirlos en `data/fragancias.js`.
