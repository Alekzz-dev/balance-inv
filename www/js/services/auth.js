import { signInWithEmailAndPassword }
  from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { auth } from "../firebase-config.js";

export function iniciarSesion(correo, contrasena) {
  return signInWithEmailAndPassword(auth, correo, contrasena);
}