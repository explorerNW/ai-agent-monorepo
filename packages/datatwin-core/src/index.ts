// =====================================================================
// 职责：纯粹的 3D 引擎，负责 Three.js 场景、高性能渲染、事件抛出
// =====================================================================
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export interface BuildingData {
  id: string;
  name: string;
  value: number;
  position: [number, number, number];
  color?: number;
}

export interface TwinConfig {
  theme?: "dark" | "light";
  initialCameraPosition?: [number, number, number];
}

export class TwinCore {
  private container: HTMLElement; // 容器元素，用于挂载渲染器
  private scene: THREE.Scene; // 场景对象，包含所有物体
  private camera: THREE.PerspectiveCamera; // 相机对象，控制视角和渲染视野
  private renderer: THREE.WebGLRenderer; // 渲染器对象，负责场景的渲染和输出到画布
  private controls: OrbitControls; // 控制器对象，用于交互控制相机视角

  // 普通 Mesh 存储 (适用于少量、需独立控制的物体)
  private objects: Map<string, THREE.Mesh> = new Map();
  private dataMap: Map<string, BuildingData> = new Map();

  // InstancedMesh 存储 (适用于大批量、同构物体，极致性能)
  private instanceMesh: THREE.InstancedMesh | null = null;
  private instanceDataMap: Map<number, BuildingData> = new Map();
  private dummy = new THREE.Object3D();

  private animationId: number | null = null;

  // ✅ 性能优化：记录高亮状态，避免 O(N) 遍历重置
  private highlightedId: string | null = null;
  private highlightedInstanceId: number | null = null;

  constructor(container: HTMLElement, config: TwinConfig = {}) {
    this.container = container;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(
      config.theme === "light" ? 0xf0f0f0 : 0x111111,
    );

    this.camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000,
    );
    if (config.initialCameraPosition) {
      this.camera.position.set(...config.initialCameraPosition);
    } else {
      this.camera.position.set(10, 8, 10);
    }

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
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshStandardMaterial({
        color: config.theme === "light" ? 0xcccccc : 0x222222,
      }),
    );
    floor.rotation.x = -Math.PI / 2;
    this.scene.add(floor);

    this.renderer.domElement.addEventListener("click", (e) =>
      this.handleMouseClick(e),
    );
    this.animate();
  }

  /**
   * 注册单个建筑 (适用于小场景或需要独立动画的物体)
   */
  public registerBuilding(data: BuildingData) {
    this.dataMap.set(data.id, data);
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({
      color: data.color || 0x0077ff,
      roughness: 0.3,
      metalness: 0.2,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...data.position);
    mesh.scale.set(1, Math.max(0.1, data.value / 10), 1);
    mesh.name = data.id;
    this.scene.add(mesh);
    this.objects.set(data.id, mesh);
  }

  /**
   * ✅ 批量注册建筑 (InstancedMesh 高性能模式)
   * 适用于 500+ 以上的大场景，将 Draw Call 降至 1
   */
  public registerBuildingsBatch(dataList: BuildingData[]) {
    if (dataList.length === 0) return;

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({
      roughness: 0.3,
      metalness: 0.2,
    });

    this.instanceMesh = new THREE.InstancedMesh(
      geometry,
      material,
      dataList.length,
    );
    this.instanceMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    const color = new THREE.Color();

    dataList.forEach((data, index) => {
      this.dummy.position.set(...data.position);
      this.dummy.scale.set(1, Math.max(0.1, data.value / 10), 1);
      this.dummy.updateMatrix();

      this.instanceMesh!.setMatrixAt(index, this.dummy.matrix);
      color.set(data.color || 0x0077ff);
      this.instanceMesh!.setColorAt(index, color);

      this.instanceDataMap.set(index, data);
    });

    this.instanceMesh.instanceMatrix.needsUpdate = true;
    if (this.instanceMesh.instanceColor)
      this.instanceMesh.instanceColor.needsUpdate = true;

    this.scene.add(this.instanceMesh);
  }

  private handleMouseClick(event: MouseEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);

    // 1. 检测普通 Mesh
    const meshes = Array.from(this.objects.values());
    const intersects = raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const obj = intersects[0].object;
      if (obj instanceof THREE.Mesh && obj.name && this.dataMap.has(obj.name)) {
        const data = this.dataMap.get(obj.name)!;

        // 重置上一个高亮 (O(1))
        if (this.highlightedId && this.highlightedId !== obj.name) {
          const prevMesh = this.objects.get(this.highlightedId);
          if (prevMesh) {
            const prevColor =
              this.dataMap.get(this.highlightedId)?.color || 0x0077ff;
            (prevMesh.material as THREE.MeshStandardMaterial).color.set(
              prevColor,
            );
          }
        }

        (obj.material as THREE.MeshStandardMaterial).color.set(0xffaa00);
        this.highlightedId = obj.name;

        this.dispatchInteraction(obj.name, data);
        return; // 命中普通 Mesh 后直接返回
      }
    }

    // 2. 检测 InstancedMesh
    if (this.instanceMesh) {
      const instIntersects = raycaster.intersectObject(this.instanceMesh);
      if (
        instIntersects.length > 0 &&
        instIntersects[0].instanceId !== undefined
      ) {
        const instanceId = instIntersects[0].instanceId;
        const data = this.instanceDataMap.get(instanceId);

        if (data) {
          // 重置上一个高亮 (O(1))
          if (
            this.highlightedInstanceId !== null &&
            this.highlightedInstanceId !== instanceId
          ) {
            const prevData = this.instanceDataMap.get(
              this.highlightedInstanceId,
            );
            if (prevData) {
              this.instanceMesh.setColorAt(
                this.highlightedInstanceId,
                new THREE.Color(prevData.color || 0x0077ff),
              );
            }
          }

          this.instanceMesh.setColorAt(instanceId, new THREE.Color(0xffaa00));
          this.instanceMesh.instanceColor!.needsUpdate = true;
          this.highlightedInstanceId = instanceId;

          this.dispatchInteraction(data.id, data);
        }
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

  public flyTo(targetName: string) {
    // 优先在普通 Mesh 中查找
    let targetPos = this.objects.get(targetName)?.position;

    // 如果在 InstancedMesh 中，通过矩阵获取位置
    if (!targetPos && this.instanceMesh) {
      const entry = Array.from(this.instanceDataMap.entries()).find(
        ([_, d]) => d.id === targetName,
      );
      if (entry) {
        const matrix = new THREE.Matrix4();
        this.instanceMesh.getMatrixAt(entry[0], matrix);
        targetPos = new THREE.Vector3().setFromMatrixPosition(matrix);
      }
    }

    if (targetPos) {
      this.controls.target.copy(targetPos);
      this.camera.position.set(
        targetPos.x + 5,
        targetPos.y + 5,
        targetPos.z + 5,
      );
      this.controls.update();
    }
  }

  public resize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  public dispose() {
    if (this.animationId) cancelAnimationFrame(this.animationId);

    // ✅ 彻底释放普通 Mesh 资源
    this.objects.forEach((mesh) => {
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => m.dispose());
      } else {
        mesh.material.dispose();
      }
      this.scene.remove(mesh);
    });

    // ✅ 彻底释放 InstancedMesh 资源
    if (this.instanceMesh) {
      this.instanceMesh.geometry.dispose();
      (this.instanceMesh.material as THREE.Material).dispose();
      this.scene.remove(this.instanceMesh);
    }

    this.objects.clear();
    this.dataMap.clear();
    this.instanceDataMap.clear();

    this.renderer.dispose();
    this.container.innerHTML = "";
  }

  private animate() {
    this.animationId = requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
