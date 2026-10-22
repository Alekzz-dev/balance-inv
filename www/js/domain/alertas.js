const ETIQUETAS = {
  stock_bajo: "Stock bajo",
  saldo_proximo: "Saldo próximo a agotarse"
};

export function etiquetaDeAlerta(tipo) {
  if (ETIQUETAS[tipo]) return ETIQUETAS[tipo];
  const texto = String(tipo ?? "Alerta").replaceAll("_", " ");
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function filtrarAlertas(alertas, filtros) {
  return alertas.filter((alerta) => {
    if (filtros.estado && alerta.estado !== filtros.estado) return false;
    if (filtros.tipo && alerta.tipo_alerta !== filtros.tipo) return false;
    return true;
  });
}

export function stockRepuesto(alerta, producto) {
  return alerta.tipo_alerta === "stock_bajo"
    && Boolean(producto)
    && producto.stock > producto.stock_minimo;
}