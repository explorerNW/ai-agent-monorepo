import { useEffect, useRef } from 'react';
import { MapLibreScene } from '@datatwin/gis-maplibre';
import '@datatwin/gis-maplibre/style.css'; // 确保引入样式

export function MapContainer() {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // 1. 创建实例
    const scene = new MapLibreScene();

    try {
      // 2. 初始化
      scene.init(mapRef.current, {
        style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
        center: [111.7, 29.0],
        zoom: 14,
        pitch: 45,
        bearing: 90,
        workerUrl: 'https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl-csp-worker.js',
      });

      // 3. 监听状态
      scene.onReady((map) => {
        console.log('✅ Map is Ready!', map.getCenter());
        // 强制重绘一次，防止初始帧丢失
        map.triggerRepaint();
      });
    } catch (err) {
      console.error('❌ Init Failed:', err);
    }

    return () => {
      scene.destroy();
    };
  }, []);

  return (
    <div
      ref={mapRef}
      style={{
        width: '100%',
        height: '100vh', // ✅ 强制高度
        backgroundColor: '#f0f0f0', // ✅ 背景色，如果地图没出来至少能看到灰色块
      }}
    />
  );
}
