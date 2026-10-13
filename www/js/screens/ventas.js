import { formatearSoles } from "../domain/inventario.js";
import { validarVenta } from "../domain/ventas.js";
import { crearMarco } from "../marco.js";
import { escucharProductos } from "../services/productos.js";
import { escucharVentas, registrarVenta } from "../services/ventas.js";

let cancelaciones = [];

export function render() {
  const contenido = document.createElement("div");
  contenido.className = "pantalla-ventas";
  contenido.innerHTML = `
    <section class="panel">
      <h2 class="panel-titulo">Registrar venta</h2>
      <form class="formulario" id="form-venta" novalidate>
        <label class="campo">
          Producto
          <select id="producto"></select>
        </label>
        <p class="ayuda" id="ayuda-stock"></p>
        <label class="campo">
          Fecha de la venta
          <input type="date" id="fecha" />
        </label>
        <label class="campo">
          Cantidad
          <input type="number" id="cantidad" step="1" inputmode="numeric" />
        </label>
        <label class="campo">
          Precio de venta (por unidad)
          <input type="number" id="precio" step="0.01" inputmode="decimal" />
        </label>
        <label class="campo">
          Cliente
          <input type="text" id="cliente" />
        </label>
        <label class="campo">
          Tipo de comprobante
          <select id="tipo-comprobante">
            <option value="">Sin comprobante</option>
            <option value="Boleta">Boleta</option>
            <option value="Factura">Factura</option>
          </select>
        </label>
        <label class="campo">
          Número de comprobante
          <input type="text" id="numero-comprobante" />
        </label>
        <label class="campo">
          Observaciones
          <input type="text" id="observaciones" />
        </label>
        <p class="mensaje-error" id="mensaje-error"></p>
        <p class="mensaje-exito" id="mensaje-exito"></p>
        <button class="boton" type="submit" id="boton-guardar">Registrar venta</button>
      </form>
    </section>

    <section class="panel">
      <h2 class="panel-titulo">Ventas recientes</h2>
      <p id="estado-lista">Cargando...</p>
      <div class="tabla-contenedor">
        <table class="tabla">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Producto</th>
              <th>Cliente</th>
              <th>Cantidad</th>
              <th>Precio</th>
              <th>Total</th>
              <th>Comprobante</th>
            </tr>
          </thead>
          <tbody id="cuerpo-tabla"></tbody>
        </table>
      </div>
    </section>
  `;

  const campo = (id) => contenido.querySelector("#" + id);
  const formulario = campo("form-venta");
  const mensajeError = campo("mensaje-error");
  const mensajeExito = campo("mensaje-exito");
  const botonGuardar = campo("boton-guardar");
  const estadoLista = campo("estado-lista");
  const cuerpoTabla = campo("cuerpo-tabla");

  let productos = [];
  let ventas = [];

  function hoy() {
    return new Date().toLocaleDateString("sv-SE");
  }

  function productoElegido() {
    return productos.find((p) => p.id_producto === campo("producto").value);
  }

  function actualizarAyuda() {
    const producto = productoElegido();
    campo("ayuda-stock").textContent = producto
      ? "Stock disponible: " + producto.stock
      : "";
  }

  function llenarProductos() {
    const elegido = campo("producto").value;
    const opciones = [new Option("Selecciona...", "")];
    for (const producto of productos.filter((p) => p.estado !== "inactivo")) {
      opciones.push(new Option(
        producto.nombre + " (" + producto.codigo + ") — stock " + producto.stock,
        producto.id_producto
      ));
    }
    campo("producto").replaceChildren(...opciones);
    campo("producto").value = elegido;
    actualizarAyuda();
  }

  function dibujarTabla() {
    const porProducto = new Map(productos.map((p) => [p.id_producto, p]));

    cuerpoTabla.replaceChildren();
    estadoLista.textContent = ventas.length === 0 ? "Aún no hay ventas registradas." : "";

    for (const venta of ventas) {
      const producto = porProducto.get(venta.id_producto);
      const valores = [
        venta.fecha ? venta.fecha.toDate().toLocaleDateString("es-PE") : "",
        producto ? producto.nombre : "—",
        venta.cliente || "—",
        venta.cantidad,
        formatearSoles(venta.precio),
        formatearSoles(venta.cantidad * venta.precio),
        venta.tipo_comprobante
          ? venta.tipo_comprobante + " " + venta.numero_comprobante
          : "Sin comprobante"
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

  campo("producto").addEventListener("change", () => {
    const producto = productoElegido();
    if (producto) campo("precio").value = producto.precio_venta;
    actualizarAyuda();
  });

  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    mensajeError.textContent = "";
    mensajeExito.textContent = "";

    const datos = {
      id_producto: campo("producto").value,
      fecha: campo("fecha").value,
      cantidad: Number(campo("cantidad").value),
      precio: Number(campo("precio").value),
      cliente: campo("cliente").value.trim(),
      tipo_comprobante: campo("tipo-comprobante").value,
      numero_comprobante: campo("numero-comprobante").value.trim(),
      observaciones: campo("observaciones").value.trim()
    };

    const problema = validarVenta(datos, productoElegido());
    if (problema) {
      mensajeError.textContent = problema;
      return;
    }

    botonGuardar.disabled = true;
    botonGuardar.textContent = "Guardando...";
    try {
      await registrarVenta({
        id_producto: datos.id_producto,
        fecha: new Date(datos.fecha + "T00:00:00"),
        cantidad: datos.cantidad,
        precio: datos.precio,
        cliente: datos.cliente,
        tipo_comprobante: datos.tipo_comprobante,
        numero_comprobante: datos.numero_comprobante,
        observaciones: datos.observaciones
      });
      formulario.reset();
      campo("fecha").value = hoy();
      actualizarAyuda();
      mensajeExito.textContent = "Venta registrada. El stock se actualizó.";
    } catch (error) {
      if (error.code === "permission-denied") {
        mensajeError.textContent = "No tienes permiso para esta acción.";
      } else if (error.message === "Stock insuficiente") {
        mensajeError.textContent = "El stock cambió y ya no alcanza. Revisa la cantidad.";
      } else {
        mensajeError.textContent = "No se pudo registrar la venta. Revisa tu conexión.";
      }
    } finally {
      botonGuardar.disabled = false;
      botonGuardar.textContent = "Registrar venta";
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
    escucharVentas(
      (lista) => {
        ventas = lista;
        dibujarTabla();
      },
      () => {
        estadoLista.textContent = "No se pudo cargar la lista de ventas.";
      }
    )
  ];

  return crearMarco("Ventas", "#/ventas", contenido);
}

export function salir() {
  for (const cancelar of cancelaciones) cancelar();
  cancelaciones = [];
}