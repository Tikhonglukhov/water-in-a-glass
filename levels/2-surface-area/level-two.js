const SVG_NS = "http://www.w3.org/2000/svg";
const WATER_DENSITY = 1000;
const WATER_HEAT_CAPACITY = 4180;

const defaults = Object.freeze({
  initialTemperature: 20,
  airTemperature: 40,
  volume: 1,
  baseSide: 20,
  alpha: 10,
  sampleTime: 30,
  duration: 180,
});

const controls = {
  initialTemperature: document.querySelector("#initial-temperature"),
  airTemperature: document.querySelector("#air-temperature"),
  volume: document.querySelector("#volume"),
  baseSide: document.querySelector("#base-side"),
  alpha: document.querySelector("#alpha"),
  sampleTime: document.querySelector("#sample-time"),
  duration: document.querySelector("#duration"),
};

const numberControls = {
  initialTemperature: document.querySelector("#initial-temperature-number"),
  airTemperature: document.querySelector("#air-temperature-number"),
  volume: document.querySelector("#volume-number"),
  baseSide: document.querySelector("#base-side-number"),
  alpha: document.querySelector("#alpha-number"),
  sampleTime: document.querySelector("#sample-time-number"),
  duration: document.querySelector("#duration-number"),
};

const chart = document.querySelector("#comparison-chart");
const vesselDiagram = document.querySelector("#vessel-diagram");
const heightResult = document.querySelector("#height-result");
const areaResult = document.querySelector("#area-result");
const kResult = document.querySelector("#k-result");
const tauResult = document.querySelector("#tau-result");
const geometryInsight = document.querySelector("#geometry-insight");
const sampleResultLabel = document.querySelector("#sample-result-label");
const sampleTemperature = document.querySelector("#sample-temperature");
const cubeTemperature = document.querySelector("#cube-temperature");
const areaComparison = document.querySelector("#area-comparison");
const resetButton = document.querySelector("#reset");

const oneDecimal = new Intl.NumberFormat("ru-RU", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const twoDecimals = new Intl.NumberFormat("ru-RU", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const threeDecimals = new Intl.NumberFormat("ru-RU", {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

const integer = new Intl.NumberFormat("ru-RU", {
  maximumFractionDigits: 0,
});

function createSvgElement(name, attributes = {}, text = "") {
  const element = document.createElementNS(SVG_NS, name);

  for (const [attribute, value] of Object.entries(attributes)) {
    element.setAttribute(attribute, value);
  }

  if (text) {
    element.textContent = text;
  }

  return element;
}

function readState() {
  return Object.fromEntries(
    Object.entries(controls).map(([key, control]) => [key, Number(control.value)]),
  );
}

function geometryFor(volumeLiters, baseSideCentimeters) {
  const volume = volumeLiters / 1000;
  const baseSide = baseSideCentimeters / 100;
  const height = volume / baseSide ** 2;
  const topArea = baseSide ** 2;
  const sideArea = 4 * baseSide * height;

  return {
    volume,
    baseSide,
    height,
    topArea,
    sideArea,
    area: topArea + sideArea,
  };
}

function cubeGeometry(volumeLiters) {
  const volume = volumeLiters / 1000;
  const sideMeters = Math.cbrt(volume);
  return geometryFor(volumeLiters, sideMeters * 100);
}

function optimumBaseSideCentimeters(volumeLiters) {
  return Math.cbrt(2 * volumeLiters / 1000) * 100;
}

function massKilograms(state) {
  return WATER_DENSITY * state.volume / 1000;
}

function temperatureAt(timeMinutes, state, area) {
  const exponent = -(state.alpha * area * timeMinutes * 60)
    / (massKilograms(state) * WATER_HEAT_CAPACITY);

  return state.airTemperature
    - (state.airTemperature - state.initialTemperature) * Math.exp(exponent);
}

function characteristicTimeMinutes(state, area) {
  return (massKilograms(state) * WATER_HEAT_CAPACITY) / (state.alpha * area) / 60;
}

function setRangeProgress(control) {
  const minimum = Number(control.min);
  const maximum = Number(control.max);
  const progress = ((Number(control.value) - minimum) / (maximum - minimum)) * 100;
  control.style.setProperty("--range-progress", `${progress}%`);
}

function updateControlOutputs(state) {
  for (const [key, control] of Object.entries(numberControls)) {
    control.value = String(state[key]);
  }

  Object.values(controls).forEach(setRangeProgress);
}

function drawVessel(state, geometry) {
  const width = 360;
  const bottom = 222;
  const aspectRatio = geometry.height / geometry.baseSide;
  const visualWidth = Math.max(88, Math.min(230, 190 / Math.sqrt(Math.max(aspectRatio, 0.12))));
  const visualHeight = Math.max(38, Math.min(172, visualWidth * aspectRatio));
  const left = (width - visualWidth) / 2;
  const top = bottom - visualHeight;
  const ellipseHeight = Math.max(11, Math.min(25, visualWidth * 0.11));

  vesselDiagram.replaceChildren(
    createSvgElement("title", { id: "vessel-diagram-title" }, "Схема выбранного сосуда"),
    createSvgElement(
      "desc",
      { id: "vessel-diagram-description" },
      `Квадратный сосуд шириной ${oneDecimal.format(state.baseSide)} сантиметра и высотой воды ${oneDecimal.format(geometry.height * 100)} сантиметра.`,
    ),
  );

  const vessel = createSvgElement("g", { "aria-hidden": "true" });
  vessel.append(
    createSvgElement("rect", {
      x: left,
      y: top,
      width: visualWidth,
      height: visualHeight,
      rx: 8,
      fill: "rgba(12, 148, 165, 0.18)",
      stroke: "#076a78",
      "stroke-width": 3,
    }),
    createSvgElement("rect", {
      x: left + 4,
      y: top + ellipseHeight / 2,
      width: visualWidth - 8,
      height: Math.max(0, visualHeight - ellipseHeight / 2 - 4),
      rx: 5,
      fill: "rgba(12, 148, 165, 0.55)",
    }),
    createSvgElement("ellipse", {
      cx: width / 2,
      cy: top + ellipseHeight / 2,
      rx: visualWidth / 2,
      ry: ellipseHeight / 2,
      fill: "rgba(232, 121, 69, 0.72)",
      stroke: "#076a78",
      "stroke-width": 3,
    }),
    createSvgElement("line", {
      x1: left,
      y1: bottom + 17,
      x2: left + visualWidth,
      y2: bottom + 17,
      stroke: "#5d7680",
      "stroke-width": 1.5,
    }),
    createSvgElement("line", {
      x1: left,
      y1: bottom + 10,
      x2: left,
      y2: bottom + 24,
      stroke: "#5d7680",
      "stroke-width": 1.5,
    }),
    createSvgElement("line", {
      x1: left + visualWidth,
      y1: bottom + 10,
      x2: left + visualWidth,
      y2: bottom + 24,
      stroke: "#5d7680",
      "stroke-width": 1.5,
    }),
    createSvgElement("text", {
      x: width / 2,
      y: bottom + 42,
      fill: "#5d7680",
      "font-size": 14,
      "text-anchor": "middle",
    }, `a = ${oneDecimal.format(state.baseSide)} см`),
  );

  const dimensionX = Math.min(width - 20, left + visualWidth + 24);
  vessel.append(
    createSvgElement("line", {
      x1: dimensionX,
      y1: top,
      x2: dimensionX,
      y2: bottom,
      stroke: "#5d7680",
      "stroke-width": 1.5,
    }),
    createSvgElement("line", {
      x1: dimensionX - 7,
      y1: top,
      x2: dimensionX + 7,
      y2: top,
      stroke: "#5d7680",
      "stroke-width": 1.5,
    }),
    createSvgElement("line", {
      x1: dimensionX - 7,
      y1: bottom,
      x2: dimensionX + 7,
      y2: bottom,
      stroke: "#5d7680",
      "stroke-width": 1.5,
    }),
    createSvgElement("text", {
      x: dimensionX + 12,
      y: (top + bottom) / 2,
      fill: "#5d7680",
      "font-size": 14,
      transform: `rotate(-90 ${dimensionX + 12} ${(top + bottom) / 2})`,
      "text-anchor": "middle",
    }, `h = ${oneDecimal.format(geometry.height * 100)} см`),
  );

  vesselDiagram.append(vessel);
}

function addCurve(chartElement, valueAt, x, y, duration, attributes) {
  const points = 240;
  const pathData = [];

  for (let index = 0; index <= points; index += 1) {
    const time = (index / points) * duration;
    const command = index === 0 ? "M" : "L";
    pathData.push(`${command} ${x(time).toFixed(2)} ${y(valueAt(time)).toFixed(2)}`);
  }

  chartElement.append(createSvgElement("path", {
    d: pathData.join(" "),
    fill: "none",
    "stroke-width": 5,
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    ...attributes,
  }));
}

function drawChart(state, selectedGeometry, referenceGeometry) {
  const width = 900;
  const height = 480;
  const margin = { top: 26, right: 28, bottom: 58, left: 72 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const rawMinimum = Math.min(state.initialTemperature, state.airTemperature);
  const rawMaximum = Math.max(state.initialTemperature, state.airTemperature);
  const rawSpan = Math.max(rawMaximum - rawMinimum, 1);
  const padding = Math.max(rawSpan * 0.16, 2);
  const yMinimum = rawMinimum - padding;
  const yMaximum = rawMaximum + padding;
  const x = (time) => margin.left + (time / state.duration) * plotWidth;
  const y = (temperature) => margin.top
    + ((yMaximum - temperature) / (yMaximum - yMinimum)) * plotHeight;
  const selectedAt = (time) => temperatureAt(time, state, selectedGeometry.area);
  const referenceAt = (time) => temperatureAt(time, state, referenceGeometry.area);

  chart.replaceChildren(
    createSvgElement("title", { id: "comparison-chart-title" }, "Сравнение температуры воды в сосудах разной формы"),
    createSvgElement(
      "desc",
      { id: "comparison-chart-description" },
      "Сплошная линия показывает выбранный сосуд, фиолетовая пунктирная — кубический сосуд того же объёма.",
    ),
  );

  const grid = createSvgElement("g", { "aria-hidden": "true" });

  for (let index = 0; index <= 5; index += 1) {
    const ratio = index / 5;
    const value = yMaximum - ratio * (yMaximum - yMinimum);
    const yPosition = margin.top + ratio * plotHeight;
    grid.append(
      createSvgElement("line", {
        x1: margin.left,
        y1: yPosition,
        x2: width - margin.right,
        y2: yPosition,
        stroke: "#e5efee",
        "stroke-width": 1,
      }),
      createSvgElement("text", {
        x: margin.left - 13,
        y: yPosition + 5,
        fill: "#5d7680",
        "font-size": 14,
        "text-anchor": "end",
      }, `${oneDecimal.format(value)}°`),
    );
  }

  for (let index = 0; index <= 6; index += 1) {
    const ratio = index / 6;
    const time = ratio * state.duration;
    const xPosition = margin.left + ratio * plotWidth;
    grid.append(
      createSvgElement("line", {
        x1: xPosition,
        y1: margin.top,
        x2: xPosition,
        y2: height - margin.bottom,
        stroke: "#e5efee",
        "stroke-width": 1,
      }),
      createSvgElement("text", {
        x: xPosition,
        y: height - margin.bottom + 28,
        fill: "#5d7680",
        "font-size": 14,
        "text-anchor": "middle",
      }, integer.format(time)),
    );
  }

  chart.append(
    grid,
    createSvgElement("text", {
      x: margin.left + plotWidth / 2,
      y: height - 8,
      fill: "#5d7680",
      "font-size": 14,
      "text-anchor": "middle",
    }, "Время, мин"),
    createSvgElement("text", {
      x: 17,
      y: margin.top + plotHeight / 2,
      fill: "#5d7680",
      "font-size": 14,
      "text-anchor": "middle",
      transform: `rotate(-90 17 ${margin.top + plotHeight / 2})`,
    }, "Температура, °C"),
    createSvgElement("line", {
      x1: margin.left,
      y1: y(state.airTemperature),
      x2: width - margin.right,
      y2: y(state.airTemperature),
      stroke: "#e87945",
      "stroke-width": 2,
      "stroke-dasharray": "8 8",
    }),
  );

  addCurve(chart, referenceAt, x, y, state.duration, {
    stroke: "#7457a8",
    "stroke-dasharray": "11 9",
  });
  addCurve(chart, selectedAt, x, y, state.duration, { stroke: "#0c94a5" });

  const sampleX = x(state.sampleTime);
  chart.append(createSvgElement("line", {
    x1: sampleX,
    y1: margin.top,
    x2: sampleX,
    y2: height - margin.bottom,
    stroke: "#7caeb2",
    "stroke-width": 1.5,
    "stroke-dasharray": "4 6",
  }));

  for (const [value, stroke] of [
    [referenceAt(state.sampleTime), "#7457a8"],
    [selectedAt(state.sampleTime), "#076a78"],
  ]) {
    chart.append(createSvgElement("circle", {
      cx: sampleX,
      cy: y(value),
      r: 7,
      fill: "#ffffff",
      stroke,
      "stroke-width": 4,
    }));
  }

  const hoverGroup = createSvgElement("g", { visibility: "hidden", "aria-hidden": "true" });
  const hoverLine = createSvgElement("line", {
    y1: margin.top,
    y2: height - margin.bottom,
    stroke: "#12333d",
    "stroke-width": 1,
    opacity: 0.35,
  });
  const tooltip = createSvgElement("g");
  const tooltipBackground = createSvgElement("rect", {
    width: 154,
    height: 68,
    rx: 10,
    fill: "#12333d",
  });
  const tooltipTime = createSvgElement("text", { x: 12, y: 19, fill: "#cde8e9", "font-size": 12 });
  const tooltipSelected = createSvgElement("text", { x: 12, y: 40, fill: "#8edbe0", "font-size": 13, "font-weight": 700 });
  const tooltipCube = createSvgElement("text", { x: 12, y: 58, fill: "#d6c8f0", "font-size": 13, "font-weight": 700 });
  tooltip.append(tooltipBackground, tooltipTime, tooltipSelected, tooltipCube);
  hoverGroup.append(hoverLine, tooltip);
  chart.append(hoverGroup);

  const hitArea = createSvgElement("rect", {
    x: margin.left,
    y: margin.top,
    width: plotWidth,
    height: plotHeight,
    fill: "transparent",
  });

  hitArea.addEventListener("pointermove", (event) => {
    const bounds = chart.getBoundingClientRect();
    const pointerX = ((event.clientX - bounds.left) / bounds.width) * width;
    const constrainedX = Math.max(margin.left, Math.min(width - margin.right, pointerX));
    const time = ((constrainedX - margin.left) / plotWidth) * state.duration;
    const tooltipX = constrainedX > width - 190 ? constrainedX - 166 : constrainedX + 12;

    hoverGroup.setAttribute("visibility", "visible");
    hoverLine.setAttribute("x1", constrainedX);
    hoverLine.setAttribute("x2", constrainedX);
    tooltip.setAttribute("transform", `translate(${tooltipX} ${margin.top + 8})`);
    tooltipTime.textContent = `${oneDecimal.format(time)} мин`;
    tooltipSelected.textContent = `Форма: ${oneDecimal.format(selectedAt(time))} °C`;
    tooltipCube.textContent = `Куб: ${oneDecimal.format(referenceAt(time))} °C`;
  });

  hitArea.addEventListener("pointerleave", () => {
    hoverGroup.setAttribute("visibility", "hidden");
  });

  chart.append(hitArea);
}

function updateResults(state, selectedGeometry, referenceGeometry) {
  const selectedTemperature = temperatureAt(state.sampleTime, state, selectedGeometry.area);
  const referenceTemperature = temperatureAt(state.sampleTime, state, referenceGeometry.area);
  const comparisonPercent = (selectedGeometry.area / referenceGeometry.area - 1) * 100;
  const optimumSide = optimumBaseSideCentimeters(state.volume);
  const distanceFromOptimum = Math.abs(state.baseSide / optimumSide - 1);

  heightResult.textContent = `${oneDecimal.format(selectedGeometry.height * 100)} см`;
  areaResult.textContent = `${threeDecimals.format(selectedGeometry.area)} м²`;
  kResult.textContent = `${twoDecimals.format(state.alpha * selectedGeometry.area)} Вт/°C`;
  tauResult.textContent = `${oneDecimal.format(characteristicTimeMinutes(state, selectedGeometry.area))} мин`;
  sampleResultLabel.textContent = `Выбранная форма через ${oneDecimal.format(state.sampleTime)} мин`;
  sampleTemperature.textContent = `${oneDecimal.format(selectedTemperature)} °C`;
  cubeTemperature.textContent = `${oneDecimal.format(referenceTemperature)} °C`;
  areaComparison.textContent = `${comparisonPercent >= 0 ? "+" : "−"}${oneDecimal.format(Math.abs(comparisonPercent))}%`;

  if (distanceFromOptimum < 0.02) {
    geometryInsight.textContent = `Почти минимум площади: для этого объёма оптимальная сторона a ≈ ${oneDecimal.format(optimumSide)} см. Здесь характерное время максимально.`;
  } else if (state.baseSide < optimumSide) {
    geometryInsight.textContent = `Сосуд уже точки минимума a ≈ ${oneDecimal.format(optimumSide)} см: боковые стенки дают ${oneDecimal.format(selectedGeometry.sideArea / selectedGeometry.area * 100)}% всей площади.`;
  } else {
    geometryInsight.textContent = `Сосуд шире точки минимума a ≈ ${oneDecimal.format(optimumSide)} см: верхняя поверхность уже даёт ${oneDecimal.format(selectedGeometry.topArea / selectedGeometry.area * 100)}% всей площади.`;
  }
}

function render() {
  const duration = Number(controls.duration.value);
  controls.sampleTime.max = String(duration);
  numberControls.sampleTime.max = String(duration);

  if (Number(controls.sampleTime.value) > duration) {
    controls.sampleTime.value = String(duration);
  }

  const state = readState();
  const selectedGeometry = geometryFor(state.volume, state.baseSide);
  const referenceGeometry = cubeGeometry(state.volume);

  updateControlOutputs(state);
  drawVessel(state, selectedGeometry);
  drawChart(state, selectedGeometry, referenceGeometry);
  updateResults(state, selectedGeometry, referenceGeometry);
}

Object.values(controls).forEach((control) => {
  control.addEventListener("input", render);
});

for (const [key, numberControl] of Object.entries(numberControls)) {
  numberControl.addEventListener("input", () => {
    const value = numberControl.valueAsNumber;

    if (!Number.isFinite(value)) {
      return;
    }

    const minimum = Number(controls[key].min);
    const maximum = Number(controls[key].max);
    controls[key].value = String(Math.min(maximum, Math.max(minimum, value)));
    render();
  });

  numberControl.addEventListener("change", () => {
    if (!Number.isFinite(numberControl.valueAsNumber)) {
      numberControl.value = controls[key].value;
    }
  });
}

resetButton.addEventListener("click", () => {
  for (const [key, value] of Object.entries(defaults)) {
    controls[key].value = String(value);
  }

  render();
});

render();
