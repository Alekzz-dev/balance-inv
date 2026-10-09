import { collection, onSnapshot, query, where }
  from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { db } from "../firebase-config.js";

export function escucharAlertasPendientes(alRecibir, alFallar) {
  const consulta = query(collection(db, "alertas"), where("estado", "==", "pendiente"));
  return onSnapshot(
    consulta,
    (snap) => {
      const alertas = snap.docs.map((d) => d.data());
      alertas.sort((a, b) => (b.fecha?.seconds ?? 0) - (a.fecha?.seconds ?? 0));
      alRecibir(alertas);
    },
    alFallar
  );
}