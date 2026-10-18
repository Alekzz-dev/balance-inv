export function estadoDeStock(producto) {
  if (producto.stock === 0) return "agotado";
  if (producto.stock <= producto.stock_minimo) return "bajo";
  return "disponible";
}

export function resumirInventario(productos) {
  const resumen = {
    total: productos.length,
    importados: 0,
    nacionales: 0,
    disponible: 0,
    bajo: 0,
    agotado: 0,
    stockBajo: 0
  };
  for (const producto of productos) {
    if (producto.categoria === "Importado") resumen.importados += 1;
    if (producto.categoria === "Nacional") resumen.nacionales += 1;
    const estado = estadoDeStock(producto);
    resumen[estado] += 1;
    if (estado !== "disponible") resumen.stockBajo += 1;
  }
  return resumen;
}

export function totalVentas(ventas) {
  return ventas.reduce((suma, venta) => suma + venta.cantidad * venta.precio, 0);
}

export function formatearSoles(monto) {
  return "S/ " + monto.toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export function unidadesEnStock(productos) {
  return productos.reduce((suma, producto) => suma + (producto.stock ?? 0), 0);
}

export function valorDelInventario(productos) {
  return productos.reduce(
    (suma, producto) => suma + (producto.stock ?? 0) * (producto.precio_compra ?? 0),
    0
  );
}

export function ordenarProductos(productos, criterio) {
  const copia = [...productos];
  if (criterio === "stock-asc") {
    copia.sort((a, b) => a.stock - b.stock);
  } else if (criterio === "stock-desc") {
    copia.sort((a, b) => b.stock - a.stock);
  } else {
    copia.sort((a, b) => (a.nombre ?? "").localeCompare(b.nombre ?? "", "es"));
  }
  return copia;
}