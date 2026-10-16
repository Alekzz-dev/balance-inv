import { collection, doc, getDoc, limit, onSnapshot, orderBy, query }
  from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { db } from "../firebase-config.js";

export function escucharMovimientos(alRecibir, alFallar) {
  const consulta = query(
    collection(db, "movimientos"),
    orderBy("fecha_hora", "desc"),
    limit(200)
  );
  return onSnapshot(
    consulta,
    (snap) => alRecibir(snap.docs.map((d) => {
      const datos = d.data();
      return { ...datos, fecha_hora: datos.fecha_hora ? datos.fecha_hora.toDate() : null };
    })),
    alFallar
  );
}

export async function obtenerOrigen(origenTipo, origenId) {
  if (origenTipo === "venta") {
    const snap = await getDoc(doc(db, "ventas", origenId));
    return snap.exists() ? { tipo: "venta", venta: snap.data() } : null;
  }
  if (origenTipo === "compra") {
    const snap = await getDoc(doc(db, "compras", origenId));
    if (!snap.exists()) return null;
    const compra = snap.data();
    const [snapProveedor, snapDocumento] = await Promise.all([
      compra.id_proveedor ? getDoc(doc(db, "proveedores", compra.id_proveedor)) : null,
      compra.id_documento ? getDoc(doc(db, "documentos", compra.id_documento)) : null
    ]);
    return {
      tipo: "compra",
      compra,
      proveedor: snapProveedor && snapProveedor.exists() ? snapProveedor.data() : null,
      documento: snapDocumento && snapDocumento.exists() ? snapDocumento.data() : null
    };
  }
  return null;
}