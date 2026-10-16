import { icono } from "../marco.js";
import { iniciarSesion } from "../services/auth.js";

export function render() {
  const pantalla = document.createElement("section");
  pantalla.className = "entrada";
  pantalla.innerHTML = `
    <div class="entrada-tarjeta">
      <header class="entrada-cabecera">
        <div class="entrada-logo">${icono("marca")}</div>
        <h1>BALANCE-INV</h1>
        <p class="entrada-lema">Control de inventario, ventas y documentación</p>
      </header>

      <div class="entrada-formulario">
        <h2>Bienvenido</h2>
        <form class="formulario" id="form-login" novalidate>
          <label class="campo-icono">
            ${icono("correo")}
            <input type="email" id="correo" placeholder="Correo electrónico"
              aria-label="Correo electrónico" autocomplete="username" />
          </label>
          <label class="campo-icono">
            ${icono("candado")}
            <input type="password" id="contrasena" placeholder="Contraseña"
              aria-label="Contraseña" autocomplete="current-password" />
            <button class="ojo" type="button" id="boton-ojo" aria-label="Mostrar contraseña">
              ${icono("ojoTachado")}
            </button>
          </label>
          <p class="mensaje-error" id="mensaje-error"></p>
          <button class="boton" type="submit" id="boton-ingresar">Ingresar</button>
        </form>
      </div>
    </div>
  `;

  const formulario = pantalla.querySelector("#form-login");
  const mensajeError = pantalla.querySelector("#mensaje-error");
  const boton = pantalla.querySelector("#boton-ingresar");
  const campoContrasena = pantalla.querySelector("#contrasena");
  const botonOjo = pantalla.querySelector("#boton-ojo");

  botonOjo.addEventListener("click", () => {
    const mostrar = campoContrasena.type === "password";
    campoContrasena.type = mostrar ? "text" : "password";
    botonOjo.innerHTML = icono(mostrar ? "ojo" : "ojoTachado");
    botonOjo.setAttribute("aria-label", mostrar ? "Ocultar contraseña" : "Mostrar contraseña");
  });

  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    mensajeError.textContent = "";

    const correo = pantalla.querySelector("#correo").value.trim();
    const contrasena = campoContrasena.value;

    if (!correo || !contrasena) {
      mensajeError.textContent = "Ingresa tu correo y tu contraseña.";
      return;
    }

    boton.disabled = true;
    boton.textContent = "Ingresando...";
    try {
      await iniciarSesion(correo, contrasena);
    } catch (error) {
      const sinConexion = error.code === "auth/network-request-failed";
      mensajeError.textContent = sinConexion
        ? "No hay conexión. Revisa tu internet e inténtalo de nuevo."
        : "Correo o contraseña incorrectos.";
    } finally {
      boton.disabled = false;
      boton.textContent = "Ingresar";
    }
  });

  return pantalla;
}