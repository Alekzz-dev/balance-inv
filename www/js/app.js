import { auth } from "./firebase-config.js";
import { onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

const rutas = {
  "#/login": () => import("./screens/login.js"),
  "#/dashboard": () => import("./screens/dashboard.js"),
  "#/productos": () => import("./screens/productos.js"),
  "#/inventario": () => import("./screens/inventario.js"),
  "#/compras": () => import("./screens/compras.js"),
  "#/ventas": () => import("./screens/ventas.js"),
  "#/documentacion": () => import("./screens/documentacion.js"),
  "#/historial": () => import("./screens/historial.js"),
  "#/alertas": () => import("./screens/alertas.js")
  // ... resto de las pantallas
};

let pantallaActual = null;

async function navegar() {
  const hayUsuario = auth.currentUser !== null;

  if (!hayUsuario && location.hash !== "#/login") {
    location.hash = "#/login";
    return;
  }
  if (hayUsuario && location.hash === "#/login") {
    location.hash = "#/dashboard";
    return;
  }

  const cargar = rutas[location.hash] ?? rutas["#/dashboard"];
  const pantalla = await cargar();

  if (pantallaActual && pantallaActual.salir) pantallaActual.salir();
  pantallaActual = pantalla;

  document.getElementById("contenido").replaceChildren(await pantalla.render());
  if (window.ocultarSplash) window.ocultarSplash();
}

window.addEventListener("hashchange", navegar);
onAuthStateChanged(auth, navegar);