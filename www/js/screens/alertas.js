import { etiquetaDeAlerta, filtrarAlertas, stockRepuesto } from "../domain/alertas.js";
import { crearMarco } from "../marco.js";
import { escucharAlertas, marcarAtendida } from "../services/alertas.js";
import { escucharProductos } from "../services/productos.js";

let cancelaciones = [];

export function render() {
  const contenido = document.createElement("div");
  contenido.innerHTML = `
    <section class="panel">
      <h2 class="panel-titulo">Alertas</h2>
      <div class="herramientas">
        <label class="campo">
          Estado
          <select id="filtro-estado">
            <option value="pendiente">Pendientes</option>
            <option value="atendida">Atendidas</option>
            <option value="">Todas</option>
          </select>
        </label>
        <label class="campo">
          Tipo
          <select id="filtro-tipo"></select>
        </label>
      </div>
      <p class="ayuda" id="resumen"></p>
      <p class="mensaje-error" id="mensaje-error"></p>
      <p id="estado-lista">Cargando...</p>
      <ul class="lista-alertas" id="lista-alertas"></ul>
    </section>
  `;

  const campo = (id) => contenido.querySelector("#" + id);

  let alertas = [];
  let productos = [];

  function llenarTipos() {
    const elegido = campo("filtro-tipo").value;
    const tipos = [...new Set(alertas.map((a) => a.tipo_alerta))];
    const opciones = [new Option("Todos", "")];
    for (const tipo of tipos) {
      opciones.push(new Option(etiquetaDeAlerta(tipo), tipo));
    }
    campo("filtro-tipo").replaceChildren(...opciones);
    campo("filtro-tipo").value = elegido;
  }

  function dibujarLista() {
    const porProducto = new Map(productos.map((p) => [p.id_producto, p]));
    const filtradas = filtrarAlertas(alertas, {
      estado: campo("filtro-estado").value,
      tipo: campo("filtro-tipo").value
    });
    const pendientes = alertas.filter((a) => a.estado === "pendiente").length;

    campo("resumen").textContent =
      pendientes + (pendientes === 1 ? " alerta pendiente" : " alertas pendientes") +
      " · " + alertas.length + " en total";

    if (alertas.length === 0) {
      campo("estado-lista").textContent = "Aún no hay alertas registradas.";
    } else if (filtradas.length === 0) {
      campo("estado-lista").textContent = "Ninguna alerta coincide con los filtros.";
    } else {
      campo("estado-lista").textContent = "";
    }

    const lista = campo("lista-alertas");
    lista.replaceChildren();
    for (const alerta of filtradas) {
      const producto = porProducto.get(alerta.id_producto);
      const pendiente = alerta.estado === "pendiente";

      const item = document.createElement("li");
      item.className = pendiente ? "alerta" : "alerta alerta-atendida";

      const titulo = document.createElement("strong");
      titulo.textContent = etiquetaDeAlerta(alerta.tipo_alerta);

      const mensaje = document.createElement("span");
      mensaje.textContent = alerta.mensaje;

      const detalle = document.createElement("span");
      detalle.textContent = [
        producto
          ? "Producto: " + producto.nombre +
            " (stock " + producto.stock + ", mínimo " + producto.stock_minimo + ")"
          : "Producto no encontrado",
        alerta.fecha
          ? alerta.fecha.toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" })
          : ""
      ].filter(Boolean).join(" · ");

      item.append(titulo, mensaje, detalle);

      if (stockRepuesto(alerta, producto)) {
        const nota = document.createElement("span");
        nota.className = "nota-exito";
        nota.textContent = "El stock ya está por encima del mínimo.";
        item.append(nota);
      }

      const pie = document.createElement("div");
      pie.className = "alerta-pie";
      const insignia = document.createElement("span");
      insignia.className = "insignia " + (pendiente ? "insignia-bajo" : "insignia-disponible");
      insignia.textContent = pendiente ? "Pendiente" : "Atendida";
      pie.append(insignia);

      if (pendiente) {
        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = "boton boton-secundario";
        boton.textContent = "Marcar como atendida";
        boton.addEventListener("click", async () => {
          boton.disabled = true;
          campo("mensaje-error").textContent = "";
          try {
            await marcarAtendida(alerta.id_alerta);
          } catch (error) {
            campo("mensaje-error").textContent = error.code === "permission-denied"
              ? "No tienes permiso para esta acción."
              : "No se pudo actualizar la alerta. Revisa tu conexión.";
            boton.disabled = false;
          }
        });
        pie.append(boton);
      }

      item.append(pie);
      lista.append(item);
    }
  }

  campo("filtro-estado").addEventListener("change", dibujarLista);
  campo("filtro-tipo").addEventListener("change", dibujarLista);

  cancelaciones = [
    escucharAlertas(
      (lista) => {
        alertas = lista;
        llenarTipos();
        dibujarLista();
      },
      () => {
        campo("estado-lista").textContent = "No se pudieron cargar las alertas.";
      }
    ),
    escucharProductos(
      (lista) => {
        productos = lista;
        dibujarLista();
      },
      () => {}
    )
  ];

  return crearMarco("Alertas", "#/alertas", contenido);
}

export function salir() {
  for (const cancelar of cancelaciones) cancelar();
  cancelaciones = [];
}