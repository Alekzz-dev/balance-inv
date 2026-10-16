import { obtenerUsuarioActual } from "./services/usuarios.js";

function saludo() {
  const hora = new Date().getHours();
  if (hora < 12) return "Buenos días";
  if (hora < 19) return "Buenas tardes";
  return "Buenas noches";
}

export function crearBienvenida() {
  const elemento = document.createElement("section");
  elemento.className = "bienvenida";
  elemento.innerHTML = `
    <div>
      <p class="bienvenida-fecha" id="bienvenida-fecha"></p>
      <h2 class="bienvenida-titulo" id="bienvenida-titulo"></h2>
      <p class="bienvenida-resumen" id="bienvenida-resumen">Cargando...</p>
    </div>
    <div class="bienvenida-acciones">
      <a class="boton" href="#/ventas">Registrar venta</a>
      <a class="boton boton-secundario" href="#/compras">Registrar compra</a>
    </div>
  `;

  const titulo = elemento.querySelector("#bienvenida-titulo");
  const resumen = elemento.querySelector("#bienvenida-resumen");

  const fecha = new Date().toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });
  elemento.querySelector("#bienvenida-fecha").textContent =
    fecha.charAt(0).toUpperCase() + fecha.slice(1);

  titulo.textContent = saludo();
  obtenerUsuarioActual()
    .then((usuario) => {
      titulo.textContent = saludo() + ", " + usuario.nombre;
    })
    .catch(() => {});

  let stockBajo = null;
  let alertas = null;

  function dibujarResumen() {
    if (stockBajo === null || alertas === null) return;
    const partes = [];
    if (stockBajo > 0) {
      partes.push(stockBajo + (stockBajo === 1
        ? " producto en el mínimo o agotado"
        : " productos en el mínimo o agotados"));
    }
    if (alertas > 0) {
      partes.push(alertas + (alertas === 1 ? " alerta pendiente" : " alertas pendientes"));
    }
    resumen.textContent = partes.length === 0
      ? "Todo en orden: no hay productos en el mínimo ni alertas pendientes."
      : "Hoy requiere atención: " + partes.join(" y ") + ".";
  }

  return {
    elemento,
    actualizarInventario: (resumenInventario) => {
      stockBajo = resumenInventario.stockBajo;
      dibujarResumen();
    },
    actualizarAlertas: (cantidad) => {
      alertas = cantidad;
      dibujarResumen();
    }
  };
}