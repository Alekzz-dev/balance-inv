export function etiquetaDeTipo(tipo) {
  if (tipo === "compra") return "Compra";
  if (tipo === "venta") return "Venta";
  const texto = String(tipo ?? "Movimiento").replaceAll("_", " ");
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function filtrarMovimientos(movimientos, filtros) {
  return movimientos.filter((movimiento) => {
    if (filtros.idProducto && movimiento.id_producto !== filtros.idProducto) return false;
    if (filtros.tipo && movimiento.tipo_movimiento !== filtros.tipo) return false;
    if (filtros.desde && (!movimiento.fecha_hora || movimiento.fecha_hora < filtros.desde)) {
      return false;
    }
    if (filtros.hasta && (!movimiento.fecha_hora || movimiento.fecha_hora >= filtros.hasta)) {
      return false;
    }
    return true;
  });
}

export function resumirMovimientos(movimientos) {
  let entradas = 0;
  let salidas = 0;
  for (const movimiento of movimientos) {
    if (movimiento.cantidad > 0) entradas += movimiento.cantidad;
    else salidas += -movimiento.cantidad;
  }
  return { entradas, salidas, neto: entradas - salidas };
}