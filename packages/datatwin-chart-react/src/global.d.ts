import type { TwinChartProps } from "@datatwin/chart-core"; // 导入你定义的 Props 接口

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "twin-chart": TwinChartProps & {
        ref?: any; // 允许 ref
        className?: string; // 允许 className
        style?: React.CSSProperties | CSSStyleDeclaration; // 允许 style
      };
    }
  }
}
