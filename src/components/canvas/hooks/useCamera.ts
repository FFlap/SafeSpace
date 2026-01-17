import { useState, useCallback } from "react";

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export function useCamera(initialCamera?: Partial<Camera>) {
  const [camera, setCamera] = useState<Camera>({
    x: initialCamera?.x ?? 0,
    y: initialCamera?.y ?? 0,
    zoom: initialCamera?.zoom ?? 1,
  });

  const pan = useCallback((dx: number, dy: number) => {
    setCamera((prev) => ({
      ...prev,
      x: prev.x + dx / prev.zoom,
      y: prev.y + dy / prev.zoom,
    }));
  }, []);

  const zoomTo = useCallback(
    (
      newZoom: number,
      screenX: number,
      screenY: number,
      canvasWidth: number,
      canvasHeight: number,
      minZoom = 0.1,
      maxZoom = 3
    ) => {
      setCamera((prev) => {
        const clampedZoom = Math.max(minZoom, Math.min(maxZoom, newZoom));
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        const offsetX =
          (screenX - centerX) / prev.zoom - (screenX - centerX) / clampedZoom;
        const offsetY =
          (screenY - centerY) / prev.zoom - (screenY - centerY) / clampedZoom;

        return {
          x: prev.x + offsetX,
          y: prev.y + offsetY,
          zoom: clampedZoom,
        };
      });
    },
    []
  );

  const zoomBy = useCallback(
    (
      delta: number,
      screenX: number,
      screenY: number,
      canvasWidth: number,
      canvasHeight: number,
      minZoom = 0.1,
      maxZoom = 3
    ) => {
      setCamera((prev) => {
        const nextZoom = prev.zoom * (1 + delta);
        const newZoom = Math.max(minZoom, Math.min(maxZoom, nextZoom));
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        const offsetX =
          (screenX - centerX) / prev.zoom - (screenX - centerX) / newZoom;
        const offsetY =
          (screenY - centerY) / prev.zoom - (screenY - centerY) / newZoom;

        return {
          x: prev.x + offsetX,
          y: prev.y + offsetY,
          zoom: newZoom,
        };
      });
    },
    []
  );

  const resetCamera = useCallback(() => {
    setCamera({ x: 0, y: 0, zoom: 1 });
  }, []);

  // Convert screen coordinates to world coordinates
  const screenToWorld = useCallback(
    (screenX: number, screenY: number, canvasWidth: number, canvasHeight: number) => {
      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;

      return {
        x: screenX / camera.zoom - centerX / camera.zoom + camera.x,
        y: screenY / camera.zoom - centerY / camera.zoom + camera.y,
      };
    },
    [camera]
  );

  // Convert world coordinates to screen coordinates
  const worldToScreen = useCallback(
    (worldX: number, worldY: number, canvasWidth: number, canvasHeight: number) => {
      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;

      return {
        x: (worldX - camera.x) * camera.zoom + centerX,
        y: (worldY - camera.y) * camera.zoom + centerY,
      };
    },
    [camera]
  );

  return {
    camera,
    setCamera,
    pan,
    zoomTo,
    zoomBy,
    resetCamera,
    screenToWorld,
    worldToScreen,
  };
}
