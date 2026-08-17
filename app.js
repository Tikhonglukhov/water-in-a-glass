const SVG_NS = "http://www.w3.org/2000/svg";

const defaults = Object.freeze({
  initialTemperature: 20,
  airTemperature: 40,
  mass: 1,
  heatCapacity: 4180,
  transferCoefficient: 0.9,
  sampleTime: 5,
  duration: 120,
});

const controls = {
  initialTemperature: document.querySelector("#initial-temperature"),
  airTemperature: document.querySelector("#air-temperature"),
  mass: document.querySelector("#mass"),
  heatCapacity: document.querySelector("#heat-capacity"),
  transferCoefficient: document.querySelector("#transfer-coefficient"),
  sampleTime: document.querySelector("#sample-time"),
  duration: document.querySelector("#duration"),
};

const outputs = {
  initialTemperature: document.querySelector("#initial-temperature-output"),
  airTemperature: document.querySelector("#air-temperature-output"),
  mass: document.querySelector("#mass-output"),
  heatCapacity: document.querySelector("#heat-capacity-output"),
  transferCoefficient: document.querySelector("#transfer-coefficient-output"),
  sampleTime: document.querySelector("#sample-time-output"),
  duration: document.querySelector("#duration-output"),
};

const chart = document.querySelector("#temperature-chart");
const sampleTemperature = document.querySelector("#sample-temperature");
const timeConstant = document.querySelector("#time-constant");
const remainingDifference = document.querySelector("#remaining-difference");
const sampleResultLabel = document.querySelector("#sample-result-label");
const resetButton = document.querySelector("#reset");

const decimal = new Intl.NumberFormat("ru-RU", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const integer = new Intl.NumberFormat("ru-RU", {
  maximumFractionDigits: 0,
});

function readState() {
  return Object.fromEntries(
    Object.entries(controls).map(([key, control]) => [key, Number(control.value)]),
  );
}

function temperatureAt(timeMinutes, state) {
  const timeSeconds = timeMinutes * 60;
  const exponent = -(state.transferCoefficient * timeSeconds) / (state.mass * state.heatCapacity);

  return state.airTemperature
    - (state.airTemperature - state.initialTemperature) * Math.exp(exponent);
}

function characteristicTimeMinutes(state) {
  return (state.mass * state.heatCapacity) / state.transferCoefficient / 60;
}

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

function setRangeProgress(control) {
  const minimum = Number(control.min);
  const maximum = Number(control.max);
  const progress = ((Number(control.value) - minimum) / (maximum - minimum)) * 100;
  control.style.setProperty("--range-progress", `${progress}%`);
}

function updateControlOutputs(state) {
  outputs.initialTemperature.value = `${integer.format(state.initialTemperature)} °C`;
  outputs.airTemperature.value = `${integer.format(state.airTemperature)} °C`;
  outputs.mass.value = `${decimal.format(state.mass)} кг`;
  outputs.heatCapacity.value = `${integer.format(state.heatCapacity)} Дж/(кг·°C)`;
  outputs.transferCoefficient.value = `${decimal.format(state.transferCoefficient)} Вт/°C`;
  outputs.sampleTime.value = `${integer.format(state.sampleTime)} мин`;
  outputs.duration.value = `${integer.format(state.duration)} мин`;

  Object.values(controls).forEach(setRangeProgress);
}

function drawChart(state) {
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

  chart.replaceChildren();
  chart.append(
    createSvgElement("title", { id: "chart-title" }, "График температуры воды во времени"),
    createSvgElement(
      "desc",
      { id: "chart-description" },
      "Экспоненциальное приближение температуры воды к температуре воздуха.",
    ),
  );

  const grid = createSvgElement("g", { "aria-hidden": "true" });
  const horizontalTicks = 5;
  const verticalTicks = 6;

  for (let index = 0; index <= horizontalTicks; index += 1) {
    const ratio = index / horizontalTicks;
    const temperature = yMaximum - ratio * (yMaximum - yMinimum);
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
      }, `${decimal.format(temperature)}°`),
    );
  }

  for (let index = 0; index <= verticalTicks; index += 1) {
    const ratio = index / verticalTicks;
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

  chart.append(grid);

  chart.append(
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
  );

  const ambientY = y(state.airTemperature);
  chart.append(createSvgElement("line", {
    x1: margin.left,
    y1: ambientY,
    x2: width - margin.right,
    y2: ambientY,
    stroke: "#e87945",
    "stroke-width": 2,
    "stroke-dasharray": "8 8",
  }));

  const points = 240;
  const pathData = [];

  for (let index = 0; index <= points; index += 1) {
    const time = (index / points) * state.duration;
    const command = index === 0 ? "M" : "L";
    pathData.push(`${command} ${x(time).toFixed(2)} ${y(temperatureAt(time, state)).toFixed(2)}`);
  }

  chart.append(createSvgElement("path", {
    d: pathData.join(" "),
    fill: "none",
    stroke: "#0c94a5",
    "stroke-width": 5,
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  }));

  const sampleX = x(state.sampleTime);
  const sampleY = y(temperatureAt(state.sampleTime, state));

  chart.append(
    createSvgElement("line", {
      x1: sampleX,
      y1: margin.top,
      x2: sampleX,
      y2: height - margin.bottom,
      stroke: "#7caeb2",
      "stroke-width": 1.5,
      "stroke-dasharray": "4 6",
    }),
    createSvgElement("circle", {
      cx: sampleX,
      cy: sampleY,
      r: 8,
      fill: "#ffffff",
      stroke: "#076a78",
      "stroke-width": 5,
    }),
  );

  const hoverGroup = createSvgElement("g", { visibility: "hidden", "aria-hidden": "true" });
  const hoverLine = createSvgElement("line", {
    y1: margin.top,
    y2: height - margin.bottom,
    stroke: "#12333d",
    "stroke-width": 1,
    opacity: 0.35,
  });
  const hoverCircle = createSvgElement("circle", {
    r: 6,
    fill: "#0c94a5",
    stroke: "#ffffff",
    "stroke-width": 3,
  });
  const tooltip = createSvgElement("g");
  const tooltipBackground = createSvgElement("rect", {
    width: 126,
    height: 50,
    rx: 10,
    fill: "#12333d",
  });
  const tooltipTime = createSvgElement("text", {
    x: 12,
    y: 20,
    fill: "#cde8e9",
    "font-size": 12,
  });
  const tooltipTemperature = createSvgElement("text", {
    x: 12,
    y: 39,
    fill: "#ffffff",
    "font-size": 14,
    "font-weight": 700,
  });

  tooltip.append(tooltipBackground, tooltipTime, tooltipTemperature);
  hoverGroup.append(hoverLine, hoverCircle, tooltip);
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
    const temperature = temperatureAt(time, state);
    const pointY = y(temperature);
    const tooltipX = constrainedX > width - 170 ? constrainedX - 138 : constrainedX + 12;
    const tooltipY = Math.max(margin.top + 5, pointY - 58);

    hoverGroup.setAttribute("visibility", "visible");
    hoverLine.setAttribute("x1", constrainedX);
    hoverLine.setAttribute("x2", constrainedX);
    hoverCircle.setAttribute("cx", constrainedX);
    hoverCircle.setAttribute("cy", pointY);
    tooltip.setAttribute("transform", `translate(${tooltipX} ${tooltipY})`);
    tooltipTime.textContent = `${decimal.format(time)} мин`;
    tooltipTemperature.textContent = `${decimal.format(temperature)} °C`;
  });

  hitArea.addEventListener("pointerleave", () => {
    hoverGroup.setAttribute("visibility", "hidden");
  });

  chart.append(hitArea);
}

function render() {
  const duration = Number(controls.duration.value);
  controls.sampleTime.max = String(duration);

  if (Number(controls.sampleTime.value) > duration) {
    controls.sampleTime.value = String(duration);
  }

  const state = readState();
  const result = temperatureAt(state.sampleTime, state);

  updateControlOutputs(state);
  drawChart(state);

  sampleResultLabel.textContent = `Температура через ${integer.format(state.sampleTime)} мин`;
  sampleTemperature.textContent = `${decimal.format(result)} °C`;
  timeConstant.textContent = `${decimal.format(characteristicTimeMinutes(state))} мин`;
  remainingDifference.textContent = `${decimal.format(Math.abs(state.airTemperature - result))} °C`;
}

Object.values(controls).forEach((control) => {
  control.addEventListener("input", render);
});

resetButton.addEventListener("click", () => {
  for (const [key, value] of Object.entries(defaults)) {
    controls[key].value = String(value);
  }

  render();
});

render();
