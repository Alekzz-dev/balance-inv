import {
  collection, doc, limit, onSnapshot, orderBy, query, runTransaction,
  serverTimestamp, updateDoc, where
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
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

export async function generarAlertaDeDiferencia(producto, registrado, segunMovimientos) {
  const refAlerta = doc(db, "alertas", "diferencia_" + producto.id_producto);
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(refAlerta);
    if (snap.exists() && snap.data().estado === "pendiente") return false;
    tx.set(refAlerta, {
      id_alerta: refAlerta.id,
      tipo_alerta: "diferencia_detectada",
      mensaje: "Diferencia detectada: " + producto.nombre + " tiene " + registrado +
        " unidades registradas, pero los movimientos suman " + segunMovimientos +
        ". Revisa los movimientos.",
      fecha: serverTimestamp(),
      estado: "pendiente",
      id_producto: producto.id_producto
    });
    return true;
  });
}