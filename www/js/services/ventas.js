import {
  collection, doc, limit, onSnapshot, orderBy, query, runTransaction, serverTimestamp, where
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { requiereAlertaDeStock } from "../domain/ventas.js";
import { auth, db } from "../firebase-config.js";

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

export function escucharVentas(alRecibir, alFallar) {
  const consulta = query(collection(db, "ventas"), orderBy("fecha", "desc"), limit(20));
  return onSnapshot(
    consulta,
    (snap) => alRecibir(snap.docs.map((d) => d.data())),
    alFallar
  );
}

export async function registrarVenta(venta) {
  const refProducto = doc(db, "productos", venta.id_producto);
  const refVenta = doc(collection(db, "ventas"));
  const refMov = doc(collection(db, "movimientos"));
  const refAlerta = doc(db, "alertas", "stock_bajo_" + venta.id_producto);

  await runTransaction(db, async (tx) => {
    // 1) Lecturas
    const snapProducto = await tx.get(refProducto);
    const snapAlerta = await tx.get(refAlerta);
    if (!snapProducto.exists()) throw new Error("Producto no encontrado");
    const { stock = 0, stock_minimo = 0, nombre } = snapProducto.data();
    if (stock < venta.cantidad) throw new Error("Stock insuficiente");
    const saldo = stock - venta.cantidad;

    // 2) Escrituras
    tx.set(refVenta, { ...venta, id_venta: refVenta.id });
    tx.update(refProducto, { stock: saldo });
    tx.set(refMov, {
      id_movimiento: refMov.id,
      tipo_movimiento: "venta",
      cantidad: -venta.cantidad,
      fecha_hora: serverTimestamp(),
      saldo_resultante: saldo,
      origen_tipo: "venta",
      origen_id: refVenta.id,
      id_producto: venta.id_producto,
      id_usuario: auth.currentUser.uid
    });

    const hayAlertaPendiente = snapAlerta.exists() && snapAlerta.data().estado === "pendiente";
    if (requiereAlertaDeStock(saldo, stock_minimo) && !hayAlertaPendiente) {
      tx.set(refAlerta, {
        id_alerta: refAlerta.id,
        tipo_alerta: "stock_bajo",
        mensaje: "Stock bajo: " + nombre + " tiene " + saldo + " unidades.",
        fecha: serverTimestamp(),
        estado: "pendiente",
        id_producto: venta.id_producto
      });
    }
  });
}