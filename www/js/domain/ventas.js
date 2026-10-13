export function requiereAlertaDeStock(saldo, stockMinimo) {
  return saldo <= stockMinimo;
}

export function validarVenta(datos, producto) {
  if (!datos.id_producto || !producto) return "Selecciona un producto.";
  if (!datos.fecha) return "Selecciona la fecha de la venta.";
  if (!Number.isInteger(datos.cantidad) || !(datos.cantidad > 0)) {
    return "La cantidad debe ser un número entero mayor que cero.";
  }
  if (datos.cantidad > producto.stock) {
    return "La cantidad supera el stock disponible (" + producto.stock + ").";
  }
  if (!(datos.precio > 0)) return "El precio de venta debe ser mayor que cero.";
  if (datos.tipo_comprobante !== "" && datos.numero_comprobante === "") {
    return "Escribe el número del comprobante.";
  }
  if (datos.tipo_comprobante === "" && datos.numero_comprobante !== "") {
    return "Selecciona el tipo de comprobante.";
  }
  return null;
}