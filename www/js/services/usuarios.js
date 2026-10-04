import { doc, getDoc }
  from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { auth, db } from "../firebase-config.js";

export async function obtenerUsuarioActual() {
  const uid = auth.currentUser.uid;
  const instantanea = await getDoc(doc(db, "usuarios", uid));
  if (!instantanea.exists()) {
    throw new Error("Usuario no registrado en la colección usuarios");
  }
  return instantanea.data();
}