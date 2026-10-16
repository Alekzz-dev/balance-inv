import { etiquetaDeTipo, filtrarMovimientos, resumirMovimientos }
  from "../domain/historial.js";
import { formatearSoles } from "../domain/inventario.js";
import { crearMarco } from "../marco.js";
import { escucharMovimientos, obtenerOrigen } from "../services/movimientos.js";
import { escucharProductos } from "../services/productos.js";
import { escucharUsuarios } from "../services/usuarios.js";

const PASO = 50;

let cancelaciones = [];

function lineasDeOrigen(origen, producto) {
  const fecha = (valor) => (valor ? valor.toDate().toLocaleDateString("es-PE") : "—");
  const nombreProducto = producto ? producto.nombre : "—";

  if (origen.tipo === "venta") {
    const venta = origen.venta;
    return [
      ["Fecha de la venta", fecha(venta.fecha)],
      ["Producto", nombreProducto],
      ["Cantidad", venta.cantidad],
      ["Precio de venta", formatearSoles(venta.precio)],
      ["Total", formatearSoles(venta.cantidad * venta.precio)],
      ["Cliente", venta.cliente || "—"],
      ["Comprobante", venta.tipo_comprobante
        ? venta.tipo_comprobante + " " + venta.numero_comprobante
        : "Sin comprobante"],
      ["Observaciones", venta.observaciones || "—"]
    ];
  }

  const compra = origen.compra;
  return [
    ["Fecha de la compra", fecha(compra.fecha)],
    ["Producto", nombreProducto],
    ["Proveedor", origen.proveedor
      ? origen.proveedor.nombre + " (RUC " + origen.proveedor.ruc + ")"
      : "—"],
    ["Cantidad", compra.cantidad],
    ["Precio de compra", formatearSoles(compra.precio)],
    ["Total", formatearSoles(compra.cantidad * compra.precio)],
    ["Documento", origen.documento
      ? origen.documento.tipo + " " + origen.documento.numero
      : "Sin documento"],
    ["Cantidad documentada", compra.cantidad_documentada],
    ["Saldo documentado", compra.saldo_documentado],
    ["Información adicional", compra.info_adicional || "—"]
  ];
}

export function render() {
  const contenido = document.createElement("div");
  contenido.className = "pantalla-historial";
  contenido.innerHTML = `
    <section class="panel">
      <h2 class="panel-titulo">Historial de movimientos</h2>
      <div class="herramientas">
        <label class="campo">
          Producto
          <select id="filtro-producto"></select>
        </label>
        <label class="campo">
          Tipo
          <select id="filtro-tipo"></select>
        </label>
        <label class="campo">
          Desde
          <input type="date" id="filtro-desde" />
        </label>
        <label class="campo">
          Hasta
          <input type="date" id="filtro-hasta" />
        </label>
        <button class="boton boton-secundario" type="button" id="limpiar">Limpiar filtros</button>
      </div>
      <p class="ayuda" id="resumen"></p>
      <p id="estado-lista">Cargando...</p>
      <div class="tabla-contenedor">
        <table class="tabla">
          <thead>
            <tr>
              <th>Fecha y hora</th>
              <th>Tipo</th>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Saldo resultante</th>
              <th>Responsable</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="cuerpo-tabla"></tbody>
        </table>
      </div>
      <div class="pie-tabla">
        <span id="conteo"></span>
        <button class="boton boton-secundario" type="button" id="mas" hidden>Mostrar más</button>
      </div>
    </section>

    <section class="panel" id="detalle" hidden>
      <div class="panel-cabecera">
        <h2 class="panel-titulo" id="detalle-titulo"></h2>
        <button class="boton boton-secundario" type="button" id="cerrar-detalle">Cerrar</button>
      </div>
      <p id="detalle-estado"></p>
      <dl class="detalle" id="detalle-lista"></dl>
    </section>
  `;

  const campo = (id) => contenido.querySelector("#" + id);

  let movimientos = [];
  let productos = [];
  let usuarios = [];
  let visibles = PASO;

  const celda = (valor) => {
    const td = document.createElement("td");
    td.textContent = valor;
    return td;
  };

  function llenarProductos() {
    const elegido = campo("filtro-producto").value;
    const opciones = [new Option("Todos", "")];
    for (const producto of productos) {
      opciones.push(new Option(producto.nombre + " (" + producto.codigo + ")", producto.id_producto));
    }
    campo("filtro-producto").replaceChildren(...opciones);
    campo("filtro-producto").value = elegido;
  }

  function llenarTipos() {
    const elegido = campo("filtro-tipo").value;
    const tipos = [...new Set(movimientos.map((m) => m.tipo_movimiento))];
    const opciones = [new Option("Todos", "")];
    for (const tipo of tipos) {
      opciones.push(new Option(etiquetaDeTipo(tipo), tipo));
    }
    campo("filtro-tipo").replaceChildren(...opciones);
    campo("filtro-tipo").value = elegido;
  }

  function leerFiltros() {
    const desde = campo("filtro-desde").value;
    const hasta = campo("filtro-hasta").value;
    let hastaExclusivo = null;
    if (hasta) {
      hastaExclusivo = new Date(hasta + "T00:00:00");
      hastaExclusivo.setDate(hastaExclusivo.getDate() + 1);
    }
    return {
      idProducto: campo("filtro-producto").value,
      tipo: campo("filtro-tipo").value,
      desde: desde ? new Date(desde + "T00:00:00") : null,
      hasta: hastaExclusivo
    };
  }

  function dibujarTabla() {
    const porProducto = new Map(productos.map((p) => [p.id_producto, p]));
    const porUsuario = new Map(usuarios.map((u) => [u.id_usuario, u]));
    const filtrados = filtrarMovimientos(movimientos, leerFiltros());
    const resumen = resumirMovimientos(filtrados);

    campo("resumen").textContent = "Entradas: +" + resumen.entradas +
      " · Salidas: −" + resumen.salidas +
      " · Neto: " + (resumen.neto > 0 ? "+" : "") + resumen.neto + " unidades";

    const cuerpo = campo("cuerpo-tabla");
    cuerpo.replaceChildren();
    if (movimientos.length === 0) {
      campo("estado-lista").textContent = "Aún no hay movimientos registrados.";
    } else if (filtrados.length === 0) {
      campo("estado-lista").textContent = "Ningún movimiento coincide con los filtros.";
    } else {
      campo("estado-lista").textContent = "";
    }
    campo("conteo").textContent = filtrados.length === 0
      ? ""
      : "Mostrando " + Math.min(visibles, filtrados.length) + " de " + filtrados.length + " movimientos";
    campo("mas").hidden = filtrados.length <= visibles;

    for (const movimiento of filtrados.slice(0, visibles)) {
      const producto = porProducto.get(movimiento.id_producto);
      const usuario = porUsuario.get(movimiento.id_usuario);
      const fila = document.createElement("tr");

      const celdaTipo = document.createElement("td");
      const insignia = document.createElement("span");
      const claseTipo = movimiento.tipo_movimiento === "compra" || movimiento.tipo_movimiento === "venta"
        ? movimiento.tipo_movimiento
        : "otro";
      insignia.className = "insignia insignia-" + claseTipo;
      insignia.textContent = etiquetaDeTipo(movimiento.tipo_movimiento);
      celdaTipo.append(insignia);

      const celdaCantidad = document.createElement("td");
      const cantidad = document.createElement("span");
      cantidad.className = movimiento.cantidad > 0 ? "cantidad-positiva" : "cantidad-negativa";
      cantidad.textContent = (movimiento.cantidad > 0 ? "+" : "") + movimiento.cantidad;
      celdaCantidad.append(cantidad);

      const celdaAccion = document.createElement("td");
      const botonOrigen = document.createElement("button");
      botonOrigen.type = "button";
      botonOrigen.className = "boton boton-secundario";
      botonOrigen.textContent = "Ver origen";
      botonOrigen.addEventListener("click", () => mostrarDetalle(movimiento, producto));
      celdaAccion.append(botonOrigen);

      fila.append(
        celda(movimiento.fecha_hora
          ? movimiento.fecha_hora.toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" })
          : "…"),
        celdaTipo,
        celda(producto ? producto.nombre : "—"),
        celdaCantidad,
        celda(movimiento.saldo_resultante),
        celda(usuario ? usuario.nombre : "—"),
        celdaAccion
      );
      cuerpo.append(fila);
    }
  }

  async function mostrarDetalle(movimiento, producto) {
    campo("detalle").hidden = false;
    campo("detalle-titulo").textContent = "Origen: " + etiquetaDeTipo(movimiento.origen_tipo);
    campo("detalle-estado").textContent = "Cargando...";
    campo("detalle-lista").replaceChildren();
    campo("detalle").scrollIntoView();

    try {
      const origen = await obtenerOrigen(movimiento.origen_tipo, movimiento.origen_id);
      if (!origen) {
        campo("detalle-estado").textContent = "No se encontró el registro de origen.";
        return;
      }
      campo("detalle-estado").textContent = "";
      for (const [etiqueta, valor] of lineasDeOrigen(origen, producto)) {
        const termino = document.createElement("dt");
        termino.textContent = etiqueta;
        const descripcion = document.createElement("dd");
        descripcion.textContent = valor;
        campo("detalle-lista").append(termino, descripcion);
      }
    } catch (error) {
      campo("detalle-estado").textContent = "No se pudo cargar el origen.";
    }
  }

  for (const id of ["filtro-producto", "filtro-tipo", "filtro-desde", "filtro-hasta"]) {
    campo(id).addEventListener("change", () => {
      visibles = PASO;
      dibujarTabla();
    });
  }

  campo("limpiar").addEventListener("click", () => {
    campo("filtro-producto").value = "";
    campo("filtro-tipo").value = "";
    campo("filtro-desde").value = "";
    campo("filtro-hasta").value = "";
    visibles = PASO;
    dibujarTabla();
  });

  campo("mas").addEventListener("click", () => {
    visibles += PASO;
    dibujarTabla();
  });

  campo("cerrar-detalle").addEventListener("click", () => {
    campo("detalle").hidden = true;
  });

  cancelaciones = [
    escucharMovimientos(
      (lista) => {
        movimientos = lista;
        llenarTipos();
        dibujarTabla();
      },
      () => {
        campo("estado-lista").textContent = "No se pudo cargar el historial.";
      }
    ),
    escucharProductos(
      (lista) => {
        productos = lista;
        llenarProductos();
        dibujarTabla();
      },
      () => {}
    ),
    escucharUsuarios(
      (lista) => {
        usuarios = lista;
        dibujarTabla();
      },
      () => {}
    )
  ];

  return crearMarco("Historial", "#/historial", contenido);
}

export function salir() {
  for (const cancelar of cancelaciones) cancelar();
  cancelaciones = [];
}