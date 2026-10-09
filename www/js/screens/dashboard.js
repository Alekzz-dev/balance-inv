import { estadoDeStock, formatearSoles, resumirInventario, totalVentas }
  from "../domain/inventario.js";
import { crearDonut } from "../graficos.js";
import { crearMarco, icono } from "../marco.js";
import { escucharAlertasPendientes } from "../services/alertas.js";
import { escucharProductos } from "../services/productos.js";
import { escucharVentasDelDia } from "../services/ventas.js";

const MAX_FILAS = 8;
const ETIQUETAS = { disponible: "Disponible", bajo: "Stock bajo", agotado: "Agotado" };

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
  contenido.className = "dashboard";
  contenido.innerHTML = `
    <section class="tarjetas" id="tarjetas"></section>

    <section class="fila-dos">
      <article class="panel">
        <h2 class="panel-titulo">Estado del inventario</h2>
        <div class="inventario">
          <div class="donut-caja" id="donut-caja"></div>
          <ul class="leyenda" id="leyenda"></ul>
        </div>
      </article>

      <article class="panel">
        <h2 class="panel-titulo">Alertas de inventario</h2>
        <p id="estado-alertas">Cargando...</p>
        <ul class="lista-alertas" id="lista-alertas"></ul>
      </article>
    </section>

    <section class="panel">
      <h2 class="panel-titulo">Productos</h2>
      <div class="herramientas">
        <label class="campo">
          Buscar
          <input type="search" id="buscar" placeholder="Código o nombre" />
        </label>
        <label class="campo">
          Categoría
          <select id="filtro-categoria">
            <option value="">Todas</option>
            <option value="Nacional">Nacional</option>
            <option value="Importado">Importado</option>
          </select>
        </label>
        <label class="campo">
          Estado
          <select id="filtro-estado">
            <option value="">Todos</option>
            <option value="disponible">Disponible</option>
            <option value="bajo">Stock bajo</option>
            <option value="agotado">Agotado</option>
          </select>
        </label>
      </div>
      <p id="estado-lista">Cargando...</p>
      <div class="tabla-contenedor">
        <table class="tabla">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="cuerpo-tabla"></tbody>
        </table>
      </div>
      <div class="pie-tabla">
        <span id="resumen-tabla"></span>
        <a href="#/productos">Ver todos los productos</a>
      </div>
    </section>
  `;

  const kProductos = crearTarjeta("Productos registrados", "producto", "acento", "Total en el catálogo");
  const kImportados = crearTarjeta("Productos importados", "compras", "acento", "Categoría Importado");
  const kNacionales = crearTarjeta("Productos nacionales", "inventario", "acento", "Categoría Nacional");
  const kVentas = crearTarjeta("Ventas del día", "ventas", "exito", "Total vendido hoy");
  const kBajo = crearTarjeta("Productos con stock bajo", "triangulo", "aviso", "En el mínimo o por debajo");
  const kAlertas = crearTarjeta("Alertas pendientes", "alertas", "peligro", "Requieren revisión");
  contenido.querySelector("#tarjetas").append(
    ...[kProductos, kImportados, kNacionales, kVentas, kBajo, kAlertas].map((t) => t.elemento)
  );

  const donutCaja = contenido.querySelector("#donut-caja");
  const leyenda = contenido.querySelector("#leyenda");
  const estadoAlertas = contenido.querySelector("#estado-alertas");
  const listaAlertas = contenido.querySelector("#lista-alertas");
  const campoBuscar = contenido.querySelector("#buscar");
  const filtroCategoria = contenido.querySelector("#filtro-categoria");
  const filtroEstado = contenido.querySelector("#filtro-estado");
  const estadoLista = contenido.querySelector("#estado-lista");
  const cuerpoTabla = contenido.querySelector("#cuerpo-tabla");
  const resumenTabla = contenido.querySelector("#resumen-tabla");

  let productos = [];

  function dibujarInventario(resumen) {
    const segmentos = [
      { etiqueta: "Disponible", valor: resumen.disponible, color: "var(--exito)" },
      { etiqueta: "Stock bajo", valor: resumen.bajo, color: "var(--aviso)" },
      { etiqueta: "Agotado", valor: resumen.agotado, color: "var(--peligro)" }
    ];

    donutCaja.replaceChildren(crearDonut(segmentos, resumen.total));
    const centro = document.createElement("div");
    centro.className = "donut-centro";
    const numero = document.createElement("strong");
    numero.textContent = resumen.total;
    const rotulo = document.createElement("span");
    rotulo.textContent = "Productos";
    centro.append(numero, rotulo);
    donutCaja.append(centro);

    leyenda.replaceChildren();
    for (const segmento of segmentos) {
      const fila = document.createElement("li");
      const punto = document.createElement("span");
      punto.className = "punto";
      punto.style.background = segmento.color;
      const nombre = document.createElement("span");
      nombre.textContent = segmento.etiqueta;
      const cantidad = document.createElement("strong");
      cantidad.textContent = segmento.valor;
      fila.append(punto, nombre, cantidad);
      leyenda.append(fila);
    }
  }

  function dibujarAlertas(lista) {
    listaAlertas.replaceChildren();
    estadoAlertas.textContent = lista.length === 0 ? "No hay alertas pendientes." : "";
    for (const alerta of lista) {
      const item = document.createElement("li");
      item.className = "alerta";
      const titulo = document.createElement("strong");
      titulo.textContent = String(alerta.tipo_alerta ?? "Alerta").replaceAll("_", " ");
      const mensaje = document.createElement("span");
      mensaje.textContent = alerta.mensaje;
      item.append(titulo, mensaje);
      listaAlertas.append(item);
    }
  }

  function dibujarTabla() {
    const texto = campoBuscar.value.trim().toLowerCase();
    const categoria = filtroCategoria.value;
    const estado = filtroEstado.value;

    const filtrados = productos.filter((p) =>
      ((p.codigo ?? "").toLowerCase().includes(texto) ||
        (p.nombre ?? "").toLowerCase().includes(texto)) &&
      (categoria === "" || p.categoria === categoria) &&
      (estado === "" || estadoDeStock(p) === estado)
    );

    cuerpoTabla.replaceChildren();
    if (productos.length === 0) {
      estadoLista.textContent = "Aún no hay productos registrados.";
    } else if (filtrados.length === 0) {
      estadoLista.textContent = "Ningún producto coincide con los filtros.";
    } else {
      estadoLista.textContent = "";
    }
    resumenTabla.textContent = filtrados.length === 0
      ? ""
      : "Mostrando " + Math.min(MAX_FILAS, filtrados.length) + " de " + filtrados.length + " productos";

    for (const producto of filtrados.slice(0, MAX_FILAS)) {
      const fila = document.createElement("tr");

      const celdaProducto = document.createElement("td");
      const nombre = document.createElement("span");
      nombre.className = "producto-nombre";
      nombre.textContent = producto.nombre;
      const codigo = document.createElement("span");
      codigo.className = "producto-codigo";
      codigo.textContent = producto.codigo;
      celdaProducto.append(nombre, codigo);
      fila.append(celdaProducto);

      for (const valor of [
        producto.categoria,
        formatearSoles(producto.precio_venta),
        producto.stock
      ]) {
        const celda = document.createElement("td");
        celda.textContent = valor;
        fila.append(celda);
      }

      const estadoProducto = estadoDeStock(producto);
      const celdaEstado = document.createElement("td");
      const insignia = document.createElement("span");
      insignia.className = "insignia insignia-" + estadoProducto;
      insignia.textContent = ETIQUETAS[estadoProducto];
      celdaEstado.append(insignia);
      fila.append(celdaEstado);

      const celdaAccion = document.createElement("td");
      const enlace = document.createElement("a");
      enlace.href = "#/productos";
      enlace.textContent = "Ver";
      celdaAccion.append(enlace);
      fila.append(celdaAccion);

      cuerpoTabla.append(fila);
    }
  }

  campoBuscar.addEventListener("input", dibujarTabla);
  filtroCategoria.addEventListener("change", dibujarTabla);
  filtroEstado.addEventListener("change", dibujarTabla);

  cancelaciones = [
    escucharProductos(
      (lista) => {
        productos = lista;
        const resumen = resumirInventario(lista);
        kProductos.valor.textContent = resumen.total;
        kImportados.valor.textContent = resumen.importados;
        kNacionales.valor.textContent = resumen.nacionales;
        kBajo.valor.textContent = resumen.stockBajo;
        dibujarInventario(resumen);
        dibujarTabla();
      },
      () => {
        estadoLista.textContent = "No se pudo cargar la lista de productos.";
      }
    ),
    escucharVentasDelDia(
      (ventas) => {
        kVentas.valor.textContent = formatearSoles(totalVentas(ventas));
      },
      () => {
        kVentas.valor.textContent = "—";
      }
    ),
    escucharAlertasPendientes(
      (lista) => {
        kAlertas.valor.textContent = lista.length;
        dibujarAlertas(lista);
      },
      () => {
        kAlertas.valor.textContent = "—";
        estadoAlertas.textContent = "No se pudieron cargar las alertas.";
      }
    )
  ];

  return crearMarco("Dashboard", "#/dashboard", contenido);
}

export function salir() {
  for (const cancelar of cancelaciones) cancelar();
  cancelaciones = [];
}