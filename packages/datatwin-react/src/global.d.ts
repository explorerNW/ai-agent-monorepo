import { TwinViewerProps } from "./index"; // 导入你定义的 Props 接口

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "twin-viewer": TwinViewerProps & {
        ref?: any; // 允许 ref
        className?: string; // 允许 className
        style?: React.CSSProperties; // 允许 style
      };
    }
  }
}
