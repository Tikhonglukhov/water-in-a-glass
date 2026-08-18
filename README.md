# Water in a Glass

An interactive, step-by-step physics project about the temperature of water in a glass.

## Level 1: Newton's heating model

The first model treats the water as a single body with one uniform temperature. The surrounding air has a constant temperature, and the heat-transfer rate is proportional to the temperature difference:

```text
mc · dT/dt = k · (T_air - T)
```

With the initial condition `T(0) = T₀`, the solution is:

```text
T(t) = T_air - (T_air - T₀) · exp(-kt / mc)
```

The characteristic time of the process is:

```text
τ = mc / k
```

## Level 2: surface area and vessel shape

The second model expands the total heat-transfer coefficient as `k = αS` and
calculates the exposed area of a vessel with a square base. For a fixed volume:

```text
h = V / a²
S(a) = a² + 4V/a
mc · dT/dt = αS(a) · (T_air - T)
```

The page compares two independently adjustable vessels containing the same
amount of water. Their geometries, exposed areas, characteristic times, and
temperature curves are shown side by side. It also shows the non-monotonic
result: both very narrow and very wide vessels have a large exposed area. The
minimum occurs at `a = (2V)^(1/3)`, where `h = a/2` and the characteristic time
is largest.

## Interactive model

Open the [live interactive graph](https://tikhonglukhov.github.io/water-in-a-glass/) and change:

- the initial water temperature;
- the air temperature;
- the mass and specific heat capacity of the water;
- the total heat-transfer coefficient;
- the observation time and graph duration.

The graph and calculated values update immediately. Every parameter can be changed with a slider or entered precisely as a number. The graph can display either the water temperature `T(t)` or the signed temperature difference `ΔT(t) = T_air - T(t)`.

The page also includes:

- a six-step derivation from the heat-transfer law to the final solution;
- a parameter and unit glossary;
- an explanation of the characteristic time `τ = mc/k`;
- checks of the initial, equilibrium, and equal-temperature limits;
- live results for the selected time;
- responsive layouts for desktop and mobile screens.

Continue with the [Level 2 surface-area lab](https://tikhonglukhov.github.io/water-in-a-glass/levels/2-surface-area/), where you can change the shared volume and heat-transfer coefficient, set two square-base widths independently, inspect both geometries, and compare their temperature curves.

No build step or external JavaScript libraries are required.

## Assumptions

At the first two levels, the model assumes that:

- the air temperature is constant;
- the water has the same temperature everywhere;
- the glass has no heat capacity or thermal resistance;
- there is no evaporation;
- there is no heat exchange with the table;
- the heat-transfer coefficient per unit area `α` is constant.

## Run locally

Open `index.html` in a browser. Because the project is fully static, no installation or local server is necessary.

## Next levels

Each level has its own page inside the same site. Future levels can introduce separate heat-transfer paths, the glass itself, evaporation, radiation, spatial temperature differences, and comparison with experimental measurements.
