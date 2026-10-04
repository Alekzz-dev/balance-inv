import { cerrarSesion } from "../services/auth.js";
import { obtenerUsuarioActual } from "../services/usuarios.js";

export function render() {
  const pantalla = document.createElement("section");
  pantalla.innerHTML = `
    <h1>Dashboard</h1>
    <p id="saludo">Cargando...</p>
    <p>Aquí irán los indicadores del Dashboard.</p>
    <button class="boton" type="button" id="boton-salir">Cerrar sesión</button>
  `;

  const saludo = pantalla.querySelector("#saludo");
  obtenerUsuarioActual()
    .then((usuario) => {
      saludo.textContent = "Hola, " + usuario.nombre + " (" + usuario.rol + ")";
    })
    .catch(() => {
      saludo.textContent = "No se pudo cargar tu perfil de usuario.";
    });

  pantalla.querySelector("#boton-salir").addEventListener("click", cerrarSesion);

  return pantalla;
}