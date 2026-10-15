import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as echarts from 'echarts';
import { TwinViewer } from '@datatwin/react';
import type { TwinViewerRef } from '@datatwin/react';
import type { BuildingData } from '@datatwin/core';

// 模拟业务数据
const BUILDINGS: BuildingData[] = [
  { id: 'b1', name: 'A栋-研发中心', value: 85, position: [-4, 0, -4], color: 0x3498db },
  { id: 'b2', name: 'B栋-数据中心', value: 62, position: [4, 0, -4], color: 0x2ecc71 },
  { id: 'b3', name: 'C栋-行政办公', value: 45, position: [-4, 0, 4], color: 0xe74c3c },
  { id: 'b4', name: 'D栋-仓储物流', value: 30, position: [4, 0, 4], color: 0xf39c12 },
];

// 根据建筑生成 ECharts 配置
const getChartOption = (building: BuildingData): echarts.EChartsOption => ({
  title: { text: `${building.name} - 实时能耗监控`, textStyle: { color: '#fff', fontSize: 14 } },
  tooltip: { trigger: 'axis' },
  grid: { top: 40, right: 20, bottom: 30, left: 50 },
  xAxis: {
    type: 'category',
    data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
    axisLabel: { color: '#aaa' },
  },
  yAxis: {
    type: 'value',
    name: 'kWh',
    axisLabel: { color: '#aaa' },
    splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
  },
  series: [
    {
      name: '能耗',
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      data: [
        120,
        90,
        building.value * 2.5,
        building.value * 3,
        building.value * 2.8,
        building.value * 1.5,
        100,
      ],
      itemStyle: { color: '#ffaa00' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(255,170,0,0.4)' },
          { offset: 1, color: 'rgba(255,170,0,0.02)' },
        ]),
      },
    },
  ],
});

export const DataTwin: React.FC = () => {
  const viewerRef = useRef<TwinViewerRef>(null);
  const chartDomRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  // ✅ 1. 初始化 ECharts 实例（仅执行一次）
  useEffect(() => {
    if (!chartDomRef.current) return;
    chartInstanceRef.current = echarts.init(chartDomRef.current);

    // ✅ 双向交互：点击图表中的数据点，反向联动 3D 视角
    chartInstanceRef.current.on('click', (params) => {
      if (params.componentType === 'series' && selectedId) {
        console.log(`[ECharts → 3D] 点击了 ${params.name} 时刻的数据，值为 ${params.value}`);
        // 这里可以触发 3D 动画，例如让对应建筑闪烁或相机拉近
        viewerRef.current?.flyTo(selectedId);
      }
    });

    const handleResize = () => chartInstanceRef.current?.resize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstanceRef.current?.dispose();
      chartInstanceRef.current = null;
    };
  }, []); // 注意：selectedId 不在依赖中，避免重复 init

  // ✅ 2. 当选中建筑变化时，更新 ECharts 配置
  useEffect(() => {
    if (!chartInstanceRef.current) return;
    if (selectedId) {
      const building = BUILDINGS.find((b) => b.id === selectedId);
      if (building) {
        chartInstanceRef.current.setOption(getChartOption(building), true); // true = 不合并，完全替换
      }
    } else {
      // 未选中时显示空状态或默认提示
      chartInstanceRef.current.clear();
    }
  }, [selectedId]);

  // ✅ 3. 监听 3D 交互事件
  const handleTwinInteraction = useCallback((e: CustomEvent) => {
    const { type, id } = e.detail;
    if (type === 'object-click') {
      setSelectedId(id);
    }
  }, []);

  // 初始化注册建筑
  useEffect(() => {
    const timer = setTimeout(() => {
      BUILDINGS.forEach((b) => viewerRef.current?.registerBuilding(b));
    }, 100); // 等待 Web Component 就绪
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        width: '80vw',
        height: '50vh',
        background: '#0a0a0a',
        overflow: 'hidden',
      }}
    >
      {/* ====== Layer 1: Three.js 3D 场景 ====== */}
      <TwinViewer
        ref={viewerRef}
        theme="dark"
        onTwinInteraction={handleTwinInteraction}
        style={{ width: '100%', height: '100%' }}
      />
      {/* ====== Layer 2: ECharts 浮层面板 ====== */}
      <div
        style={{
          position: 'absolute',
          right: 20,
          top: 20,
          width: 420,
          height: 320,
          background: 'rgba(10, 10, 20, 0.85)',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
          padding: 16,
          transition: 'opacity 0.3s ease, transform 0.3s ease',
          opacity: selectedId ? 1 : 0,
          visibility: selectedId ? 'visible' : 'hidden', // ✅ 关键改动
          transform: selectedId ? 'translateX(0)' : 'translateX(10px)',
          pointerEvents: selectedId ? 'auto' : 'none',
        }}
      >
        {/* chartDomRef 不再需要 display 切换，始终渲染 */}
        <div ref={chartDomRef} style={{ width: '100%', height: '100%' }} />

        {!selectedId && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666',
              fontSize: 14,
              pointerEvents: 'none',
            }}
          >
            👆 点击 3D 场景中的建筑查看数据
          </div>
        )}
      </div>
      {/* ====== Layer 3: 底部快捷导航 ====== */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: 24,
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 10,
        }}
      >
        {BUILDINGS.map((b) => (
          <button
            key={b.id}
            onClick={() => {
              setSelectedId(b.id);
              viewerRef.current?.flyTo(b.id);
            }}
            style={{
              padding: '8px 20px',
              borderRadius: 20,
              border:
                selectedId === b.id ? '1px solid #ffaa00' : '1px solid rgba(255,255,255,0.15)',
              background: selectedId === b.id ? 'rgba(255,170,0,0.2)' : 'rgba(255,255,255,0.06)',
              color: selectedId === b.id ? '#ffaa00' : '#ccc',
              cursor: 'pointer',
              fontSize: 13,
              transition: 'all 0.2s',
            }}
          >
            {b.name}
          </button>
        ))}
      </div>
    </div>
  );
};
export default DataTwin;
