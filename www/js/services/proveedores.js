import { collection, onSnapshot, orderBy, query }
  from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { db } from "../firebase-config.js";

export function escucharProveedores(alRecibir, alFallar) {
  const consulta = query(collection(db, "proveedores"), orderBy("nombre"));
  return onSnapshot(
    consulta,
    (snap) => alRecibir(snap.docs.map((d) => d.data())),
    alFallar
  );
}