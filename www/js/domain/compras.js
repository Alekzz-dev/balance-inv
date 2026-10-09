export function calcularSaldoDocumentado(documentada, utilizada) {
  return documentada - utilizada;
}

export function validarCompra(datos, categoria) {
  if (!datos.id_producto) return "Selecciona un producto.";

  if (!datos.id_proveedor) return "Selecciona un proveedor.";
  if (datos.id_proveedor === "nuevo") {
    if (!datos.proveedor_nombre) return "Escribe el nombre del proveedor.";
    if (!/^\d{11}$/.test(datos.proveedor_ruc)) return "El RUC debe tener 11 dígitos.";
  }

  if (!datos.fecha) return "Selecciona la fecha de la compra.";
  if (!Number.isInteger(datos.cantidad) || !(datos.cantidad > 0)) {
    return "La cantidad debe ser un número entero mayor que cero.";
  }
  if (!(datos.precio > 0)) return "El precio debe ser mayor que cero.";

  const hayDocumento = datos.tipo_documento !== "" || datos.numero_documento !== "";
  if (categoria === "Importado" && (!datos.tipo_documento || !datos.numero_documento)) {
    return "Los productos importados requieren tipo y número de documento.";
  }
  if (hayDocumento) {
    if (!datos.tipo_documento || !datos.numero_documento) {
      return "Completa el tipo y el número del documento.";
    }
    if (!Number.isInteger(datos.cantidad_documentada) || !(datos.cantidad_documentada > 0)) {
      return "La cantidad documentada debe ser un número entero mayor que cero.";
    }
    if (datos.cantidad_documentada > datos.cantidad) {
      return "La cantidad documentada no puede superar la cantidad comprada.";
    }
  } else if (datos.cantidad_documentada > 0) {
    return "Indica el documento o deja la cantidad documentada en cero.";
  }
  return null;
}