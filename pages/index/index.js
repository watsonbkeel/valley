const { createScopedThreejs } = require('threejs-miniprogram');

const STORAGE_KEY = 'valley_progress';
const TILE_SIZE = 1.2;
const TILE_HEIGHT = 0.45;
const PLAYER_HEIGHT = 0.58;
const PLAYER_MOVE_DURATION = 180;
const ROTATION_DURATION = 280;
const BLOCKED_FEEDBACK_DURATION = 220;

const COLORS = {
  background: 0xf4f1ff,
  path: 0xffffff,
  pathAccent: 0xe7e0ff,
  mechanism: 0x8fd3ff,
  mechanismAccent: 0x4f9dff,
  goal: 0xffd166,
  goalAccent: 0xfff1b5,
  player: 0xff5d73,
  bridge: 0xb8f2e6,
  shadow: 0xd7cff0,
};

const levels = [
  [
    [1, 1, 0, 0, 0],
    [0, 1, 0, 0, 0],
    [0, 2, 0, 1, 3],
    [0, 1, 0, 0, 0],
    [0, 1, 1, 1, 0],
  ],
  [
    [1, 1, 1, 0, 0],
    [0, 0, 2, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 1, 1, 3],
    [0, 0, 0, 0, 0],
  ],
  [
    [1, 0, 0, 0, 0],
    [1, 1, 1, 0, 0],
    [0, 0, 2, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 1, 1, 3],
  ],
  [
    [1, 1, 0, 0, 0],
    [0, 1, 0, 0, 0],
    [0, 2, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 1, 1, 1, 3],
  ],
  [
    [1, 1, 0, 0, 0],
    [0, 2, 0, 1, 3],
    [0, 1, 0, 0, 0],
    [0, 1, 1, 1, 0],
    [0, 0, 0, 0, 0],
  ],
];

const mechanismRules = [
  [
    {
      id: 'l1-m1',
      row: 2,
      col: 1,
      unlockRotation: 1,
      links: [[[2, 1], [2, 3]]],
    },
  ],
  [
    {
      id: 'l2-m1',
      row: 1,
      col: 2,
      unlockRotation: 2,
      links: [[[1, 2], [3, 2]]],
    },
  ],
  [
    {
      id: 'l3-m1',
      row: 2,
      col: 2,
      unlockRotation: 3,
      links: [[[2, 2], [4, 2]]],
    },
  ],
  [
    {
      id: 'l4-m1',
      row: 2,
      col: 1,
      unlockRotation: 1,
      links: [[[2, 1], [4, 1]]],
    },
  ],
  [
    {
      id: 'l5-m1',
      row: 1,
      col: 1,
      unlockRotation: 2,
      links: [[[1, 1], [1, 3]]],
    },
  ],
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function keyOf(row, col) {
  return `${row},${col}`;
}

function parseKey(key) {
  const [row, col] = key.split(',').map((value) => Number(value));
  return { row, col };
}

function manhattan(a, b) {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

Page({
  data: {},

  onReady() {
    this.tileMeshes = [];
    this.interactiveMeshes = [];
    this.sceneObjects = [];
    this.bridgeVisuals = [];
    this.tileMap = {};
    this.mechanismMeshes = {};
    this.mechanismStates = {};
    this.extraEdges = {};
    this.pendingPath = [];
    this.activeMove = null;
    this.activeRotations = [];
    this.blockedUntil = 0;
    this.currentLevelIndex = this.loadSavedLevel();
    this.playerRow = 0;
    this.playerCol = 0;
    this.viewportWidth = 0;
    this.viewportHeight = 0;
    this.isUnloading = false;

    this.initCanvas();
  },

  onUnload() {
    this.isUnloading = true;
    if (this.rafId != null && this.canvas && this.canvas.cancelAnimationFrame) {
      this.canvas.cancelAnimationFrame(this.rafId);
    }
    this.clearLevelObjects();
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
      const frustumSize = 9.2;
      this.camera = new THREE.OrthographicCamera(
        (-frustumSize * aspect) / 2,
        (frustumSize * aspect) / 2,
        frustumSize / 2,
        -frustumSize / 2,
        0.1,
        100
      );
      this.camera.position.set(6.8, 8.2, 6.8);
      this.camera.lookAt(0, 0, 0);

      this.raycaster = new THREE.Raycaster();
      this.pointer = new THREE.Vector2();

      this.addSceneDecorations();
      this.buildLevel(this.currentLevelIndex);
      this.renderLoop();
    });
  },

  addSceneDecorations() {
    const THREE = this.THREE;

    const ambient = new THREE.AmbientLight(0xffffff, 0.72);
    this.scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.05);
    keyLight.position.set(5, 9, 3);
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xfff5e6, 0.45);
    rimLight.position.set(-4, 5, -6);
    this.scene.add(rimLight);

    const shadowPlane = new THREE.Mesh(
      new THREE.CircleGeometry(7.5, 48),
      new THREE.MeshBasicMaterial({
        color: COLORS.shadow,
        transparent: true,
        opacity: 0.35,
      })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -0.66;
    this.scene.add(shadowPlane);
  },

  onTouchStart(event) {
    const touch =
      (event.touches && event.touches[0]) ||
      (event.changedTouches && event.changedTouches[0]);
    if (!touch) {
      return;
    }
    this.processTap(touch);
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
    const hits = this.raycaster.intersectObjects(this.interactiveMeshes, true);
    if (!hits.length) {
      return;
    }

    const target = this.resolveInteractiveTarget(hits[0].object);
    if (!target || !target.userData) {
      return;
    }

    const { row, col, type, mechanismId } = target.userData;
    if (type === 2) {
      this.rotateMechanism(mechanismId);
      return;
    }

    if (type === 1 || type === 3) {
      this.requestPathTo(row, col);
    }
  },

  resolveInteractiveTarget(object) {
    let current = object;
    while (current) {
      if (current.userData && current.userData.type) {
        return current.userData.root || current;
      }
      current = current.parent;
    }
    return null;
  },

  buildLevel(index) {
    const THREE = this.THREE;
    const level = levels[index];

    this.clearLevelObjects();
    this.tileMeshes = [];
    this.interactiveMeshes = [];
    this.sceneObjects = [];
    this.bridgeVisuals = [];
    this.tileMap = {};
    this.mechanismMeshes = {};
    this.mechanismStates = {};
    this.extraEdges = {};
    this.pendingPath = [];
    this.activeMove = null;
    this.activeRotations = [];
    this.blockedUntil = 0;
    this.currentLevelIndex = index;
    this.saveLevel(index);
    this.playerRow = 0;
    this.playerCol = 0;
    this.currentGrid = level;

    for (let row = 0; row < level.length; row += 1) {
      for (let col = 0; col < level[row].length; col += 1) {
        const type = level[row][col];
        if (type === 0) {
          continue;
        }

        const tile = type === 2 ? this.createMechanismTile(row, col) : this.createTileMesh(type, row, col);
        this.scene.add(tile);
        this.tileMeshes.push(tile);
        this.interactiveMeshes.push(tile);
        this.sceneObjects.push(tile);
        this.tileMap[keyOf(row, col)] = tile;
      }
    }

    this.createBridgeVisuals();
    this.rebuildGraph();

    this.player = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.28, PLAYER_HEIGHT, 18),
      new THREE.MeshLambertMaterial({ color: COLORS.player })
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
      this.disposeObject3D(object);
    });
    this.sceneObjects = [];
  },

  disposeObject3D(object) {
    if (object.geometry) {
      object.geometry.dispose();
    }

    if (object.material) {
      if (Array.isArray(object.material)) {
        object.material.forEach((material) => material.dispose && material.dispose());
      } else if (object.material.dispose) {
        object.material.dispose();
      }
    }

    if (object.children && object.children.length) {
      object.children.forEach((child) => this.disposeObject3D(child));
    }
  },

  createTileMesh(type, row, col) {
    const THREE = this.THREE;
    const world = this.gridToWorld(row, col);
    const group = new THREE.Group();
    group.position.set(world.x, TILE_HEIGHT / 2 - 0.18, world.z);

    let color = COLORS.path;
    let accentColor = COLORS.pathAccent;
    if (type === 3) {
      color = COLORS.goal;
      accentColor = COLORS.goalAccent;
    }

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(TILE_SIZE, TILE_HEIGHT, TILE_SIZE),
      new THREE.MeshLambertMaterial({ color })
    );

    const accent = new THREE.Mesh(
      new THREE.BoxGeometry(TILE_SIZE * 0.82, 0.08, TILE_SIZE * 0.82),
      new THREE.MeshLambertMaterial({ color: accentColor })
    );
    accent.position.y = TILE_HEIGHT / 2 + 0.05;

    group.add(body);
    group.add(accent);
    group.userData = { row, col, type };
    body.userData = { row, col, type, root: group };
    accent.userData = { row, col, type, root: group };
    return group;
  },

  createMechanismTile(row, col) {
    const THREE = this.THREE;
    const world = this.gridToWorld(row, col);
    const rule = this.getMechanismRule(row, col);
    const group = new THREE.Group();
    group.position.set(world.x, TILE_HEIGHT / 2 - 0.18, world.z);

    const base = new THREE.Mesh(
      new THREE.BoxGeometry(TILE_SIZE, TILE_HEIGHT, TILE_SIZE),
      new THREE.MeshLambertMaterial({ color: COLORS.mechanism })
    );

    const pivot = new THREE.Mesh(
      new THREE.BoxGeometry(TILE_SIZE * 0.86, 0.14, TILE_SIZE * 0.2),
      new THREE.MeshLambertMaterial({ color: COLORS.mechanismAccent })
    );
    pivot.position.set(TILE_SIZE * 0.15, TILE_HEIGHT / 2 + 0.08, 0);

    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(TILE_SIZE * 0.24, 0.18, TILE_SIZE * 0.24),
      new THREE.MeshLambertMaterial({ color: 0xffffff })
    );
    cap.position.set(TILE_SIZE * 0.34, TILE_HEIGHT / 2 + 0.16, 0);

    group.add(base);
    group.add(pivot);
    group.add(cap);
    group.userData = { row, col, type: 2, mechanismId: rule.id };
    base.userData = { row, col, type: 2, mechanismId: rule.id, root: group };
    pivot.userData = { row, col, type: 2, mechanismId: rule.id, root: group };
    cap.userData = { row, col, type: 2, mechanismId: rule.id, root: group };

    this.mechanismMeshes[rule.id] = group;
    this.mechanismStates[rule.id] = {
      rotation: 0,
      unlockRotation: rule.unlockRotation,
    };

    return group;
  },

  createBridgeVisuals() {
    const THREE = this.THREE;
    const rules = mechanismRules[this.currentLevelIndex] || [];

    rules.forEach((rule) => {
      rule.links.forEach((link, index) => {
        const from = this.gridToWorld(link[0][0], link[0][1]);
        const to = this.gridToWorld(link[1][0], link[1][1]);
        const dx = to.x - from.x;
        const dz = to.z - from.z;
        const length = Math.sqrt(dx * dx + dz * dz);

        const bridge = new THREE.Mesh(
          new THREE.BoxGeometry(0.22, 0.16, length + TILE_SIZE * 0.15),
          new THREE.MeshLambertMaterial({ color: COLORS.bridge })
        );
        bridge.position.set((from.x + to.x) / 2, TILE_HEIGHT + 0.02, (from.z + to.z) / 2);
        bridge.rotation.y = Math.atan2(dx, dz);
        bridge.visible = false;
        bridge.userData = { mechanismId: rule.id, linkIndex: index };

        this.scene.add(bridge);
        this.sceneObjects.push(bridge);
        this.bridgeVisuals.push(bridge);
      });
    });
  },

  gridToWorld(row, col) {
    const size = this.currentGrid ? this.currentGrid.length : levels[this.currentLevelIndex].length;
    const originOffset = ((size - 1) * TILE_SIZE) / 2;
    return {
      x: col * TILE_SIZE - originOffset,
      y: 0,
      z: row * TILE_SIZE - originOffset,
    };
  },

  getMechanismRule(row, col) {
    const rules = mechanismRules[this.currentLevelIndex] || [];
    return rules.find((rule) => rule.row === row && rule.col === col);
  },

  isWalkable(row, col) {
    if (!this.currentGrid) {
      return false;
    }
    if (row < 0 || col < 0 || row >= this.currentGrid.length || col >= this.currentGrid[row].length) {
      return false;
    }
    return this.currentGrid[row][col] !== 0;
  },

  rebuildGraph() {
    this.extraEdges = {};
    const rules = mechanismRules[this.currentLevelIndex] || [];

    rules.forEach((rule) => {
      const state = this.mechanismStates[rule.id];
      const active = state && state.rotation === state.unlockRotation;
      rule.links.forEach((link, index) => {
        const bridge = this.bridgeVisuals.find(
          (item) => item.userData.mechanismId === rule.id && item.userData.linkIndex === index
        );
        if (bridge) {
          bridge.visible = active;
        }
        if (!active) {
          return;
        }
        this.addExtraEdge(link[0][0], link[0][1], link[1][0], link[1][1]);
      });
    });
  },

  addExtraEdge(rowA, colA, rowB, colB) {
    const keyA = keyOf(rowA, colA);
    const keyB = keyOf(rowB, colB);
    if (!this.extraEdges[keyA]) {
      this.extraEdges[keyA] = [];
    }
    if (!this.extraEdges[keyB]) {
      this.extraEdges[keyB] = [];
    }
    this.extraEdges[keyA].push({ row: rowB, col: colB });
    this.extraEdges[keyB].push({ row: rowA, col: colA });
  },

  getNeighbors(row, col) {
    const neighbors = [];
    const directions = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];

    directions.forEach(([dy, dx]) => {
      const nextRow = row + dy;
      const nextCol = col + dx;
      if (this.isWalkable(nextRow, nextCol)) {
        neighbors.push({ row: nextRow, col: nextCol });
      }
    });

    const extra = this.extraEdges[keyOf(row, col)] || [];
    extra.forEach((node) => {
      neighbors.push(node);
    });

    return neighbors;
  },

  findPath(start, goal) {
    const startKey = keyOf(start.row, start.col);
    const goalKey = keyOf(goal.row, goal.col);
    const openSet = [startKey];
    const cameFrom = {};
    const gScore = { [startKey]: 0 };
    const fScore = { [startKey]: manhattan(start, goal) };

    while (openSet.length) {
      openSet.sort((a, b) => fScore[a] - fScore[b]);
      const currentKey = openSet.shift();
      if (currentKey === goalKey) {
        return this.reconstructPath(cameFrom, currentKey);
      }

      const current = parseKey(currentKey);
      const neighbors = this.getNeighbors(current.row, current.col);
      neighbors.forEach((neighbor) => {
        const neighborKey = keyOf(neighbor.row, neighbor.col);
        const tentativeG = gScore[currentKey] + 1;
        if (tentativeG >= (gScore[neighborKey] ?? Infinity)) {
          return;
        }

        cameFrom[neighborKey] = currentKey;
        gScore[neighborKey] = tentativeG;
        fScore[neighborKey] = tentativeG + manhattan(neighbor, goal);
        if (!openSet.includes(neighborKey)) {
          openSet.push(neighborKey);
        }
      });
    }

    return null;
  },

  reconstructPath(cameFrom, currentKey) {
    const path = [parseKey(currentKey)];
    let cursor = currentKey;
    while (cameFrom[cursor]) {
      cursor = cameFrom[cursor];
      path.unshift(parseKey(cursor));
    }
    return path;
  },

  requestPathTo(row, col) {
    if (row === this.playerRow && col === this.playerCol) {
      return;
    }

    const path = this.findPath(
      { row: this.playerRow, col: this.playerCol },
      { row, col }
    );

    if (!path || path.length < 2) {
      this.triggerBlockedFeedback();
      return;
    }

    this.pendingPath = path.slice(1);
    this.startNextMove();
  },

  startNextMove() {
    if (!this.pendingPath.length) {
      return;
    }

    const nextNode = this.pendingPath.shift();
    const world = this.gridToWorld(nextNode.row, nextNode.col);
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
      row: nextNode.row,
      col: nextNode.col,
    };
  },

  placePlayerAt(row, col) {
    const world = this.gridToWorld(row, col);
    this.player.position.set(world.x, TILE_HEIGHT / 2 + PLAYER_HEIGHT / 2, world.z);
    this.player.scale.set(1, 1, 1);
  },

  rotateMechanism(mechanismId) {
    const mesh = this.mechanismMeshes[mechanismId];
    const state = this.mechanismStates[mechanismId];
    if (!mesh || !state || this.activeRotations.some((item) => item.mechanismId === mechanismId)) {
      return;
    }

    const nextRotation = (state.rotation + 1) % 4;
    this.activeRotations.push({
      mechanismId,
      mesh,
      startTime: Date.now(),
      duration: ROTATION_DURATION,
      from: state.rotation * (Math.PI / 2),
      to: nextRotation * (Math.PI / 2),
      nextRotation,
    });
  },

  triggerBlockedFeedback() {
    this.blockedUntil = Date.now() + BLOCKED_FEEDBACK_DURATION;
  },

  updateBlockedFeedback(now) {
    if (!this.player) {
      return;
    }

    if (now >= this.blockedUntil) {
      this.player.scale.set(1, 1, 1);
      return;
    }

    const progress = 1 - (this.blockedUntil - now) / BLOCKED_FEEDBACK_DURATION;
    const wobble = Math.sin(progress * Math.PI * 3) * 0.08;
    this.player.scale.set(1 + wobble, 1 - Math.abs(wobble), 1 + wobble);
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
        this.activeMove = null;

        if (this.pendingPath.length) {
          this.startNextMove();
        } else {
          const landedType = this.currentGrid[this.playerRow][this.playerCol];
          if (landedType === 3) {
            this.advanceLevel();
            return;
          }
        }
      }
    }

    if (this.activeRotations.length) {
      const finished = [];
      this.activeRotations = this.activeRotations.filter((item) => {
        const elapsed = now - item.startTime;
        const progress = clamp(elapsed / item.duration, 0, 1);
        const eased = easeInOutQuad(progress);
        item.mesh.rotation.y = item.from + (item.to - item.from) * eased;

        if (progress >= 1) {
          finished.push(item);
          return false;
        }
        return true;
      });

      finished.forEach((item) => {
        const state = this.mechanismStates[item.mechanismId];
        if (!state) {
          return;
        }
        state.rotation = item.nextRotation;
        item.mesh.rotation.y = item.to;
      });

      if (finished.length) {
        this.rebuildGraph();
      }
    }

    this.updateBlockedFeedback(now);
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
