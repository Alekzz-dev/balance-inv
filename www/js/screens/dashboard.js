import { cerrarSesion } from "../services/auth.js";

export function render() {
  const pantalla = document.createElement("section");
  pantalla.innerHTML = `
    <h1>Dashboard</h1>
    <p>Sesión iniciada. Aquí irán los indicadores del Dashboard.</p>
    <button class="boton" type="button" id="boton-salir">Cerrar sesión</button>
  `;

  pantalla.querySelector("#boton-salir").addEventListener("click", cerrarSesion);

  return pantalla;
}