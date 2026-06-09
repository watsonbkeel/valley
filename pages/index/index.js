const { createScopedThreejs } = require('../../miniprogram_npm/threejs-miniprogram');

const STORAGE_KEY = 'valley_progress';
const TILE_SIZE = 1.2;
const TILE_HEIGHT = 0.45;
const PLAYER_HEIGHT = 0.55;
const PLAYER_MOVE_DURATION = 240;
const ROTATION_DURATION = 260;

const COLORS = {
  background: 0xf4f1ff,
  path: 0xffffff,
  mechanism: 0x8fd3ff,
  goal: 0xffd166,
  player: 0xff5d73,
  shadow: 0xd8d0f2,
};

const levels = [
  [
    [1, 1, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 2, 1, 1, 0],
    [0, 0, 0, 1, 0],
    [0, 0, 0, 3, 0],
  ],
  [
    [1, 1, 0, 0, 0],
    [0, 1, 0, 2, 0],
    [0, 1, 1, 1, 0],
    [0, 0, 0, 1, 0],
    [0, 0, 0, 3, 0],
  ],
  [
    [1, 1, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 2, 1, 0, 0],
    [0, 1, 1, 1, 0],
    [0, 0, 0, 3, 0],
  ],
  [
    [1, 0, 0, 0, 0],
    [1, 1, 1, 0, 0],
    [0, 0, 1, 2, 0],
    [0, 0, 1, 1, 1],
    [0, 0, 0, 0, 3],
  ],
  [
    [1, 1, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 2, 1, 1, 0],
    [0, 1, 0, 1, 0],
    [0, 1, 1, 3, 0],
  ],
];

function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

Page({
  data: {},

  onReady() {
    this.tileMeshes = [];
    this.interactiveMeshes = [];
    this.sceneObjects = [];
    this.activeRotations = [];
    this.activeMove = null;
    this.currentLevelIndex = this.loadSavedLevel();
    this.playerRow = 0;
    this.playerCol = 0;
    this.isUnloading = false;
    this.viewportWidth = 0;
    this.viewportHeight = 0;

    this.initCanvas();
  },

  onUnload() {
    this.isUnloading = true;
    if (this.rafId != null && this.canvas && this.canvas.cancelAnimationFrame) {
      this.canvas.cancelAnimationFrame(this.rafId);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  },

  loadSavedLevel() {
    try {
      const saved = wx.getStorageSync(STORAGE_KEY);
      if (typeof saved === 'number' && saved >= 0 && saved < levels.length) {
        return saved;
      }
    } catch (error) {
      console.warn('loadSavedLevel failed', error);
    }
    return 0;
  },

  saveLevel(index) {
    try {
      wx.setStorageSync(STORAGE_KEY, index);
    } catch (error) {
      console.warn('saveLevel failed', error);
    }
  },

  initCanvas() {
    const query = wx.createSelectorQuery().in(this);
    query.select('#webgl').node().exec((res) => {
      const canvas = res && res[0] && res[0].node;
      if (!canvas) {
        console.error('WebGL canvas not found');
        return;
      }

      this.canvas = canvas;
      this.THREE = createScopedThreejs(canvas);

      const systemInfo = wx.getSystemInfoSync();
      const dpr = systemInfo.pixelRatio || 1;
      const width = systemInfo.windowWidth;
      const height = systemInfo.windowHeight;
      this.viewportWidth = width;
      this.viewportHeight = height;

      canvas.width = width * dpr;
      canvas.height = height * dpr;

      const THREE = this.THREE;
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(COLORS.background);

      this.renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
      });
      this.renderer.setPixelRatio(dpr);
      this.renderer.setSize(width, height);

      const aspect = width / height;
      const frustumSize = 8.5;
      this.camera = new THREE.OrthographicCamera(
        (-frustumSize * aspect) / 2,
        (frustumSize * aspect) / 2,
        frustumSize / 2,
        -frustumSize / 2,
        0.1,
        100
      );
      this.camera.position.set(6.8, 7.6, 6.8);
      this.camera.lookAt(0, 0, 0);

      this.raycaster = new THREE.Raycaster();
      this.pointer = new THREE.Vector2();
      this.clock = new THREE.Clock();

      this.addSceneDecorations();
      this.buildLevel(this.currentLevelIndex);
      this.bindTouchEvents();
      this.renderLoop();
    });
  },

  addSceneDecorations() {
    const THREE = this.THREE;

    const ambient = new THREE.AmbientLight(0xffffff, 1.2);
    this.scene.add(ambient);

    const shadowPlane = new THREE.Mesh(
      new THREE.CircleGeometry(7.5, 48),
      new THREE.MeshBasicMaterial({
        color: COLORS.shadow,
        transparent: true,
        opacity: 0.35,
      })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -0.62;
    this.scene.add(shadowPlane);
  },

  bindTouchEvents() {
    if (!this.canvas || !this.canvas.addEventListener) {
      return;
    }

    this.handleTouch = (event) => {
      if (!event.touches || !event.touches.length) {
        return;
      }
      this.processTap(event.touches[0]);
    };

    this.canvas.addEventListener('touchstart', this.handleTouch);
  },

  processTap(touch) {
    if (!this.camera || !this.renderer || this.activeMove || this.activeRotations.length) {
      return;
    }

    const width = this.viewportWidth || this.canvas.width;
    const height = this.viewportHeight || this.canvas.height;
    const x = touch.x != null ? touch.x : touch.clientX;
    const y = touch.y != null ? touch.y : touch.clientY;

    if (x == null || y == null) {
      return;
    }

    this.pointer.x = (x / width) * 2 - 1;
    this.pointer.y = -(y / height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.interactiveMeshes, false);
    if (!hits.length) {
      return;
    }

    const target = hits[0].object;
    const { row, col, type } = target.userData;
    if (type === 2) {
      this.rotateMechanism(target);
      return;
    }

    if (type === 1 || type === 3) {
      this.movePlayerTo(row, col);
    }
  },

  gridToWorld(row, col) {
    const grid = levels[this.currentLevelIndex];
    const size = grid.length;
    const originOffset = ((size - 1) * TILE_SIZE) / 2;
    return {
      x: col * TILE_SIZE - originOffset,
      y: 0,
      z: row * TILE_SIZE - originOffset,
    };
  },

  buildLevel(index) {
    const THREE = this.THREE;
    const level = levels[index];

    this.clearLevelObjects();
    this.tileMeshes = [];
    this.interactiveMeshes = [];
    this.sceneObjects = [];
    this.activeRotations = [];
    this.activeMove = null;
    this.currentLevelIndex = index;
    this.saveLevel(index);
    this.playerRow = 0;
    this.playerCol = 0;

    for (let row = 0; row < level.length; row += 1) {
      for (let col = 0; col < level[row].length; col += 1) {
        const type = level[row][col];
        if (type === 0) {
          continue;
        }

        const tile = this.createTileMesh(type, row, col);
        this.scene.add(tile);
        this.tileMeshes.push(tile);
        this.interactiveMeshes.push(tile);
        this.sceneObjects.push(tile);
      }
    }

    this.player = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.26, PLAYER_HEIGHT, 18),
      new THREE.MeshBasicMaterial({ color: COLORS.player })
    );
    this.scene.add(this.player);
    this.sceneObjects.push(this.player);
    this.placePlayerAt(this.playerRow, this.playerCol);
  },

  clearLevelObjects() {
    if (!this.sceneObjects || !this.scene) {
      return;
    }

    this.sceneObjects.forEach((object) => {
      this.scene.remove(object);
      if (object.geometry) {
        object.geometry.dispose();
      }
      if (object.material) {
        object.material.dispose();
      }
    });
    this.sceneObjects = [];
  },

  createTileMesh(type, row, col) {
    const THREE = this.THREE;
    const world = this.gridToWorld(row, col);

    let color = COLORS.path;
    if (type === 2) {
      color = COLORS.mechanism;
    } else if (type === 3) {
      color = COLORS.goal;
    }

    const geometry = new THREE.BoxGeometry(TILE_SIZE, TILE_HEIGHT, TILE_SIZE);
    const material = new THREE.MeshBasicMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(world.x, TILE_HEIGHT / 2 - 0.2, world.z);
    mesh.userData = { row, col, type };
    return mesh;
  },

  placePlayerAt(row, col) {
    const world = this.gridToWorld(row, col);
    this.player.position.set(world.x, TILE_HEIGHT / 2 + PLAYER_HEIGHT / 2, world.z);
  },

  movePlayerTo(row, col) {
    if (row === this.playerRow && col === this.playerCol) {
      return;
    }

    const world = this.gridToWorld(row, col);
    const from = this.player.position.clone();
    const to = new this.THREE.Vector3(
      world.x,
      TILE_HEIGHT / 2 + PLAYER_HEIGHT / 2,
      world.z
    );

    this.activeMove = {
      startTime: Date.now(),
      duration: PLAYER_MOVE_DURATION,
      from,
      to,
      row,
      col,
    };
  },

  rotateMechanism(mesh) {
    if (!mesh || this.activeRotations.some((item) => item.mesh === mesh)) {
      return;
    }

    this.activeRotations.push({
      mesh,
      startTime: Date.now(),
      duration: ROTATION_DURATION,
      from: mesh.rotation.y,
      to: mesh.rotation.y + Math.PI / 2,
    });
  },

  updateAnimations() {
    const now = Date.now();

    if (this.activeMove) {
      const elapsed = now - this.activeMove.startTime;
      const progress = clamp(elapsed / this.activeMove.duration, 0, 1);
      const eased = easeInOutQuad(progress);
      this.player.position.lerpVectors(this.activeMove.from, this.activeMove.to, eased);

      if (progress >= 1) {
        this.playerRow = this.activeMove.row;
        this.playerCol = this.activeMove.col;
        const landedType = levels[this.currentLevelIndex][this.playerRow][this.playerCol];
        this.activeMove = null;
        if (landedType === 3) {
          this.advanceLevel();
        }
      }
    }

    if (this.activeRotations.length) {
      this.activeRotations = this.activeRotations.filter((item) => {
        const elapsed = now - item.startTime;
        const progress = clamp(elapsed / item.duration, 0, 1);
        const eased = easeInOutQuad(progress);
        item.mesh.rotation.y = item.from + (item.to - item.from) * eased;
        return progress < 1;
      });
    }
  },

  advanceLevel() {
    const nextLevel = (this.currentLevelIndex + 1) % levels.length;
    this.buildLevel(nextLevel);
  },

  renderLoop() {
    if (this.isUnloading) {
      return;
    }

    this.updateAnimations();
    this.renderer.render(this.scene, this.camera);

    this.rafId = this.canvas.requestAnimationFrame(() => {
      this.renderLoop();
    });
  },
});
