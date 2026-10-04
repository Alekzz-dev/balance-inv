import { validarProducto } from "../domain/productos.js";
import { crearProducto, existeCodigo, escucharProductos }
  from "../services/productos.js";

let cancelarEscucha = null;

export function render() {
  const pantalla = document.createElement("section");
  pantalla.innerHTML = `
    <p><a href="#/dashboard">&larr; Volver al Dashboard</a></p>
    <h1>Productos</h1>

    <form class="formulario" id="form-producto" novalidate>
      <label class="campo">
        Código
        <input type="text" id="codigo" />
      </label>
      <label class="campo">
        Nombre
        <input type="text" id="nombre" />
      </label>
      <label class="campo">
        Categoría
        <select id="categoria">
          <option value="">Selecciona...</option>
          <option value="Nacional">Nacional</option>
          <option value="Importado">Importado</option>
        </select>
      </label>
      <label class="campo">
        Precio de compra
        <input type="number" id="precio-compra" step="0.01" inputmode="decimal" />
      </label>
      <label class="campo">
        Precio de venta
        <input type="number" id="precio-venta" step="0.01" inputmode="decimal" />
      </label>
      <label class="campo">
        Stock mínimo
        <input type="number" id="stock-minimo" step="1" inputmode="numeric" />
      </label>
      <p class="mensaje-error" id="mensaje-error"></p>
      <p class="mensaje-exito" id="mensaje-exito"></p>
      <button class="boton" type="submit">Registrar producto</button>
    </form>

    <h2>Lista de productos</h2>
    <p id="estado-lista">Cargando...</p>
    <div class="tabla-contenedor">
      <table class="tabla">
        <thead>
          <tr>
            <th>Código</th>
            <th>Nombre</th>
            <th>Categoría</th>
            <th>Precio compra</th>
            <th>Precio venta</th>
            <th>Stock</th>
            <th>Stock mín.</th>
          </tr>
        </thead>
        <tbody id="cuerpo-tabla"></tbody>
      </table>
    </div>
  `;

  const formulario = pantalla.querySelector("#form-producto");
  const mensajeError = pantalla.querySelector("#mensaje-error");
  const mensajeExito = pantalla.querySelector("#mensaje-exito");
  const boton = pantalla.querySelector("button[type='submit']");
  const estadoLista = pantalla.querySelector("#estado-lista");
  const cuerpoTabla = pantalla.querySelector("#cuerpo-tabla");

  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    mensajeError.textContent = "";
    mensajeExito.textContent = "";

    const datos = {
      codigo: pantalla.querySelector("#codigo").value.trim(),
      nombre: pantalla.querySelector("#nombre").value.trim(),
      categoria: pantalla.querySelector("#categoria").value,
      precio_compra: Number(pantalla.querySelector("#precio-compra").value),
      precio_venta: Number(pantalla.querySelector("#precio-venta").value),
      stock_minimo: Number(pantalla.querySelector("#stock-minimo").value)
    };

    const problema = validarProducto(datos);
    if (problema) {
      mensajeError.textContent = problema;
      return;
    }

    boton.disabled = true;
    boton.textContent = "Guardando...";
    try {
      if (await existeCodigo(datos.codigo)) {
        mensajeError.textContent = "Ya existe un producto con ese código.";
        return;
      }
      await crearProducto(datos);
      formulario.reset();
      mensajeExito.textContent = "Producto registrado.";
    } catch (error) {
      mensajeError.textContent = error.code === "permission-denied"
        ? "No tienes permiso para registrar productos."
        : "No se pudo guardar el producto. Revisa tu conexión.";
    } finally {
      boton.disabled = false;
      boton.textContent = "Registrar producto";
    }
  });

  cancelarEscucha = escucharProductos(
    (productos) => {
      cuerpoTabla.replaceChildren();
      estadoLista.textContent = productos.length === 0
        ? "Aún no hay productos registrados."
        : "";
      for (const producto of productos) {
        const fila = document.createElement("tr");
        const columnas = [
          producto.codigo,
          producto.nombre,
          producto.categoria,
          producto.precio_compra,
          producto.precio_venta,
          producto.stock,
          producto.stock_minimo
        ];
        for (const valor of columnas) {
          const celda = document.createElement("td");
          celda.textContent = valor;
          fila.append(celda);
        }
        cuerpoTabla.append(fila);
      }
    },
    () => {
      estadoLista.textContent = "No se pudo cargar la lista de productos.";
    }
  );

  return pantalla;
}

export function salir() {
  if (cancelarEscucha) cancelarEscucha();
  cancelarEscucha = null;
}