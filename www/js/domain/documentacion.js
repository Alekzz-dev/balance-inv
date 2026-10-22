export const PORCENTAJE_LIMITE = 20;

export function requiereAlertaDeSaldo(saldo, documentada) {
  return saldo <= (documentada * PORCENTAJE_LIMITE) / 100;
}

export function estadoDeSaldo(compra) {
  if (!compra.id_documento) return "sin-documento";
  const documentada = compra.cantidad_documentada ?? 0;
  const saldo = compra.saldo_documentado ?? 0;
  if (saldo === 0) return "agotado";
  if (requiereAlertaDeSaldo(saldo, documentada)) return "proximo";
  return "disponible";
}

export function validarUso(cantidad, compra) {
  if (!Number.isInteger(cantidad) || !(cantidad > 0)) {
    return "La cantidad debe ser un número entero mayor que cero.";
  }
  if (cantidad > compra.saldo_documentado) {
    return "La cantidad supera el saldo documentado disponible (" + compra.saldo_documentado + ").";
  }
  return null;
}

export function resumirDocumentacion(compras) {
  const resumen = { saldoTotal: 0, utilizadas: 0, porAgotarse: 0 };
  for (const compra of compras) {
    if (!compra.id_documento) continue;
    resumen.saldoTotal += compra.saldo_documentado ?? 0;
    resumen.utilizadas += compra.cantidad_utilizada ?? 0;
    const estado = estadoDeSaldo(compra);
    if (estado === "proximo" || estado === "agotado") resumen.porAgotarse += 1;
  }
  return resumen;
}