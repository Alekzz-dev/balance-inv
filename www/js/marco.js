import { cerrarSesion } from "./services/auth.js";
import { obtenerUsuarioActual } from "./services/usuarios.js";

const iconos = {
  dashboard:
    '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>' +
    '<rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  producto:
    '<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5"/><path d="M12 13v8"/>',
  inventario:
    '<path d="M3 21V9l9-5 9 5v12"/><rect x="8" y="13" width="8" height="8"/>',
  compras:
    '<rect x="2" y="7" width="12" height="9" rx="1"/><path d="M14 10h4l3 3v3h-7"/>' +
    '<circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  ventas:
    '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/>' +
    '<path d="M2 3h3l2.5 12h11l2-8H6"/>',
  documentos:
    '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/>' +
    '<path d="M14 3v5h5"/><path d="M9 13h6M9 17h6"/>',
  balance: '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
  historial: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  alertas: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/>',
  triangulo: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.01"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>'
};

const menu = [
  {
    grupo: "Principal",
    items: [
      { nombre: "Dashboard", ruta: "#/dashboard", icono: "dashboard", listo: true },
      { nombre: "Productos", ruta: "#/productos", icono: "producto", listo: true },
      { nombre: "Inventario", ruta: "#/inventario", icono: "inventario", listo: false },
      { nombre: "Compras", ruta: "#/compras", icono: "compras", listo: true },
      { nombre: "Ventas", ruta: "#/ventas", icono: "ventas", listo: false }
    ]
  },
  {
    grupo: "Gestión",
    items: [
      { nombre: "Documentación", ruta: "#/documentacion", icono: "documentos", listo: false },
      { nombre: "Balance", ruta: "#/balance", icono: "balance", listo: false },
      { nombre: "Historial", ruta: "#/historial", icono: "historial", listo: false },
      { nombre: "Alertas", ruta: "#/alertas", icono: "alertas", listo: false }
    ]
  }
];

export function icono(nombre) {
  return `<svg class="icono" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
    aria-hidden="true">${iconos[nombre]}</svg>`;
}

function htmlMenu(rutaActiva) {
  return menu.map((grupo) => `
    <p class="menu-grupo">${grupo.grupo}</p>
    ${grupo.items.map((item) => item.listo
      ? `<a class="menu-item${item.ruta === rutaActiva ? " activo" : ""}" href="${item.ruta}">
           ${icono(item.icono)}<span>${item.nombre}</span></a>`
      : `<span class="menu-item pronto" title="Próximamente">
           ${icono(item.icono)}<span>${item.nombre}</span></span>`
    ).join("")}
  `).join("");
}

export function crearMarco(titulo, rutaActiva, contenido) {
  const marco = document.createElement("div");
  marco.className = "marco";
  marco.innerHTML = `
    <aside class="lateral" id="lateral">
      <div class="marca">${icono("producto")}<span>BALANCE-INV</span></div>
      <nav class="menu">${htmlMenu(rutaActiva)}</nav>
      <div class="perfil">
        <div class="perfil-datos">
          <strong id="perfil-nombre">Cargando...</strong>
          <span id="perfil-rol"></span>
        </div>
        <button class="boton-texto" type="button" id="boton-salir">Cerrar sesión</button>
      </div>
    </aside>
    <div class="velo" id="velo"></div>
    <div class="principal">
      <header class="cabecera">
        <button class="boton-menu" type="button" id="boton-menu" aria-label="Abrir menú">
          ${icono("menu")}
        </button>
        <h1 class="cabecera-titulo"></h1>
        <a class="boton" href="#/productos">+ Nuevo producto</a>
      </header>
      <main class="contenido-principal" id="contenido-principal"></main>
    </div>
  `;

  marco.querySelector(".cabecera-titulo").textContent = titulo;
  marco.querySelector("#contenido-principal").append(contenido);

  const lateral = marco.querySelector("#lateral");
  const velo = marco.querySelector("#velo");
  const alternarMenu = () => {
    lateral.classList.toggle("abierto");
    velo.classList.toggle("visible");
  };
  marco.querySelector("#boton-menu").addEventListener("click", alternarMenu);
  velo.addEventListener("click", alternarMenu);
  marco.querySelector("#boton-salir").addEventListener("click", cerrarSesion);

  obtenerUsuarioActual()
    .then((usuario) => {
      marco.querySelector("#perfil-nombre").textContent = usuario.nombre;
      marco.querySelector("#perfil-rol").textContent = usuario.rol;
    })
    .catch(() => {
      marco.querySelector("#perfil-nombre").textContent = "Usuario";
    });

  return marco;
}