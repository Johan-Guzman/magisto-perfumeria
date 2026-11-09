/* =========================================================
   CONFIGURACIÓN — Magisto Perfumería
   Todo lo que normalmente necesitas cambiar está en este archivo.
   ========================================================= */
window.CONFIG = {
  negocio: "Magisto Perfumería",

  // WhatsApp: indicativo + número, SOLO dígitos (sin "+", espacios ni guiones).
  // Ej. de formato (no real): 573001234567
  whatsapp: "573122405051",

  redes: {
    instagram: "",   // https://instagram.com/usuario
    facebook: ""     // https://facebook.com/pagina
  },

  /* PRECIOS GENERALES por presentación (pesos colombianos, sin puntos).
     30 ml y 50 ml se tomaron de la hoja "Ventas" del Excel
     (1 oz = $20.000 y 2 oz = $30.000). Verifícalos.
     null = "Por cotizar": el cliente igual puede pedir y se cotiza por WhatsApp.
     Para un precio distinto en una fragancia, usa "precios" en data/fragancias.js. */
  precios: {
    30: 20000,
    50: 30000,
    100: null
  },

  presentaciones: [
    { ml: 30,  onzas: "1 onza" },
    { ml: 50,  onzas: "2 onzas" },
    { ml: 100, onzas: "4 onzas" }
  ],

  /* EMPAQUES
     imagen: pon la foto real en assets/empaques/ con este nombre.
     Mientras no exista, se muestra un recuadro "Foto pendiente".
     recargo: valor adicional por empaque (null = sin recargo / por confirmar). */
  empaques: [
    { id: "cartier",      nombre: "Cartier",      imagen: "assets/empaques/cartier.jpg",      recargo: null },
    { id: "bala",         nombre: "Bala",         imagen: "assets/empaques/bala.jpg",         recargo: null },
    { id: "tapa-plana",   nombre: "Cilindro",   imagen: "assets/empaques/tapa-plana.jpg",   recargo: null },
    { id: "palito-largo", nombre: "Single", imagen: "assets/empaques/palito-largo.jpg", recargo: null },
    { id: "especial",     nombre: "Especial",     imagen: "assets/empaques/especial.jpg",     recargo: null }
  ],

  // true: muestra "Pendiente" en descripción y notas vacías (útil mientras completas datos).
  // false: oculta esos campos hasta que tengan información.
  mostrarPendientes: true,

  moneda: { locale: "es-CO", codigo: "COP" }
};
