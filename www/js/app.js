import { auth } from "./firebase-config.js";
import { onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

const rutas = {
  "#/login": () => import("./screens/login.js"),
  "#/dashboard": () => import("./screens/dashboard.js"),
  "#/productos": () => import("./screens/productos.js"),
  "#/compras": () => import("./screens/compras.js")
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
}

window.addEventListener("hashchange", navegar);
onAuthStateChanged(auth, navegar);