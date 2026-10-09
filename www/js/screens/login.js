import { iniciarSesion } from "../services/auth.js";

export function render() {
  const pantalla = document.createElement("section");
    pantalla.className = "pantalla-login";
  pantalla.innerHTML = `
    <h1>BALANCE-INV</h1>
    <form class="formulario" id="form-login" novalidate>
      <label class="campo">
        Correo
        <input type="email" id="correo" autocomplete="username" />
      </label>
      <label class="campo">
        Contraseña
        <input type="password" id="contrasena" autocomplete="current-password" />
      </label>
      <p class="mensaje-error" id="mensaje-error"></p>
      <button class="boton" type="submit">Ingresar</button>
    </form>
  `;

  const formulario = pantalla.querySelector("#form-login");
  const mensajeError = pantalla.querySelector("#mensaje-error");
  const boton = pantalla.querySelector("button");

  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    mensajeError.textContent = "";

    const correo = pantalla.querySelector("#correo").value.trim();
    const contrasena = pantalla.querySelector("#contrasena").value;

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