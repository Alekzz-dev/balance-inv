import { app } from "./firebase-config.js";

const contenido = document.getElementById("contenido");
const estado = document.createElement("p");
estado.textContent = "Firebase conectado al proyecto: " + app.options.projectId;
contenido.append(estado);