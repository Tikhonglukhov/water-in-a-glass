const SVG_NS = "http://www.w3.org/2000/svg";
const WATER_DENSITY = 1000;
const WATER_HEAT_CAPACITY = 4180;

const defaults = Object.freeze({
  initialTemperature: 20,
  airTemperature: 40,
  volume: 1,
  baseSideA: 7,
  baseSideB: 24,
  alpha: 10,
  sampleTime: 30,
  duration: 180,
});

const controls = {
  initialTemperature: document.querySelector("#initial-temperature"),
  airTemperature: document.querySelector("#air-temperature"),
  volume: document.querySelector("#volume"),
  baseSideA: document.querySelector("#base-side-a"),
  baseSideB: document.querySelector("#base-side-b"),
  alpha: document.querySelector("#alpha"),
  sampleTime: document.querySelector("#sample-time"),
  duration: document.querySelector("#duration"),
};

const numberControls = {
  initialTemperature: document.querySelector("#initial-temperature-number"),
  airTemperature: document.querySelector("#air-temperature-number"),
  volume: document.querySelector("#volume-number"),
  baseSideA: document.querySelector("#base-side-a-number"),
  baseSideB: document.querySelector("#base-side-b-number"),
  alpha: document.querySelector("#alpha-number"),
  sampleTime: document.querySelector("#sample-time-number"),
  duration: document.querySelector("#duration-number"),
};

const chart = document.querySelector("#comparison-chart");
const vesselADiagram = document.querySelector("#vessel-a-diagram");
const vesselBDiagram = document.querySelector("#vessel-b-diagram");
const heightAResult = document.querySelector("#height-a-result");
const areaAResult = document.querySelector("#area-a-result");
const kAResult = document.querySelector("#k-a-result");
const tauAResult = document.querySelector("#tau-a-result");
const heightBResult = document.querySelector("#height-b-result");
const areaBResult = document.querySelector("#area-b-result");
const kBResult = document.querySelector("#k-b-result");
const tauBResult = document.querySelector("#tau-b-result");
const vesselAShape = document.querySelector("#vessel-a-shape");
const vesselBShape = document.querySelector("#vessel-b-shape");
const geometryInsight = document.querySelector("#geometry-insight");
const vesselALegend = document.querySelector("#vessel-a-legend");
const vesselBLegend = document.querySelector("#vessel-b-legend");
const sampleAResultLabel = document.querySelector("#sample-a-result-label");
const sampleATemperature = document.querySelector("#sample-a-temperature");
const sampleBResultLabel = document.querySelector("#sample-b-result-label");
const sampleBTemperature = document.querySelector("#sample-b-temperature");
const temperatureComparison = document.querySelector("#temperature-comparison");
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

function drawVessel(diagram, baseSideCentimeters, geometry, vesselLabel, palette) {
  const width = 360;
  const bottom = 222;
  const aspectRatio = geometry.height / geometry.baseSide;
  const visualWidth = Math.max(88, Math.min(230, 190 / Math.sqrt(Math.max(aspectRatio, 0.12))));
  const visualHeight = Math.max(38, Math.min(172, visualWidth * aspectRatio));
  const left = (width - visualWidth) / 2;
  const top = bottom - visualHeight;
  const ellipseHeight = Math.max(11, Math.min(25, visualWidth * 0.11));

  const idPrefix = `vessel-${vesselLabel.toLowerCase()}-diagram`;

  diagram.replaceChildren(
    createSvgElement("title", { id: `${idPrefix}-title` }, `Схема сосуда ${vesselLabel}`),
    createSvgElement(
      "desc",
      { id: `${idPrefix}-description` },
      `Сосуд ${vesselLabel} шириной ${oneDecimal.format(baseSideCentimeters)} сантиметра и высотой воды ${oneDecimal.format(geometry.height * 100)} сантиметра.`,
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
      stroke: palette.stroke,
      "stroke-width": 3,
    }),
    createSvgElement("rect", {
      x: left + 4,
      y: top + ellipseHeight / 2,
      width: visualWidth - 8,
      height: Math.max(0, visualHeight - ellipseHeight / 2 - 4),
      rx: 5,
      fill: palette.water,
    }),
    createSvgElement("ellipse", {
      cx: width / 2,
      cy: top + ellipseHeight / 2,
      rx: visualWidth / 2,
      ry: ellipseHeight / 2,
      fill: palette.top,
      stroke: palette.stroke,
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
    }, `a${vesselLabel} = ${oneDecimal.format(baseSideCentimeters)} см`),
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

  diagram.append(vessel);
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

function drawChart(state, geometryA, geometryB) {
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
  const vesselAAt = (time) => temperatureAt(time, state, geometryA.area);
  const vesselBAt = (time) => temperatureAt(time, state, geometryB.area);

  chart.replaceChildren(
    createSvgElement("title", { id: "comparison-chart-title" }, "Сравнение температуры воды в сосудах разной формы"),
    createSvgElement(
      "desc",
      { id: "comparison-chart-description" },
      `Сплошная линия показывает сосуд A шириной ${oneDecimal.format(state.baseSideA)} сантиметра, фиолетовая пунктирная — сосуд B шириной ${oneDecimal.format(state.baseSideB)} сантиметра.`,
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

  addCurve(chart, vesselBAt, x, y, state.duration, {
    stroke: "#7457a8",
    "stroke-dasharray": "11 9",
  });
  addCurve(chart, vesselAAt, x, y, state.duration, { stroke: "#0c94a5" });

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
    [vesselBAt(state.sampleTime), "#7457a8"],
    [vesselAAt(state.sampleTime), "#076a78"],
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
    tooltipSelected.textContent = `Сосуд A: ${oneDecimal.format(vesselAAt(time))} °C`;
    tooltipCube.textContent = `Сосуд B: ${oneDecimal.format(vesselBAt(time))} °C`;
  });

  hitArea.addEventListener("pointerleave", () => {
    hoverGroup.setAttribute("visibility", "hidden");
  });

  chart.append(hitArea);
}

function updateResults(state, geometryA, geometryB) {
  const temperatureA = temperatureAt(state.sampleTime, state, geometryA.area);
  const temperatureB = temperatureAt(state.sampleTime, state, geometryB.area);
  const optimumSide = optimumBaseSideCentimeters(state.volume);
  const areaDifferencePercent = Math.abs(geometryA.area - geometryB.area)
    / Math.min(geometryA.area, geometryB.area) * 100;
  const shapeDescription = (side) => {
    if (Math.abs(side / optimumSide - 1) < 0.02) return "Около минимума площади";
    return side < optimumSide ? "Уже точки минимума" : "Шире точки минимума";
  };

  heightAResult.textContent = `${oneDecimal.format(geometryA.height * 100)} см`;
  areaAResult.textContent = `${threeDecimals.format(geometryA.area)} м²`;
  kAResult.textContent = `${twoDecimals.format(state.alpha * geometryA.area)} Вт/°C`;
  tauAResult.textContent = `${oneDecimal.format(characteristicTimeMinutes(state, geometryA.area))} мин`;
  heightBResult.textContent = `${oneDecimal.format(geometryB.height * 100)} см`;
  areaBResult.textContent = `${threeDecimals.format(geometryB.area)} м²`;
  kBResult.textContent = `${twoDecimals.format(state.alpha * geometryB.area)} Вт/°C`;
  tauBResult.textContent = `${oneDecimal.format(characteristicTimeMinutes(state, geometryB.area))} мин`;
  vesselAShape.textContent = shapeDescription(state.baseSideA);
  vesselBShape.textContent = shapeDescription(state.baseSideB);
  vesselALegend.textContent = `A · ${oneDecimal.format(state.baseSideA)} см`;
  vesselBLegend.textContent = `B · ${oneDecimal.format(state.baseSideB)} см`;
  sampleAResultLabel.textContent = `Сосуд A через ${oneDecimal.format(state.sampleTime)} мин`;
  sampleATemperature.textContent = `${oneDecimal.format(temperatureA)} °C`;
  sampleBResultLabel.textContent = `Сосуд B через ${oneDecimal.format(state.sampleTime)} мин`;
  sampleBTemperature.textContent = `${oneDecimal.format(temperatureB)} °C`;
  temperatureComparison.textContent = `${oneDecimal.format(Math.abs(temperatureA - temperatureB))} °C`;

  if (areaDifferencePercent < 0.5) {
    geometryInsight.textContent = `Площади почти равны, поэтому сосуды приближаются к температуре воздуха практически с одинаковой скоростью. Минимум площади находится при a ≈ ${oneDecimal.format(optimumSide)} см.`;
    return;
  }

  const fasterLabel = geometryA.area > geometryB.area ? "A" : "B";
  const largerArea = Math.max(geometryA.area, geometryB.area);
  const smallerArea = Math.min(geometryA.area, geometryB.area);
  geometryInsight.textContent = `У сосуда ${fasterLabel} площадь на ${oneDecimal.format((largerArea / smallerArea - 1) * 100)}% больше, поэтому он быстрее приближается к температуре воздуха. Для этого объёма минимум площади находится при a ≈ ${oneDecimal.format(optimumSide)} см.`;
}

function render() {
  const duration = Number(controls.duration.value);
  controls.sampleTime.max = String(duration);
  numberControls.sampleTime.max = String(duration);

  if (Number(controls.sampleTime.value) > duration) {
    controls.sampleTime.value = String(duration);
  }

  const state = readState();
  const geometryA = geometryFor(state.volume, state.baseSideA);
  const geometryB = geometryFor(state.volume, state.baseSideB);

  updateControlOutputs(state);
  drawVessel(vesselADiagram, state.baseSideA, geometryA, "A", {
    stroke: "#076a78",
    water: "rgba(12, 148, 165, 0.55)",
    top: "rgba(232, 121, 69, 0.72)",
  });
  drawVessel(vesselBDiagram, state.baseSideB, geometryB, "B", {
    stroke: "#5e438d",
    water: "rgba(116, 87, 168, 0.45)",
    top: "rgba(232, 121, 69, 0.72)",
  });
  drawChart(state, geometryA, geometryB);
  updateResults(state, geometryA, geometryB);
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
