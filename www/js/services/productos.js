import { collection, doc, getDocs, onSnapshot, orderBy, query, setDoc, updateDoc, where }
  from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { db } from "../firebase-config.js";

export async function existeCodigo(codigo, idExcluido = null) {
  const consulta = query(collection(db, "productos"), where("codigo", "==", codigo));
  const resultado = await getDocs(consulta);
  return resultado.docs.some((d) => d.id !== idExcluido);
}

export async function crearProducto(datos) {
  const referencia = doc(collection(db, "productos"));
  await setDoc(referencia, {
    ...datos,
    id_producto: referencia.id,
    stock: 0
  });
}

export async function actualizarProducto(idProducto, datos) {
  await updateDoc(doc(db, "productos", idProducto), datos);
}

export function escucharProductos(alRecibir, alFallar) {
  const consulta = query(collection(db, "productos"), orderBy("nombre"));
  return onSnapshot(
    consulta,
    (snap) => alRecibir(snap.docs.map((d) => d.data())),
    alFallar
  );
}