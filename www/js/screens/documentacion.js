import {
  PORCENTAJE_LIMITE, estadoDeSaldo, resumirDocumentacion, validarUso
} from "../domain/documentacion.js";
import { crearMarco, icono } from "../marco.js";
import { escucharCompras, registrarUsoDocumentacion } from "../services/compras.js";
import { escucharDocumentos } from "../services/documentos.js";
import { escucharProductos } from "../services/productos.js";
import { escucharProveedores } from "../services/proveedores.js";

const ETIQUETAS = {
  disponible: "Disponible",
  proximo: "Próximo a agotarse",
  agotado: "Agotado",
  "sin-documento": "Sin documento"
};
const CLASES = {
  disponible: "insignia-disponible",
  proximo: "insignia-bajo",
  agotado: "insignia-agotado",
  "sin-documento": "insignia-otro"
};

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

export function render() {
  const contenido = document.createElement("div");
  contenido.className = "pantalla-documentacion";
  contenido.innerHTML = `
    <section class="tarjetas" id="tarjetas"></section>

    <section class="panel">
      <h2 class="panel-titulo">Control documentario</h2>
      <p class="ayuda" id="regla"></p>
      <div class="herramientas">
        <label class="campo">
          Buscar
          <input type="search" id="buscar" placeholder="Documento o producto" />
        </label>
        <label class="campo">
          Estado del saldo
          <select id="filtro-estado">
            <option value="">Todos</option>
            <option value="disponible">Disponible</option>
            <option value="proximo">Próximo a agotarse</option>
            <option value="agotado">Agotado</option>
            <option value="sin-documento">Sin documento</option>
          </select>
        </label>
      </div>
      <p id="estado-lista">Cargando...</p>
      <div class="tabla-contenedor">
        <table class="tabla">
          <thead>
            <tr>
              <th>Documento</th>
              <th>Fecha</th>
              <th>Producto</th>
              <th>Proveedor</th>
              <th>Comprada</th>
              <th>Documentada</th>
              <th>Utilizada</th>
              <th>Saldo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="cuerpo-tabla"></tbody>
        </table>
      </div>
    </section>

    <section class="panel" id="panel-uso" hidden>
      <h2 class="panel-titulo">Registrar uso de documentación</h2>
      <p class="ayuda" id="uso-info"></p>
      <form class="formulario" id="form-uso" novalidate>
        <label class="campo">
          Cantidad utilizada
          <input type="number" id="uso-cantidad" step="1" inputmode="numeric" />
        </label>
        <p class="mensaje-error" id="uso-error"></p>
        <p class="mensaje-exito" id="uso-exito"></p>
        <button class="boton" type="submit" id="uso-guardar">Registrar uso</button>
        <button class="boton boton-secundario" type="button" id="uso-cerrar">Cerrar</button>
      </form>
    </section>
  `;

  const campo = (id) => contenido.querySelector("#" + id);

  const kSaldo = crearTarjeta("Saldo documentado", "documentos", "acento", "Disponible según los documentos");
  const kUtilizadas = crearTarjeta("Unidades utilizadas", "balance", "exito", "Registradas como utilizadas");
  const kPorAgotarse = crearTarjeta("Saldos por agotarse", "triangulo", "aviso", "Al límite o en cero");
  campo("tarjetas").append(...[kSaldo, kUtilizadas, kPorAgotarse].map((t) => t.elemento));

  campo("regla").textContent = "Se genera una alerta cuando el saldo llega al " +
    PORCENTAJE_LIMITE + " % de lo documentado o menos.";

  let compras = [];
  let documentos = [];
  let productos = [];
  let proveedores = [];
  let compraElegida = null;

  const celda = (valor) => {
    const td = document.createElement("td");
    td.textContent = valor;
    return td;
  };

  function nombreDelProducto(compra) {
    const producto = productos.find((p) => p.id_producto === compra.id_producto);
    return producto ? producto.nombre : "—";
  }

  function actualizarPanelUso() {
    if (!compraElegida) return;
    const actual = compras.find((c) => c.id_compra === compraElegida.id_compra);
    if (!actual) {
      campo("panel-uso").hidden = true;
      compraElegida = null;
      return;
    }
    compraElegida = actual;
    const documento = documentos.find((d) => d.id_documento === actual.id_documento);
    campo("uso-info").textContent = nombreDelProducto(actual) +
      " · Documento " + (documento ? documento.tipo + " " + documento.numero : "—") +
      " · Documentada " + actual.cantidad_documentada +
      " · Utilizada " + actual.cantidad_utilizada +
      " · Saldo " + actual.saldo_documentado;
    campo("uso-guardar").disabled = actual.saldo_documentado <= 0;
  }

  function mostrarUso(compra) {
    compraElegida = compra;
    campo("panel-uso").hidden = false;
    campo("form-uso").reset();
    campo("uso-error").textContent = "";
    campo("uso-exito").textContent = "";
    actualizarPanelUso();
    campo("panel-uso").scrollIntoView();
  }

  function dibujarTabla() {
    const porDocumento = new Map(documentos.map((d) => [d.id_documento, d]));
    const porProveedor = new Map(proveedores.map((p) => [p.id_proveedor, p]));
    const texto = campo("buscar").value.trim().toLowerCase();
    const estadoElegido = campo("filtro-estado").value;

    const filtradas = compras.filter((compra) => {
      const documento = porDocumento.get(compra.id_documento);
      const descripcion = (documento ? documento.tipo + " " + documento.numero : "") +
        " " + nombreDelProducto(compra);
      return descripcion.toLowerCase().includes(texto) &&
        (estadoElegido === "" || estadoDeSaldo(compra) === estadoElegido);
    });

    const cuerpo = campo("cuerpo-tabla");
    cuerpo.replaceChildren();
    if (compras.length === 0) {
      campo("estado-lista").textContent = "Aún no hay compras registradas.";
    } else if (filtradas.length === 0) {
      campo("estado-lista").textContent = "Ninguna compra coincide con los filtros.";
    } else {
      campo("estado-lista").textContent = "";
    }

    for (const compra of filtradas) {
      const documento = porDocumento.get(compra.id_documento);
      const proveedor = porProveedor.get(compra.id_proveedor);
      const estado = estadoDeSaldo(compra);

      const celdaEstado = document.createElement("td");
      const insignia = document.createElement("span");
      insignia.className = "insignia " + CLASES[estado];
      insignia.textContent = ETIQUETAS[estado];
      celdaEstado.append(insignia);

      const celdaAccion = document.createElement("td");
      if (estado !== "sin-documento" && compra.saldo_documentado > 0) {
        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = "boton boton-secundario";
        boton.textContent = "Registrar uso";
        boton.addEventListener("click", () => mostrarUso(compra));
        celdaAccion.append(boton);
      }

      const fila = document.createElement("tr");
      fila.append(
        celda(documento ? documento.tipo + " " + documento.numero : "Sin documento"),
        celda(compra.fecha ? compra.fecha.toDate().toLocaleDateString("es-PE") : ""),
        celda(nombreDelProducto(compra)),
        celda(proveedor ? proveedor.nombre : "—"),
        celda(compra.cantidad),
        celda(compra.cantidad_documentada),
        celda(compra.cantidad_utilizada),
        celda(compra.saldo_documentado),
        celdaEstado,
        celdaAccion
      );
      cuerpo.append(fila);
    }
  }

  function actualizarTarjetas() {
    const resumen = resumirDocumentacion(compras);
    kSaldo.valor.textContent = resumen.saldoTotal.toLocaleString("es-PE");
    kUtilizadas.valor.textContent = resumen.utilizadas.toLocaleString("es-PE");
    kPorAgotarse.valor.textContent = resumen.porAgotarse;
  }

  function refrescar() {
    actualizarTarjetas();
    dibujarTabla();
    actualizarPanelUso();
  }

  campo("buscar").addEventListener("input", dibujarTabla);
  campo("filtro-estado").addEventListener("change", dibujarTabla);
  campo("uso-cerrar").addEventListener("click", () => {
    campo("panel-uso").hidden = true;
    compraElegida = null;
  });

  campo("form-uso").addEventListener("submit", async (evento) => {
    evento.preventDefault();
    campo("uso-error").textContent = "";
    campo("uso-exito").textContent = "";

    const cantidad = Number(campo("uso-cantidad").value);
    const problema = validarUso(cantidad, compraElegida);
    if (problema) {
      campo("uso-error").textContent = problema;
      return;
    }

    campo("uso-guardar").disabled = true;
    campo("uso-guardar").textContent = "Guardando...";
    try {
      await registrarUsoDocumentacion(compraElegida.id_compra, cantidad);
      campo("form-uso").reset();
      campo("uso-exito").textContent = "Uso registrado. El saldo se actualizó.";
    } catch (error) {
      if (error.code === "permission-denied") {
        campo("uso-error").textContent = "No tienes permiso para esta acción.";
      } else if (error.message === "Saldo insuficiente") {
        campo("uso-error").textContent = "El saldo cambió y ya no alcanza. Revisa la cantidad.";
      } else {
        campo("uso-error").textContent = "No se pudo registrar el uso. Revisa tu conexión.";
      }
    } finally {
      campo("uso-guardar").textContent = "Registrar uso";
      actualizarPanelUso();
    }
  });

  cancelaciones = [
    escucharCompras(
      (lista) => {
        compras = lista;
        refrescar();
      },
      () => {
        campo("estado-lista").textContent = "No se pudo cargar el control documentario.";
      },
      200
    ),
    escucharDocumentos(
      (lista) => {
        documentos = lista;
        refrescar();
      },
      () => {}
    ),
    escucharProductos(
      (lista) => {
        productos = lista;
        refrescar();
      },
      () => {}
    ),
    escucharProveedores(
      (lista) => {
        proveedores = lista;
        refrescar();
      },
      () => {}
    )
  ];

  return crearMarco("Documentación", "#/documentacion", contenido);
}

export function salir() {
  for (const cancelar of cancelaciones) cancelar();
  cancelaciones = [];
}