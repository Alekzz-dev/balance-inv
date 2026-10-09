import { formatearSoles } from "../domain/inventario.js";
import { validarCompra } from "../domain/compras.js";
import { crearMarco } from "../marco.js";
import { escucharCompras, registrarCompra } from "../services/compras.js";
import { escucharDocumentos } from "../services/documentos.js";
import { escucharProductos } from "../services/productos.js";
import { escucharProveedores } from "../services/proveedores.js";

let cancelaciones = [];

export function render() {
  const contenido = document.createElement("div");
  contenido.className = "pantalla-compras";
  contenido.innerHTML = `
    <section class="panel">
      <h2 class="panel-titulo">Registrar compra</h2>
      <form class="formulario" id="form-compra" novalidate>
        <label class="campo">
          Producto
          <select id="producto"></select>
        </label>
        <label class="campo">
          Proveedor
          <select id="proveedor"></select>
        </label>
        <div class="grupo-campos" id="datos-proveedor" hidden>
          <label class="campo">
            Nombre del proveedor
            <input type="text" id="proveedor-nombre" />
          </label>
          <label class="campo">
            RUC
            <input type="text" id="proveedor-ruc" inputmode="numeric" maxlength="11" />
          </label>
        </div>
        <label class="campo">
          Fecha de la compra
          <input type="date" id="fecha" />
        </label>
        <label class="campo">
          Cantidad
          <input type="number" id="cantidad" step="1" inputmode="numeric" />
        </label>
        <label class="campo">
          Precio de compra (por unidad)
          <input type="number" id="precio" step="0.01" inputmode="decimal" />
        </label>
        <label class="campo">
          Tipo de documento
          <input type="text" id="tipo-documento" />
        </label>
        <label class="campo">
          Número de documento
          <input type="text" id="numero-documento" />
        </label>
        <label class="campo">
          Cantidad documentada
          <input type="number" id="cantidad-documentada" step="1" inputmode="numeric" />
        </label>
        <label class="campo">
          Información adicional
          <input type="text" id="info-adicional" />
        </label>
        <p class="mensaje-error" id="mensaje-error"></p>
        <p class="mensaje-exito" id="mensaje-exito"></p>
        <button class="boton" type="submit" id="boton-guardar">Registrar compra</button>
      </form>
    </section>

    <section class="panel">
      <h2 class="panel-titulo">Compras recientes</h2>
      <p id="estado-lista">Cargando...</p>
      <div class="tabla-contenedor">
        <table class="tabla">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Producto</th>
              <th>Proveedor</th>
              <th>Cantidad</th>
              <th>Precio</th>
              <th>Documento</th>
              <th>Saldo documentado</th>
            </tr>
          </thead>
          <tbody id="cuerpo-tabla"></tbody>
        </table>
      </div>
    </section>
  `;

  const campo = (id) => contenido.querySelector("#" + id);
  const formulario = campo("form-compra");
  const mensajeError = campo("mensaje-error");
  const mensajeExito = campo("mensaje-exito");
  const botonGuardar = campo("boton-guardar");
  const estadoLista = campo("estado-lista");
  const cuerpoTabla = campo("cuerpo-tabla");

  let productos = [];
  let proveedores = [];
  let documentos = [];
  let compras = [];

  function hoy() {
    return new Date().toLocaleDateString("sv-SE");
  }

  function llenarProductos() {
    const elegido = campo("producto").value;
    const opciones = [new Option("Selecciona...", "")];
    for (const producto of productos.filter((p) => p.estado !== "inactivo")) {
      opciones.push(new Option(producto.nombre + " (" + producto.codigo + ")", producto.id_producto));
    }
    campo("producto").replaceChildren(...opciones);
    campo("producto").value = elegido;
  }

  function llenarProveedores() {
    const elegido = campo("proveedor").value;
    const opciones = [new Option("Selecciona...", "")];
    for (const proveedor of proveedores) {
      opciones.push(new Option(proveedor.nombre + " — RUC " + proveedor.ruc, proveedor.id_proveedor));
    }
    opciones.push(new Option("+ Nuevo proveedor", "nuevo"));
    campo("proveedor").replaceChildren(...opciones);
    campo("proveedor").value = elegido;
  }

  function dibujarTabla() {
    const porProducto = new Map(productos.map((p) => [p.id_producto, p]));
    const porProveedor = new Map(proveedores.map((p) => [p.id_proveedor, p]));
    const porDocumento = new Map(documentos.map((d) => [d.id_documento, d]));

    cuerpoTabla.replaceChildren();
    estadoLista.textContent = compras.length === 0 ? "Aún no hay compras registradas." : "";

    for (const compra of compras) {
      const producto = porProducto.get(compra.id_producto);
      const proveedor = porProveedor.get(compra.id_proveedor);
      const documento = porDocumento.get(compra.id_documento);
      const valores = [
        compra.fecha ? compra.fecha.toDate().toLocaleDateString("es-PE") : "",
        producto ? producto.nombre : "—",
        proveedor ? proveedor.nombre : "—",
        compra.cantidad,
        formatearSoles(compra.precio),
        documento ? documento.tipo + " " + documento.numero : "Sin documento",
        compra.saldo_documentado
      ];
      const fila = document.createElement("tr");
      for (const valor of valores) {
        const celda = document.createElement("td");
        celda.textContent = valor;
        fila.append(celda);
      }
      cuerpoTabla.append(fila);
    }
  }

  campo("fecha").value = hoy();

  campo("proveedor").addEventListener("change", () => {
    campo("datos-proveedor").hidden = campo("proveedor").value !== "nuevo";
  });

  campo("producto").addEventListener("change", () => {
    const producto = productos.find((p) => p.id_producto === campo("producto").value);
    if (producto && !campo("precio").value) campo("precio").value = producto.precio_compra;
  });

  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    mensajeError.textContent = "";
    mensajeExito.textContent = "";

    const datos = {
      id_producto: campo("producto").value,
      id_proveedor: campo("proveedor").value,
      proveedor_nombre: campo("proveedor-nombre").value.trim(),
      proveedor_ruc: campo("proveedor-ruc").value.trim(),
      fecha: campo("fecha").value,
      cantidad: Number(campo("cantidad").value),
      precio: Number(campo("precio").value),
      tipo_documento: campo("tipo-documento").value.trim(),
      numero_documento: campo("numero-documento").value.trim(),
      cantidad_documentada: Number(campo("cantidad-documentada").value),
      info_adicional: campo("info-adicional").value.trim()
    };

    const producto = productos.find((p) => p.id_producto === datos.id_producto);
    const problema = validarCompra(datos, producto?.categoria);
    if (problema) {
      mensajeError.textContent = problema;
      return;
    }

    const esNuevo = datos.id_proveedor === "nuevo";
    if (esNuevo && proveedores.some((p) => p.ruc === datos.proveedor_ruc)) {
      mensajeError.textContent = "Ya existe un proveedor con ese RUC. Selecciónalo en la lista.";
      return;
    }

    const hayDocumento = datos.tipo_documento !== "";
    const fecha = new Date(datos.fecha + "T00:00:00");

    botonGuardar.disabled = true;
    botonGuardar.textContent = "Guardando...";
    try {
      await registrarCompra({
        compra: {
          id_producto: datos.id_producto,
          id_proveedor: esNuevo ? null : datos.id_proveedor,
          fecha,
          cantidad: datos.cantidad,
          precio: datos.precio,
          info_adicional: datos.info_adicional,
          cantidad_documentada: hayDocumento ? datos.cantidad_documentada : 0
        },
        proveedorNuevo: esNuevo
          ? { nombre: datos.proveedor_nombre, ruc: datos.proveedor_ruc }
          : null,
        documento: hayDocumento
          ? { tipo: datos.tipo_documento, numero: datos.numero_documento, fecha, informacion: "" }
          : null
      });
      formulario.reset();
      campo("fecha").value = hoy();
      campo("datos-proveedor").hidden = true;
      mensajeExito.textContent = "Compra registrada. El stock se actualizó.";
    } catch (error) {
      mensajeError.textContent = error.code === "permission-denied"
        ? "No tienes permiso para esta acción."
        : "No se pudo registrar la compra. Revisa tu conexión.";
    } finally {
      botonGuardar.disabled = false;
      botonGuardar.textContent = "Registrar compra";
    }
  });

  cancelaciones = [
    escucharProductos(
      (lista) => {
        productos = lista;
        llenarProductos();
        dibujarTabla();
      },
      () => {
        mensajeError.textContent = "No se pudieron cargar los productos.";
      }
    ),
    escucharProveedores(
      (lista) => {
        proveedores = lista;
        llenarProveedores();
        dibujarTabla();
      },
      () => {
        mensajeError.textContent = "No se pudieron cargar los proveedores.";
      }
    ),
    escucharDocumentos(
      (lista) => {
        documentos = lista;
        dibujarTabla();
      },
      () => {}
    ),
    escucharCompras(
      (lista) => {
        compras = lista;
        dibujarTabla();
      },
      () => {
        estadoLista.textContent = "No se pudo cargar la lista de compras.";
      }
    )
  ];

  return crearMarco("Compras", "#/compras", contenido);
}

export function salir() {
  for (const cancelar of cancelaciones) cancelar();
  cancelaciones = [];
}