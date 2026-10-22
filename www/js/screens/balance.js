import { compararBalance, movimientosConSaldo, resumirBalance } from "../domain/balance.js";
import { etiquetaDeTipo } from "../domain/historial.js";
import { crearMarco, icono } from "../marco.js";
import { generarAlertaDeDiferencia } from "../services/alertas.js";
import { escucharMovimientos } from "../services/movimientos.js";
import { escucharProductos } from "../services/productos.js";

const MAXIMO = 2000;

let cancelaciones = [];

function crearTarjeta(titulo, nombreIcono, tono, nota) {
  const elemento = document.createElement("article");
  elemento.className = "tarjeta tono-" + tono;
  elemento.innerHTML = `
    <div class="tarjeta-icono">${icono(nombreIcono)}</div>
    <p class="tarjeta-titulo"></p>
    <p class="tarjeta-valor">...</p>
    <p class="tarjeta-nota"></p>
  `;
  elemento.querySelector(".tarjeta-titulo").textContent = titulo;
  elemento.querySelector(".tarjeta-nota").textContent = nota;
  return { elemento, valor: elemento.querySelector(".tarjeta-valor") };
}

const conSigno = (numero) => (numero > 0 ? "+" : "") + numero;

export function render() {
  const contenido = document.createElement("div");
  contenido.className = "pantalla-balance";
  contenido.innerHTML = `
    <section class="tarjetas" id="tarjetas"></section>

    <section class="panel">
      <h2 class="panel-titulo">Balance por producto</h2>
      <p class="ayuda">
        Compara el stock registrado de cada producto con lo que suman sus movimientos
        (compras y ventas).
      </p>
      <p class="ayuda" id="aviso-limite"></p>
      <div class="herramientas">
        <label class="campo">
          Buscar
          <input type="search" id="buscar" placeholder="Código o nombre" />
        </label>
        <label class="campo">
          Resultado
          <select id="filtro-resultado">
            <option value="">Todos</option>
            <option value="cuadra">Cuadra</option>
            <option value="diferencia">Con diferencia</option>
          </select>
        </label>
        <button class="boton" type="button" id="generar">Generar alertas de diferencia</button>
      </div>
      <p class="mensaje-error" id="msg-error"></p>
      <p class="mensaje-exito" id="msg-exito"></p>
      <p id="estado-lista">Cargando...</p>
      <div class="tabla-contenedor">
        <table class="tabla">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Stock registrado</th>
              <th>Saldo según movimientos</th>
              <th>Diferencia</th>
              <th>Resultado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="cuerpo-tabla"></tbody>
        </table>
      </div>
    </section>

    <section class="panel" id="panel-detalle" hidden>
      <div class="panel-cabecera">
        <h2 class="panel-titulo" id="detalle-titulo"></h2>
        <button class="boton boton-secundario" type="button" id="cerrar-detalle">Cerrar</button>
      </div>
      <p class="ayuda" id="detalle-resumen"></p>
      <p id="detalle-estado"></p>
      <div class="tabla-contenedor">
        <table class="tabla">
          <thead>
            <tr>
              <th>Fecha y hora</th>
              <th>Movimiento</th>
              <th>Cantidad</th>
              <th>Saldo guardado</th>
              <th>Saldo calculado</th>
              <th>Verificación</th>
            </tr>
          </thead>
          <tbody id="cuerpo-detalle"></tbody>
        </table>
      </div>
    </section>
  `;

  const campo = (id) => contenido.querySelector("#" + id);

  const kProductos = crearTarjeta("Productos revisados", "producto", "acento", "Con su balance calculado");
  const kDiferencias = crearTarjeta("Con diferencia", "triangulo", "aviso", "Stock distinto de sus movimientos");
  const kMovimientos = crearTarjeta("Movimientos analizados", "historial", "exito", "Compras y ventas");
  campo("tarjetas").append(...[kProductos, kDiferencias, kMovimientos].map((t) => t.elemento));

  let productos = [];
  let movimientos = [];
  let filas = [];
  let idElegido = null;

  const celda = (valor) => {
    const td = document.createElement("td");
    td.textContent = valor;
    return td;
  };

  function dibujarTabla() {
    const texto = campo("buscar").value.trim().toLowerCase();
    const resultado = campo("filtro-resultado").value;

    const filtradas = filas.filter((fila) => {
      const descripcion = (fila.producto.nombre ?? "") + " " + (fila.producto.codigo ?? "");
      const estado = fila.diferencia === 0 ? "cuadra" : "diferencia";
      return descripcion.toLowerCase().includes(texto) &&
        (resultado === "" || estado === resultado);
    });

    const cuerpo = campo("cuerpo-tabla");
    cuerpo.replaceChildren();
    if (filas.length === 0) {
      campo("estado-lista").textContent = "Aún no hay productos registrados.";
    } else if (filtradas.length === 0) {
      campo("estado-lista").textContent = "Ningún producto coincide con los filtros.";
    } else {
      campo("estado-lista").textContent = "";
    }

    for (const fila of filtradas) {
      const cuadra = fila.diferencia === 0;

      const celdaProducto = document.createElement("td");
      const nombre = document.createElement("span");
      nombre.className = "producto-nombre";
      nombre.textContent = fila.producto.nombre;
      const codigo = document.createElement("span");
      codigo.className = "producto-codigo";
      codigo.textContent = fila.producto.codigo;
      celdaProducto.append(nombre, codigo);

      const celdaDiferencia = document.createElement("td");
      const diferencia = document.createElement("span");
      diferencia.className = cuadra ? "" : "cantidad-negativa";
      diferencia.textContent = cuadra ? "0" : conSigno(fila.diferencia);
      celdaDiferencia.append(diferencia);

      const celdaResultado = document.createElement("td");
      const insignia = document.createElement("span");
      insignia.className = "insignia " + (cuadra ? "insignia-disponible" : "insignia-agotado");
      insignia.textContent = cuadra ? "Cuadra" : "Diferencia";
      celdaResultado.append(insignia);

      const celdaAccion = document.createElement("td");
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "boton boton-secundario";
      boton.textContent = "Ver movimientos";
      boton.addEventListener("click", () => {
        idElegido = fila.producto.id_producto;
        dibujarDetalle();
        campo("panel-detalle").scrollIntoView();
      });
      celdaAccion.append(boton);

      const tr = document.createElement("tr");
      tr.append(
        celdaProducto,
        celda(fila.registrado),
        celda(fila.segunMovimientos),
        celdaDiferencia,
        celdaResultado,
        celdaAccion
      );
      cuerpo.append(tr);
    }
  }

  function dibujarDetalle() {
    const fila = filas.find((f) => f.producto.id_producto === idElegido);
    if (!fila) {
      campo("panel-detalle").hidden = true;
      return;
    }

    campo("panel-detalle").hidden = false;
    campo("detalle-titulo").textContent = "Movimientos de " + fila.producto.nombre;
    campo("detalle-resumen").textContent = "Saldo registrado: " + fila.registrado +
      " unidades · Saldo según movimientos: " + fila.segunMovimientos + " unidades";

    const delProducto = movimientos.filter((m) => m.id_producto === idElegido);
    campo("detalle-estado").textContent = delProducto.length === 0
      ? "Este producto aún no tiene movimientos."
      : "";

    const cuerpo = campo("cuerpo-detalle");
    cuerpo.replaceChildren();
    for (const { movimiento, saldoCalculado, cuadra } of movimientosConSaldo(delProducto)) {
      const celdaCantidad = document.createElement("td");
      const cantidad = document.createElement("span");
      cantidad.className = movimiento.cantidad > 0 ? "cantidad-positiva" : "cantidad-negativa";
      cantidad.textContent = conSigno(movimiento.cantidad);
      celdaCantidad.append(cantidad);

      const celdaVerificacion = document.createElement("td");
      const insignia = document.createElement("span");
      insignia.className = "insignia " + (cuadra ? "insignia-disponible" : "insignia-agotado");
      insignia.textContent = cuadra ? "Cuadra" : "No cuadra";
      celdaVerificacion.append(insignia);

      const tr = document.createElement("tr");
      tr.className = cuadra ? "" : "fila-alerta";
      tr.append(
        celda(movimiento.fecha_hora
          ? movimiento.fecha_hora.toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" })
          : "…"),
        celda(etiquetaDeTipo(movimiento.tipo_movimiento)),
        celdaCantidad,
        celda(movimiento.saldo_resultante),
        celda(saldoCalculado),
        celdaVerificacion
      );
      cuerpo.append(tr);
    }
  }

  function recalcular() {
    filas = compararBalance(productos, movimientos);
    const resumen = resumirBalance(filas);
    kProductos.valor.textContent = resumen.productos;
    kDiferencias.valor.textContent = resumen.conDiferencia;
    kMovimientos.valor.textContent = movimientos.length;

    const incompleto = movimientos.length >= MAXIMO;
    campo("aviso-limite").textContent = incompleto
      ? "Se analizan los últimos " + MAXIMO + " movimientos: el balance puede estar incompleto."
      : "";
    campo("generar").disabled = incompleto;

    dibujarTabla();
    dibujarDetalle();
  }

  campo("buscar").addEventListener("input", dibujarTabla);
  campo("filtro-resultado").addEventListener("change", dibujarTabla);
  campo("cerrar-detalle").addEventListener("click", () => {
    idElegido = null;
    campo("panel-detalle").hidden = true;
  });

  campo("generar").addEventListener("click", async () => {
    campo("msg-error").textContent = "";
    campo("msg-exito").textContent = "";

    const conDiferencia = filas.filter((fila) => fila.diferencia !== 0);
    if (conDiferencia.length === 0) {
      campo("msg-exito").textContent = "No hay diferencias que reportar.";
      return;
    }

    campo("generar").disabled = true;
    campo("generar").textContent = "Generando...";
    try {
      let creadas = 0;
      for (const fila of conDiferencia) {
        const creada = await generarAlertaDeDiferencia(
          fila.producto, fila.registrado, fila.segunMovimientos
        );
        if (creada) creadas += 1;
      }
      campo("msg-exito").textContent = creadas === 0
        ? "Las diferencias ya tienen una alerta pendiente."
        : "Se generaron " + creadas + (creadas === 1 ? " alerta" : " alertas") + " de diferencia.";
    } catch (error) {
      campo("msg-error").textContent = error.code === "permission-denied"
        ? "No tienes permiso para esta acción."
        : "No se pudieron generar las alertas. Revisa tu conexión.";
    } finally {
      campo("generar").textContent = "Generar alertas de diferencia";
      campo("generar").disabled = movimientos.length >= MAXIMO;
    }
  });

  cancelaciones = [
    escucharProductos(
      (lista) => {
        productos = lista;
        recalcular();
      },
      () => {
        campo("estado-lista").textContent = "No se pudo cargar el balance.";
      }
    ),
    escucharMovimientos(
      (lista) => {
        movimientos = lista;
        recalcular();
      },
      () => {
        campo("estado-lista").textContent = "No se pudieron cargar los movimientos.";
      },
      MAXIMO
    )
  ];

  return crearMarco("Balance", "#/balance", contenido);
}

export function salir() {
  for (const cancelar of cancelaciones) cancelar();
  cancelaciones = [];
}