// =====================================================================
// 职责：纯粹的 3D 引擎，负责 Three.js 场景、高性能渲染、事件抛出
// =====================================================================

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { workerCode } from "./worker";

export interface BuildingData {
  id: string;
  name: string;
  value: number;
  position: [number, number, number];
  color?: number;
}

export class TwinCore {
  private container: HTMLElement; // 容器元素，用于挂载渲染器
  private scene: THREE.Scene; // 场景对象，包含所有物体
  private camera: THREE.PerspectiveCamera; // 相机对象，控制视角和渲染视野
  private renderer: THREE.WebGLRenderer; // 渲染器对象，负责场景的渲染和输出到画布
  private controls: OrbitControls; // 控制器对象，用于交互控制相机视角

  // 普通 Mesh 存储 (适用于少量、需独立交互的物体)
  private objects: Map<string, THREE.Mesh> = new Map();
  private dataMap: Map<string, BuildingData> = new Map();

  // InstancedMesh 存储 (适用于 Worker 驱动的海量动态物体)
  private instanceMesh: THREE.InstancedMesh | null = null;

  // ✅ 核心优化：使用 Map 替代 Array 遍历，实现 O(1) 查找
  // 存储 InstancedMesh 中 业务ID -> 实例索引(index) 的映射
  private instanceIndexMap: Map<string, number> = new Map();

  private worker: Worker | null = null;
  private animationId: number | null = null;

  private highlightedId: string | null = null;

  // ✅ 相机动画状态管理
  private isFlying = false;
  private flyStartTime = 0;
  private flyDuration = 1500; // 飞行持续时间 ms
  private startPos = new THREE.Vector3();
  private startTarget = new THREE.Vector3();
  private endPos = new THREE.Vector3();
  private endTarget = new THREE.Vector3();

  constructor(container: HTMLElement, theme: "dark" | "light" = "dark") {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(
      theme === "light" ? 0xf0f0f0 : 0x111111,
    );

    this.camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000,
    );
    this.camera.position.set(30, 20, 30);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 5);
    this.scene.add(dirLight);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100),
      new THREE.MeshStandardMaterial({
        color: theme === "light" ? 0xcccccc : 0x222222,
      }),
    );
    floor.rotation.x = -Math.PI / 2;
    this.scene.add(floor);

    this.renderer.domElement.addEventListener("click", (e) =>
      this.handleMouseClick(e),
    );
    this.animate();
  }

  /** 注册单个静态建筑 */
  public registerBuilding(data: BuildingData) {
    this.dataMap.set(data.id, data);
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({
      color: data.color || 0x0077ff,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...data.position);
    mesh.scale.set(1, Math.max(0.1, data.value / 10), 1);
    mesh.name = data.id;
    this.scene.add(mesh);
    this.objects.set(data.id, mesh);
  }

  /** 启动 Worker 驱动的海量实例渲染 (10万+ 级别) */
  public startMassiveSimulation(count: number) {
    const geometry = new THREE.BoxGeometry(0.3, 1, 0.3);
    const material = new THREE.MeshStandardMaterial({
      roughness: 0.4,
      metalness: 0.6,
    });

    this.instanceMesh = new THREE.InstancedMesh(geometry, material, count);
    this.instanceMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    const colorArray = new Float32Array(count * 3).fill(1);
    this.instanceMesh.instanceColor = new THREE.InstancedBufferAttribute(
      colorArray,
      3,
    );
    this.instanceMesh.instanceColor.setUsage(THREE.DynamicDrawUsage);

    this.scene.add(this.instanceMesh);

    // 初始化 Worker
    const blob = new Blob([workerCode], { type: "application/javascript" });
    this.worker = new Worker(URL.createObjectURL(blob));
    this.worker.onmessage = (e) => this.handleWorkerMessage(e.data);
    this.worker.postMessage({ type: "INIT", payload: { count } });
  }

  /**
   * ✅ 注册海量实例时，同步建立 O(1) 的 ID-Index 映射
   * 注意：这里只存 index，不存完整的业务数据，以节省主线程内存
   */
  public registerMassiveInstances(
    dataList: { id: string; position: [number, number, number] }[],
  ) {
    if (!this.instanceMesh) return;

    dataList.forEach((data, index) => {
      this.instanceIndexMap.set(data.id, index);

      // 初始化矩阵 (这里仅为演示，实际位置由 Worker 接管)
      const matrix = new THREE.Matrix4();
      matrix.setPosition(data.position[0], data.position[1], data.position[2]);
      this.instanceMesh?.setMatrixAt(index, matrix);
    });
    this.instanceMesh.instanceMatrix.needsUpdate = true;
  }

  /** 接收 Worker 的零拷贝数据 */
  private handleWorkerMessage(data: any) {
    if (data.type === "UPDATE" && this.instanceMesh) {
      // 直接替换底层 TypedArray，绕过 Three.js API 开销
      this.instanceMesh.instanceMatrix.array = data.matrices;
      this.instanceMesh.instanceMatrix.needsUpdate = true;

      if (this.instanceMesh.instanceColor) {
        this.instanceMesh.instanceColor.array = data.colors;
        this.instanceMesh.instanceColor.needsUpdate = true;
      }
    }
  }

  /** 射线检测 (针对普通 Mesh) */
  private handleMouseClick(event: MouseEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);

    const meshes = Array.from(this.objects.values());
    const intersects = raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const obj = intersects[0].object as THREE.Mesh;
      if (obj.name && this.dataMap.has(obj.name)) {
        const data = this.dataMap.get(obj.name)!;

        // O(1) 重置上一个高亮
        if (this.highlightedId && this.highlightedId !== obj.name) {
          const prevMesh = this.objects.get(this.highlightedId);
          if (prevMesh) {
            (prevMesh.material as THREE.MeshStandardMaterial).color.set(
              this.dataMap.get(this.highlightedId)?.color || 0x0077ff,
            );
          }
        }

        (obj.material as THREE.MeshStandardMaterial).color.set(0xffaa00);
        this.highlightedId = obj.name;

        this.dispatchInteraction(obj.name, data);
      }
    }
  }

  private dispatchInteraction(id: string, data: BuildingData) {
    this.container.dispatchEvent(
      new CustomEvent("twin-interaction", {
        detail: { type: "object-click", id, data },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /**
   * ✅ 核心改造：适配 Worker 架构的 flyTo
   * @param targetName 目标 ID
   * @param duration 飞行时间 (ms)
   */
  public flyTo(targetName: string, duration: number = 1500) {
    let targetPos: THREE.Vector3 | undefined;

    // 1. 优先在普通 Mesh 中查找 (O(1))
    const staticMesh = this.objects.get(targetName);
    if (staticMesh) {
      targetPos = staticMesh.position.clone();
    }
    // 2. 如果在 InstancedMesh 中，通过 O(1) 的 Map 获取 index，再提取实时矩阵位置
    else if (this.instanceMesh) {
      const index = this.instanceIndexMap.get(targetName);

      if (index !== undefined) {
        const matrix = new THREE.Matrix4();
        // ✅ 关键点：getMatrixAt 读取的是当前帧 Worker 刚刚写入的最新 buffer
        this.instanceMesh.getMatrixAt(index, matrix);
        targetPos = new THREE.Vector3().setFromMatrixPosition(matrix);
      }
    }

    // 3. 找到目标后，触发平滑飞行动画
    if (targetPos) {
      this.startFlyAnimation(targetPos, duration);
    } else {
      console.warn(
        `[TwinCore] flyTo failed: Target '${targetName}' not found.`,
      );
    }
  }

  /**
   * ✅ 直接飞行到指定坐标 (备用 API，适用于 Worker 动态计算且未建立 ID 映射的场景)
   */
  public flyToPosition(
    position: [number, number, number],
    duration: number = 1500,
  ) {
    const targetPos = new THREE.Vector3(...position);
    this.startFlyAnimation(targetPos, duration);
  }

  /**
   * 内部方法：启动平滑飞行动画
   */
  private startFlyAnimation(targetPos: THREE.Vector3, duration: number) {
    this.isFlying = true;
    this.flyDuration = duration;
    this.flyStartTime = performance.now();

    this.startPos.copy(this.camera.position);
    this.startTarget.copy(this.controls.target);

    this.endTarget.copy(targetPos);
    // 相机终点：保持在目标上方偏侧方，形成观察视角
    this.endPos.set(targetPos.x + 10, targetPos.y + 8, targetPos.z + 10);

    this.controls.enabled = false; // 飞行期间禁用用户控制
  }

  private updateFlyAnimation() {
    if (!this.isFlying) return;

    const now = performance.now();
    const progress = Math.min((now - this.flyStartTime) / this.flyDuration, 1);

    // easeInOutCubic 缓动
    const ease =
      progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    this.camera.position.lerpVectors(this.startPos, this.endPos, ease);
    this.controls.target.lerpVectors(this.startTarget, this.endTarget, ease);
    this.controls.update();

    if (progress >= 1) {
      this.isFlying = false;
      this.controls.enabled = true;
    }
  }

  public resize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  /** 彻底的内存回收 */
  public dispose() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.worker?.terminate();

    this.objects.forEach((mesh) => {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
      this.scene.remove(mesh);
    });

    if (this.instanceMesh) {
      this.instanceMesh.geometry.dispose();
      (this.instanceMesh.material as THREE.Material).dispose();
      this.scene.remove(this.instanceMesh);
    }

    this.renderer.dispose();
    this.container.innerHTML = "";
  }

  private animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    // ✅ 更新飞行动画
    this.updateFlyAnimation();

    // 只有在非飞行状态下才更新阻尼控制器
    if (!this.isFlying) {
      this.controls.update();
    }

    // 每帧触发 Worker 计算
    if (this.worker) {
      this.worker.postMessage({ type: "TICK" });
    }

    this.renderer.render(this.scene, this.camera);
  }
}
