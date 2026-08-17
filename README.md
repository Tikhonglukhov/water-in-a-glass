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

## Interactive model

Open the [live interactive graph](https://tikhonglukhov.github.io/water-in-a-glass/) and change:

- the initial water temperature;
- the air temperature;
- the mass and specific heat capacity of the water;
- the total heat-transfer coefficient;
- the observation time and graph duration.

The graph and calculated values update immediately. No build step or external JavaScript libraries are required.

## Assumptions

At this level, the model assumes that:

- the air temperature is constant;
- the water has the same temperature everywhere;
- the glass has no heat capacity or thermal resistance;
- there is no evaporation;
- there is no heat exchange with the table;
- all heat-transfer mechanisms are represented by one constant coefficient `k`.

## Run locally

Open `index.html` in a browser. Because the project is fully static, no installation or local server is necessary.

## Next levels

Future versions can introduce surface area, separate heat-transfer paths, the glass itself, evaporation, radiation, spatial temperature differences, and comparison with experimental measurements.
