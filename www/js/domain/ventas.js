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

export function totalesPorDia(ventas, inicio, dias) {
  const puntos = [];
  for (let i = 0; i < dias; i++) {
    const fecha = new Date(inicio);
    fecha.setDate(fecha.getDate() + i);
    puntos.push({ fecha, valor: 0 });
  }
  for (const venta of ventas) {
    const dia = new Date(venta.fecha);
    dia.setHours(0, 0, 0, 0);
    const indice = Math.round((dia - inicio) / 86400000);
    if (indice >= 0 && indice < dias) {
      puntos[indice].valor += venta.cantidad * venta.precio;
    }
  }
  return puntos;
}

export function sumar(puntos) {
  return puntos.reduce((suma, punto) => suma + punto.valor, 0);
}

export function variacionPorcentual(actual, anterior) {
  if (anterior === 0) return null;
  return ((actual - anterior) / anterior) * 100;
}