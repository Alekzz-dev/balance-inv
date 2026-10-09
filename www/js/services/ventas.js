import { collection, onSnapshot, query, where }
  from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { db } from "../firebase-config.js";

export function escucharVentasDelDia(alRecibir, alFallar) {
  const inicio = new Date();
  inicio.setHours(0, 0, 0, 0);
  const fin = new Date(inicio);
  fin.setDate(fin.getDate() + 1);

  const consulta = query(
    collection(db, "ventas"),
    where("fecha", ">=", inicio),
    where("fecha", "<", fin)
  );
  return onSnapshot(
    consulta,
    (snap) => alRecibir(snap.docs.map((d) => d.data())),
    alFallar
  );
}