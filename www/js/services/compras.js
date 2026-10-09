import { collection, doc, limit, onSnapshot, orderBy, query, runTransaction, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { auth, db } from "../firebase-config.js";

export function escucharCompras(alRecibir, alFallar) {
  const consulta = query(collection(db, "compras"), orderBy("fecha", "desc"), limit(20));
  return onSnapshot(
    consulta,
    (snap) => alRecibir(snap.docs.map((d) => d.data())),
    alFallar
  );
}

export async function registrarCompra({ compra, proveedorNuevo, documento }) {
  const refProducto = doc(db, "productos", compra.id_producto);
  const refCompra = doc(collection(db, "compras"));
  const refMov = doc(collection(db, "movimientos"));
  const refProveedor = proveedorNuevo ? doc(collection(db, "proveedores")) : null;
  const refDocumento = documento ? doc(collection(db, "documentos")) : null;

  await runTransaction(db, async (tx) => {
    // 1) Lecturas
    const snap = await tx.get(refProducto);
    if (!snap.exists()) throw new Error("Producto no encontrado");
    const saldo = (snap.data().stock ?? 0) + compra.cantidad;

    // 2) Escrituras
    if (refProveedor) {
      tx.set(refProveedor, { id_proveedor: refProveedor.id, ...proveedorNuevo });
    }
    if (refDocumento) {
      tx.set(refDocumento, { id_documento: refDocumento.id, ...documento });
    }
    tx.set(refCompra, {
      ...compra,
      id_compra: refCompra.id,
      id_proveedor: refProveedor ? refProveedor.id : compra.id_proveedor,
      id_documento: refDocumento ? refDocumento.id : null,
      cantidad_utilizada: 0,
      saldo_documentado: compra.cantidad_documentada
    });
    tx.update(refProducto, { stock: saldo });
    tx.set(refMov, {
      id_movimiento: refMov.id,
      tipo_movimiento: "compra",
      cantidad: compra.cantidad,
      fecha_hora: serverTimestamp(),
      saldo_resultante: saldo,
      origen_tipo: "compra",
      origen_id: refCompra.id,
      id_producto: compra.id_producto,
      id_usuario: auth.currentUser.uid
    });
  });
}