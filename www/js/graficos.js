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

export function crearGraficoLineas(puntos, formatoValor, formatoEtiqueta, alSeleccionar) {
  const n = puntos.length;
  const maximo = Math.max(...puntos.map((p) => p.valor), 0);
  const escala = maximo > 0 ? maximo : 1;
  const posX = (i) => (n === 1 ? 50 : (i / (n - 1)) * 100);
  const posY = (valor) => 100 - (valor / escala) * 100;

  const grafico = document.createElement("div");
  grafico.className = "grafico";

  const ejeY = document.createElement("div");
  ejeY.className = "grafico-y";
  for (const fraccion of [1, 2 / 3, 1 / 3, 0]) {
    const marca = document.createElement("span");
    marca.textContent = formatoValor(maximo * fraccion);
    ejeY.append(marca);
  }

  const area = document.createElement("div");
  area.className = "grafico-area";

  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.setAttribute("preserveAspectRatio", "none");
  for (const y of [0, 100 / 3, 200 / 3, 100]) {
    const guia = document.createElementNS(NS, "line");
    guia.setAttribute("x1", "0");
    guia.setAttribute("x2", "100");
    guia.setAttribute("y1", String(y));
    guia.setAttribute("y2", String(y));
    guia.setAttribute("class", "grafico-guia");
    svg.append(guia);
  }
  const trazo = puntos.map((p, i) => posX(i) + "," + posY(p.valor)).join(" ");
  const relleno = document.createElementNS(NS, "polygon");
  relleno.setAttribute("points", posX(0) + ",100 " + trazo + " " + posX(n - 1) + ",100");
  relleno.setAttribute("class", "grafico-relleno");
  const linea = document.createElementNS(NS, "polyline");
  linea.setAttribute("points", trazo);
  linea.setAttribute("class", "grafico-trazo");
  svg.append(relleno, linea);

  const marcador = document.createElement("div");
  marcador.className = "grafico-marcador";
  marcador.hidden = true;
  area.append(svg, marcador);

  const paso = n > 1 ? 100 / (n - 1) : 100;
  puntos.forEach((punto, i) => {
    const zona = document.createElement("div");
    zona.className = "grafico-zona";
    zona.style.left = posX(i) - paso / 2 + "%";
    zona.style.width = paso + "%";
    const seleccionar = () => {
      marcador.hidden = false;
      marcador.style.left = posX(i) + "%";
      marcador.style.top = posY(punto.valor) + "%";
      alSeleccionar(punto);
    };
    zona.addEventListener("pointerenter", seleccionar);
    zona.addEventListener("click", seleccionar);
    area.append(zona);
  });

  const ejeX = document.createElement("div");
  ejeX.className = "grafico-x";
  const salto = Math.max(1, Math.ceil(n / 6));
  puntos.forEach((punto, i) => {
    if (i % salto !== 0) return;
    const etiqueta = document.createElement("span");
    etiqueta.textContent = formatoEtiqueta(punto);
    etiqueta.style.left = posX(i) + "%";
    ejeX.append(etiqueta);
  });

  grafico.append(ejeY, area, ejeX);
  return grafico;
}