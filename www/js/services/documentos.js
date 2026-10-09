import { collection, onSnapshot }
  from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { db } from "../firebase-config.js";

export function escucharDocumentos(alRecibir, alFallar) {
  return onSnapshot(
    collection(db, "documentos"),
    (snap) => alRecibir(snap.docs.map((d) => d.data())),
    alFallar
  );
}