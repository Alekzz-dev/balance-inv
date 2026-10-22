export function saldoPorProducto(movimientos) {
  const saldos = new Map();
  for (const movimiento of movimientos) {
    const actual = saldos.get(movimiento.id_producto) ?? 0;
    saldos.set(movimiento.id_producto, actual + movimiento.cantidad);
  }
  return saldos;
}

export function compararBalance(productos, movimientos) {
  const saldos = saldoPorProducto(movimientos);
  return productos.map((producto) => {
    const registrado = producto.stock ?? 0;
    const segunMovimientos = saldos.get(producto.id_producto) ?? 0;
    return {
      producto,
      registrado,
      segunMovimientos,
      diferencia: registrado - segunMovimientos
    };
  });
}

export function movimientosConSaldo(movimientos) {
  const tiempo = (movimiento) => (movimiento.fecha_hora ? movimiento.fecha_hora.getTime() : Infinity);
  const ordenados = [...movimientos].sort((a, b) => {
    if (tiempo(a) < tiempo(b)) return -1;
    if (tiempo(a) > tiempo(b)) return 1;
    return 0;
  });
  let acumulado = 0;
  return ordenados.map((movimiento) => {
    acumulado += movimiento.cantidad;
    return {
      movimiento,
      saldoCalculado: acumulado,
      cuadra: acumulado === movimiento.saldo_resultante
    };
  });
}

export function resumirBalance(filas) {
  return {
    productos: filas.length,
    conDiferencia: filas.filter((fila) => fila.diferencia !== 0).length
  };
}