import { TwinChartElement } from "./index";

if (!customElements.get("twin-chart")) {
  customElements.define("twin-chart", TwinChartElement);
}
