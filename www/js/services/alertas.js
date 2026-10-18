import { collection, doc, limit, onSnapshot, orderBy, query, updateDoc, where }
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

export function escucharAlertas(alRecibir, alFallar) {
  const consulta = query(collection(db, "alertas"), orderBy("fecha", "desc"), limit(200));
  return onSnapshot(
    consulta,
    (snap) => alRecibir(snap.docs.map((d) => {
      const datos = d.data();
      return { ...datos, fecha: datos.fecha ? datos.fecha.toDate() : null };
    })),
    alFallar
  );
}

export async function marcarAtendida(idAlerta) {
  await updateDoc(doc(db, "alertas", idAlerta), { estado: "atendida" });
}