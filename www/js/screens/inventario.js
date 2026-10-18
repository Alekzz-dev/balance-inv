import {
  estadoDeStock, formatearSoles, ordenarProductos, resumirInventario,
  unidadesEnStock, valorDelInventario
} from "../domain/inventario.js";
import { crearMarco, icono } from "../marco.js";
import { escucharProductos } from "../services/productos.js";

const PASO = 50;
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
  contenido.className = "pantalla-inventario";
  contenido.innerHTML = `
    <section class="tarjetas" id="tarjetas"></section>

    <section class="panel">
      <h2 class="panel-titulo">Stock por producto</h2>
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
        <label class="campo">
          Ordenar por
          <select id="orden">
            <option value="nombre">Nombre (A–Z)</option>
            <option value="stock-asc">Stock: de menor a mayor</option>
            <option value="stock-desc">Stock: de mayor a menor</option>
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
              <th>Stock</th>
              <th>Stock mín.</th>
              <th>Estado</th>
              <th>Valor en stock</th>
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
  `;

  const campo = (id) => contenido.querySelector("#" + id);

  const kUnidades = crearTarjeta("Unidades en stock", "inventario", "acento", "Suma del stock de todos los productos");
  const kValor = crearTarjeta("Valor del inventario", "balance", "exito", "Stock por precio de compra");
  const kBajo = crearTarjeta("Productos con stock bajo", "triangulo", "aviso", "En el mínimo o por debajo");
  campo("tarjetas").append(...[kUnidades, kValor, kBajo].map((t) => t.elemento));

  let productos = [];
  let visibles = PASO;

  function dibujarTabla() {
    const texto = campo("buscar").value.trim().toLowerCase();
    const categoria = campo("filtro-categoria").value;
    const estado = campo("filtro-estado").value;

    const coincidentes = productos.filter((p) =>
      ((p.codigo ?? "").toLowerCase().includes(texto) ||
        (p.nombre ?? "").toLowerCase().includes(texto)) &&
      (categoria === "" || p.categoria === categoria) &&
      (estado === "" || estadoDeStock(p) === estado)
    );
    const filtrados = ordenarProductos(coincidentes, campo("orden").value);

    const cuerpo = campo("cuerpo-tabla");
    cuerpo.replaceChildren();
    if (productos.length === 0) {
      campo("estado-lista").textContent = "Aún no hay productos registrados.";
    } else if (filtrados.length === 0) {
      campo("estado-lista").textContent = "Ningún producto coincide con los filtros.";
    } else {
      campo("estado-lista").textContent = "";
    }
    campo("conteo").textContent = filtrados.length === 0
      ? ""
      : "Mostrando " + Math.min(visibles, filtrados.length) + " de " + filtrados.length + " productos";
    campo("mas").hidden = filtrados.length <= visibles;

    for (const producto of filtrados.slice(0, visibles)) {
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

      const celdaCategoria = document.createElement("td");
      celdaCategoria.textContent = producto.categoria;
      fila.append(celdaCategoria);

      const celdaStock = document.createElement("td");
      const stock = document.createElement("strong");
      stock.textContent = producto.stock;
      celdaStock.append(stock);
      fila.append(celdaStock);

      const celdaMinimo = document.createElement("td");
      celdaMinimo.textContent = producto.stock_minimo;
      fila.append(celdaMinimo);

      const estadoProducto = estadoDeStock(producto);
      const celdaEstado = document.createElement("td");
      const insignia = document.createElement("span");
      insignia.className = "insignia insignia-" + estadoProducto;
      insignia.textContent = ETIQUETAS[estadoProducto];
      celdaEstado.append(insignia);
      fila.append(celdaEstado);

      const celdaValor = document.createElement("td");
      celdaValor.textContent = formatearSoles((producto.stock ?? 0) * (producto.precio_compra ?? 0));
      fila.append(celdaValor);

      cuerpo.append(fila);
    }
  }

  campo("buscar").addEventListener("input", () => {
    visibles = PASO;
    dibujarTabla();
  });
  for (const id of ["filtro-categoria", "filtro-estado", "orden"]) {
    campo(id).addEventListener("change", () => {
      visibles = PASO;
      dibujarTabla();
    });
  }
  campo("mas").addEventListener("click", () => {
    visibles += PASO;
    dibujarTabla();
  });

  cancelaciones = [
    escucharProductos(
      (lista) => {
        productos = lista;
        kUnidades.valor.textContent = unidadesEnStock(lista).toLocaleString("es-PE");
        kValor.valor.textContent = formatearSoles(valorDelInventario(lista));
        kBajo.valor.textContent = resumirInventario(lista).stockBajo;
        dibujarTabla();
      },
      () => {
        campo("estado-lista").textContent = "No se pudo cargar el inventario.";
      }
    )
  ];

  return crearMarco("Inventario", "#/inventario", contenido);
}

export function salir() {
  for (const cancelar of cancelaciones) cancelar();
  cancelaciones = [];
}