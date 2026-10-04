export function validarProducto(datos) {
  if (!datos.codigo || !datos.nombre || !datos.categoria) {
    return "Completa código, nombre y categoría.";
  }
  if (!(datos.precio_compra > 0) || !(datos.precio_venta > 0)) {
    return "Los precios deben ser mayores que cero.";
  }
  if (!Number.isInteger(datos.stock_minimo) || !(datos.stock_minimo > 0)) {
    return "El stock mínimo debe ser un número entero mayor que cero.";
  }
  return null;
}