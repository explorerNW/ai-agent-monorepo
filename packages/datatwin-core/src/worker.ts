// ==========================================
// Web Worker 逻辑 (计算线程)
// 职责：在独立线程中处理海量数据的矩阵变换与颜色计算，不阻塞 UI
// ==========================================
export const workerCode = `
  let count = 0;
  let time = 0;

  self.onmessage = function(e) {
    const { type, payload } = e.data;

    if (type === 'INIT') {
      count = payload.count;
    } 
    
    if (type === 'TICK') {
      time += 0.016; // 模拟 60fps 的时间增量
      
      // 矩阵数据：每个实例 16 个浮点数 (4x4 矩阵)
      const matrices = new Float32Array(count * 16);
      // 颜色数据：每个实例 3 个浮点数 (RGB)
      const colors = new Float32Array(count * 3);

      for (let i = 0; i < count; i++) {
        // --- 计算矩阵 (位置 Y 轴的波浪运动) ---
        const x = (i % 100) * 0.5 - 25;
        const z = Math.floor(i / 100) * 0.5 - 25;
        const y = Math.sin(time * 2 + i * 0.1) * 2 + 2;

        const offset = i * 16;
        matrices[offset + 0] = 1; matrices[offset + 1] = 0; matrices[offset + 2] = 0; matrices[offset + 3] = 0;
        matrices[offset + 4] = 0; matrices[offset + 5] = 1; matrices[offset + 6] = 0; matrices[offset + 7] = 0;
        matrices[offset + 8] = 0; matrices[offset + 9] = 0; matrices[offset + 10] = 1; matrices[offset + 11] = 0;
        matrices[offset + 12] = x; matrices[offset + 13] = y; matrices[offset + 14] = z; matrices[offset + 15] = 1;

        // --- 计算颜色 (根据高度映射颜色) ---
        const colorOffset = i * 3;
        const normalizedY = (y - 0) / 4; 
        colors[colorOffset + 0] = normalizedY;       // R
        colors[colorOffset + 1] = 0.2;               // G
        colors[colorOffset + 2] = 1.0 - normalizedY; // B
      }

      // ✅ 零拷贝传输：转移 ArrayBuffer 所有权，耗时 < 0.1ms
      self.postMessage(
        { type: 'UPDATE', matrices, colors }, 
        [matrices.buffer, colors.buffer] 
      );
    }
  };
`;
