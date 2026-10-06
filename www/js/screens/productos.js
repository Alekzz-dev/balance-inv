import { validarProducto } from "../domain/productos.js";
import { actualizarProducto, crearProducto, existeCodigo, escucharProductos }
  from "../services/productos.js";

let cancelarEscucha = null;

export function render() {
  const pantalla = document.createElement("section");
  pantalla.innerHTML = `
    <p><a href="#/dashboard">&larr; Volver al Dashboard</a></p>
    <h1>Productos</h1>

    <h2 id="titulo-formulario">Registrar producto</h2>
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
      <label class="campo">
        Estado
        <select id="estado">
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
      </label>
      <p class="mensaje-error" id="mensaje-error"></p>
      <p class="mensaje-exito" id="mensaje-exito"></p>
      <button class="boton" type="submit" id="boton-guardar">Registrar producto</button>
      <button class="boton boton-secundario" type="button" id="boton-cancelar" hidden>
        Cancelar edición
      </button>
    </form>

    <h2>Lista de productos</h2>
    <label class="campo">
      Buscar
      <input type="search" id="buscar" placeholder="Código o nombre" />
    </label>
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
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody id="cuerpo-tabla"></tbody>
      </table>
    </div>
  `;

  const formulario = pantalla.querySelector("#form-producto");
  const tituloFormulario = pantalla.querySelector("#titulo-formulario");
  const mensajeError = pantalla.querySelector("#mensaje-error");
  const mensajeExito = pantalla.querySelector("#mensaje-exito");
  const botonGuardar = pantalla.querySelector("#boton-guardar");
  const botonCancelar = pantalla.querySelector("#boton-cancelar");
  const campoBuscar = pantalla.querySelector("#buscar");
  const estadoLista = pantalla.querySelector("#estado-lista");
  const cuerpoTabla = pantalla.querySelector("#cuerpo-tabla");

  let productos = [];
  let productoEnEdicion = null;

  function leerFormulario() {
    return {
      codigo: pantalla.querySelector("#codigo").value.trim(),
      nombre: pantalla.querySelector("#nombre").value.trim(),
      categoria: pantalla.querySelector("#categoria").value,
      precio_compra: Number(pantalla.querySelector("#precio-compra").value),
      precio_venta: Number(pantalla.querySelector("#precio-venta").value),
      stock_minimo: Number(pantalla.querySelector("#stock-minimo").value),
      estado: pantalla.querySelector("#estado").value
    };
  }

  function salirDeEdicion() {
    productoEnEdicion = null;
    formulario.reset();
    tituloFormulario.textContent = "Registrar producto";
    botonGuardar.textContent = "Registrar producto";
    botonCancelar.hidden = true;
  }

  function empezarEdicion(producto) {
    productoEnEdicion = producto;
    pantalla.querySelector("#codigo").value = producto.codigo;
    pantalla.querySelector("#nombre").value = producto.nombre;
    pantalla.querySelector("#categoria").value = producto.categoria;
    pantalla.querySelector("#precio-compra").value = producto.precio_compra;
    pantalla.querySelector("#precio-venta").value = producto.precio_venta;
    pantalla.querySelector("#stock-minimo").value = producto.stock_minimo;
    pantalla.querySelector("#estado").value = producto.estado;
    tituloFormulario.textContent = "Editar producto";
    botonGuardar.textContent = "Guardar cambios";
    botonCancelar.hidden = false;
    mensajeError.textContent = "";
    mensajeExito.textContent = "";
    formulario.scrollIntoView();
  }

  function dibujarTabla() {
    const texto = campoBuscar.value.trim().toLowerCase();
    const filtrados = productos.filter((p) =>
      (p.codigo ?? "").toLowerCase().includes(texto) ||
      (p.nombre ?? "").toLowerCase().includes(texto)
    );

    cuerpoTabla.replaceChildren();
    if (productos.length === 0) {
      estadoLista.textContent = "Aún no hay productos registrados.";
    } else if (filtrados.length === 0) {
      estadoLista.textContent = "Ningún producto coincide con la búsqueda.";
    } else {
      estadoLista.textContent = "";
    }

    for (const producto of filtrados) {
      const fila = document.createElement("tr");
      const columnas = [
        producto.codigo,
        producto.nombre,
        producto.categoria,
        producto.precio_compra,
        producto.precio_venta,
        producto.stock,
        producto.stock_minimo,
        producto.estado
      ];
      for (const valor of columnas) {
        const celda = document.createElement("td");
        celda.textContent = valor;
        fila.append(celda);
      }

      const celdaAccion = document.createElement("td");
      const botonEditar = document.createElement("button");
      botonEditar.type = "button";
      botonEditar.className = "boton";
      botonEditar.textContent = "Editar";
      botonEditar.addEventListener("click", () => empezarEdicion(producto));
      celdaAccion.append(botonEditar);
      fila.append(celdaAccion);

      cuerpoTabla.append(fila);
    }
  }

  campoBuscar.addEventListener("input", dibujarTabla);

  botonCancelar.addEventListener("click", () => {
    salirDeEdicion();
    mensajeError.textContent = "";
    mensajeExito.textContent = "";
  });

  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    mensajeError.textContent = "";
    mensajeExito.textContent = "";

    const datos = leerFormulario();
    const problema = validarProducto(datos);
    if (problema) {
      mensajeError.textContent = problema;
      return;
    }

    botonGuardar.disabled = true;
    botonGuardar.textContent = "Guardando...";
    try {
      const idActual = productoEnEdicion ? productoEnEdicion.id_producto : null;
      if (await existeCodigo(datos.codigo, idActual)) {
        mensajeError.textContent = "Ya existe un producto con ese código.";
        return;
      }
      if (productoEnEdicion) {
        await actualizarProducto(productoEnEdicion.id_producto, datos);
        salirDeEdicion();
        mensajeExito.textContent = "Cambios guardados.";
      } else {
        await crearProducto(datos);
        formulario.reset();
        mensajeExito.textContent = "Producto registrado.";
      }
    } catch (error) {
      mensajeError.textContent = error.code === "permission-denied"
        ? "No tienes permiso para esta acción."
        : "No se pudo guardar el producto. Revisa tu conexión.";
    } finally {
      botonGuardar.disabled = false;
      botonGuardar.textContent = productoEnEdicion
        ? "Guardar cambios"
        : "Registrar producto";
    }
  });

  cancelarEscucha = escucharProductos(
    (lista) => {
      productos = lista;
      dibujarTabla();
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