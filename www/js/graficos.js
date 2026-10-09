const NS = "http://www.w3.org/2000/svg";

function crearAnillo(color, longitud, desplazamiento) {
  const anillo = document.createElementNS(NS, "circle");
  anillo.setAttribute("cx", "21");
  anillo.setAttribute("cy", "21");
  anillo.setAttribute("r", "15.9155");
  anillo.setAttribute("fill", "none");
  anillo.setAttribute("stroke-width", "4");
  anillo.setAttribute("stroke-dasharray", longitud + " " + (100 - longitud));
  anillo.setAttribute("stroke-dashoffset", String(desplazamiento));
  anillo.style.stroke = color;
  return anillo;
}

export function crearDonut(segmentos, total) {
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 42 42");
  svg.setAttribute("class", "donut");
  svg.append(crearAnillo("rgba(255, 255, 255, 0.08)", 100, 0));

  let acumulado = 0;
  for (const segmento of segmentos) {
    const porcentaje = total > 0 ? (segmento.valor / total) * 100 : 0;
    if (porcentaje > 0) {
      svg.append(crearAnillo(segmento.color, porcentaje, 25 - acumulado));
      acumulado += porcentaje;
    }
  }
  return svg;
}