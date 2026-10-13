import { formatearSoles } from "./domain/inventario.js";
import { sumar, totalesPorDia, variacionPorcentual } from "./domain/ventas.js";
import { crearGraficoLineas } from "./graficos.js";
import { escucharVentasDesde } from "./services/ventas.js";

const PERIODOS = [
  { texto: "7 días", dias: 7 },
  { texto: "30 días", dias: 30 },
  { texto: "3 meses", dias: 90 }
];

export function crearPanelVentas() {
  const elemento = document.createElement("article");
  elemento.className = "panel";
  elemento.innerHTML = `
    <div class="panel-cabecera">
      <h2 class="panel-titulo">Resumen de ventas</h2>
      <div class="segmentos" id="segmentos"></div>
    </div>
    <p class="ventas-total" id="ventas-total">...</p>
    <p class="ayuda" id="ventas-variacion"></p>
    <p id="ventas-estado"></p>
    <div id="ventas-grafico"></div>
    <p class="ayuda" id="ventas-detalle"></p>
  `;

  const campo = (id) => elemento.querySelector("#" + id);
  const abreviar = (valor) => "S/ " + Math.round(valor).toLocaleString("es-PE");
  let dias = 30;
  let cancelarEscucha = null;

  function cargar() {
    if (cancelarEscucha) cancelarEscucha();
    campo("ventas-total").textContent = "...";
    campo("ventas-estado").textContent = "Cargando...";

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const inicioActual = new Date(hoy);
    inicioActual.setDate(inicioActual.getDate() - (dias - 1));
    const inicioAnterior = new Date(inicioActual);
    inicioAnterior.setDate(inicioAnterior.getDate() - dias);

    cancelarEscucha = escucharVentasDesde(
      inicioAnterior,
      (ventas) => {
        const puntos = totalesPorDia(ventas, inicioActual, dias);
        const totalActual = sumar(puntos);
        const totalAnterior = sumar(totalesPorDia(ventas, inicioAnterior, dias));
        const variacion = variacionPorcentual(totalActual, totalAnterior);

        campo("ventas-total").textContent = formatearSoles(totalActual);
        campo("ventas-variacion").textContent = variacion === null
          ? "Sin ventas en el periodo anterior para comparar."
          : (variacion >= 0 ? "+" : "") + variacion.toFixed(1) + "% vs. periodo anterior";
        campo("ventas-estado").textContent = totalActual === 0
          ? "No hay ventas en este periodo."
          : "";
        campo("ventas-detalle").textContent = "Pasa el cursor o toca un punto para ver el detalle.";

        campo("ventas-grafico").replaceChildren(crearGraficoLineas(
          puntos,
          abreviar,
          (punto) => punto.fecha.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit" }),
          (punto) => {
            campo("ventas-detalle").textContent =
              punto.fecha.toLocaleDateString("es-PE", { weekday: "short", day: "numeric", month: "short" }) +
              ": " + formatearSoles(punto.valor);
          }
        ));
      },
      () => {
        campo("ventas-total").textContent = "—";
        campo("ventas-estado").textContent = "No se pudieron cargar las ventas.";
      }
    );
  }

  const contenedorSegmentos = campo("segmentos");
  for (const periodo of PERIODOS) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "segmento" + (periodo.dias === dias ? " activo" : "");
    boton.textContent = periodo.texto;
    boton.addEventListener("click", () => {
      dias = periodo.dias;
      for (const otro of contenedorSegmentos.children) {
        otro.classList.toggle("activo", otro === boton);
      }
      cargar();
    });
    contenedorSegmentos.append(boton);
  }

  cargar();

  return {
    elemento,
    cancelar: () => {
      if (cancelarEscucha) cancelarEscucha();
    }
  };
}