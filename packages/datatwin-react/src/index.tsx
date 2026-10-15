import React, {
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import type { BuildingData } from "@datatwin/core";
import "@datatwin/elements";

export interface TwinViewerRef {
  registerBuilding: (data: BuildingData) => void;
  flyTo: (id: string) => void;
  resize: () => void;
  dispose: () => void;
}

export interface TwinViewerProps extends React.HTMLAttributes<HTMLElement> {
  theme?: "dark" | "light";
  onTwinInteraction?: (event: CustomEvent) => void;
}

const TwinViewer = forwardRef<TwinViewerRef, TwinViewerProps>((props, ref) => {
  const {
    theme = "dark",
    onTwinInteraction,
    style,
    className,
    ...restProps
  } = props;

  const innerRef = useRef<HTMLElement & TwinViewerRef>(null);

  useImperativeHandle(ref, () => ({
    registerBuilding: (data: BuildingData) =>
      innerRef.current?.registerBuilding(data),
    flyTo: (id: string) => innerRef.current?.flyTo(id),
    resize: () => innerRef.current?.resize(),
    dispose: () => innerRef.current?.dispose(),
  }));

  useEffect(() => {
    const el = innerRef.current;
    if (!el || !onTwinInteraction) return;

    const handler = (e: Event) => onTwinInteraction(e as CustomEvent);
    el.addEventListener("twin-interaction", handler);
    return () => el.removeEventListener("twin-interaction", handler);
  }, [onTwinInteraction]);

  return (
    <twin-viewer
      ref={innerRef}
      theme={theme}
      className={className}
      style={style}
      {...restProps}
    />
  );
});

TwinViewer.displayName = "TwinViewer";
export { TwinViewer };
