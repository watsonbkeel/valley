const { createScopedThreejs } = require('threejs-miniprogram');

const GRID_SIZE = 50;
const GRID_SPACING = 1.72;
const HEIGHT_UNIT = 1.36;
const BLOCK_SIZE = 1.16;
const BLOCK_THICKNESS = 0.34;
const PILLAR_MIN_HEIGHT = 0.42;
const PLAYER_MOVE_BASE_DURATION = 190;
const PLAYER_MOVE_HEIGHT_BONUS = 120;
const MECHANISM_ROTATION_DURATION = 760;
const BRIDGE_ANIMATION_DURATION = 520;
const BLOCKED_FEEDBACK_DURATION = 280;
const LEVEL_CLEAR_DURATION = 3400;
const CAMERA_LERP = 0.085;
const CAMERA_OFFSET = { x: 8.8, y: 9.8, z: 8.8 };

const COLORS = {
  background: 0x2b2d42,
  fog: 0x343855,
  path: 0xffb7b2,
  pathAccent: 0xffd4cf,
  stair: 0xffc8c3,
  stairAccent: 0xffebe6,
  mechanism: 0xe2f0cb,
  mechanismAccent: 0xf7ffed,
  goal: 0xffe66d,
  goalAccent: 0xfff4b8,
  bridge: 0xd4f1f4,
  bridgeAccent: 0xf6fdff,
  dead: 0xcdb4db,
  pillar: 0x444b70,
  shadow: 0x1b1e2c,
  playerPrimary: 0xf7f7ff,
  playerSecondary: 0xff6b6b,
  playerAccent: 0x94d2bd,
  playerMetal: 0xd9dce7,
  eye: 0x202333,
};

const level = {
  startBlockId: 'start_0',
  goalBlockId: 'goal',
  blocks: [
    { id: 'start_0', x: 18, y: 0, z: 25, type: 1 },
    { id: 'start_1', x: 19, y: 0, z: 25, type: 1 },
    { id: 'start_2', x: 20, y: 0, z: 25, type: 1 },
    { id: 'm1_west', x: 21, y: 0, z: 25, type: 1 },
    { id: 'm1_center', x: 22, y: 0, z: 25, type: 2, mechanismId: 'm1' },
    { id: 'm1_east', x: 23, y: 0.5, z: 25, type: 4 },
    { id: 'm1_north_dead', x: 22, y: 0.5, z: 24, type: 4, deadEnd: true },
    { id: 'm1_north_tower', x: 22, y: 1, z: 23, type: 1, deadEnd: true },
    { id: 'm1_north_roof', x: 23, y: 1.5, z: 23, type: 4, deadEnd: true },
    { id: 'm1_south_dead', x: 22, y: 0, z: 26, type: 1, deadEnd: true },
    { id: 'm1_south_gap', x: 22, y: 0, z: 27, type: 1, deadEnd: true },

    { id: 'mid_0', x: 24, y: 0.5, z: 25, type: 1 },
    { id: 'mid_1', x: 25, y: 1, z: 25, type: 4 },
    { id: 'mid_2', x: 26, y: 1, z: 25, type: 1 },
    { id: 'mid_overlook', x: 26, y: 1.5, z: 24, type: 4, deadEnd: true },
    { id: 'mid_overlook_top', x: 26, y: 2, z: 23, type: 1, deadEnd: true },
    { id: 'm2_west', x: 27, y: 1, z: 25, type: 1 },
    { id: 'm2_center', x: 28, y: 1, z: 25, type: 2, mechanismId: 'm2' },
    { id: 'm2_north_dead', x: 28, y: 1.5, z: 24, type: 4, deadEnd: true },
    { id: 'm2_north_top', x: 28, y: 2, z: 23, type: 1, deadEnd: true },
    { id: 'm2_south_dead', x: 28, y: 1, z: 26, type: 1, deadEnd: true },
    { id: 'm2_south_pit', x: 28, y: 0.5, z: 27, type: 4, deadEnd: true },
    { id: 'm2_south_low', x: 28, y: 0, z: 28, type: 1, deadEnd: true },

    { id: 'bridge_exit', x: 32, y: 2, z: 25, type: 4 },
    { id: 'goal_ramp_0', x: 33, y: 2, z: 25, type: 1 },
    { id: 'goal_ramp_1', x: 34, y: 2.5, z: 25, type: 4 },
    { id: 'goal', x: 35, y: 3, z: 25, type: 3 },

    { id: 'side_loop_0', x: 24, y: 0.5, z: 26, type: 1, deadEnd: true },
    { id: 'side_loop_1', x: 25, y: 0.5, z: 26, type: 1, deadEnd: true },
    { id: 'side_loop_2', x: 26, y: 0.5, z: 26, type: 1, deadEnd: true },
    { id: 'side_loop_drop', x: 27, y: 0, z: 26, type: 4, deadEnd: true },
  ],
  mechanisms: [
    {
      id: 'm1',
      type: 'rotate',
      axis: 'y',
      initialState: 0,
      centerBlockId: 'm1_center',
      linksByState: {
        0: [['m1_center', 'm1_west']],
        1: [
          ['m1_center', 'm1_west'],
          ['m1_center', 'm1_north_dead'],
        ],
        2: [
          ['m1_center', 'm1_west'],
          ['m1_center', 'm1_east'],
        ],
        3: [['m1_center', 'm1_south_dead']],
      },
    },
    {
      id: 'm2',
      type: 'rotate',
      axis: 'y',
      initialState: 0,
      centerBlockId: 'm2_center',
      linksByState: {
        0: [
          ['m2_center', 'm2_west'],
          ['m2_center', 'm2_south_dead'],
        ],
        1: [
          ['m2_center', 'm2_west'],
          ['m2_center', 'm2_north_dead'],
        ],
        2: [
          ['m2_center', 'm2_west'],
          ['m2_center', 'bridge_exit'],
        ],
        3: [],
      },
    },
  ],
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function easeOutBounce(t) {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) {
    return n1 * t * t;
  }
  if (t < 2 / d1) {
    return n1 * (t -= 1.5 / d1) * t + 0.75;
  }
  if (t < 2.5 / d1) {
    return n1 * (t -= 2.25 / d1) * t + 0.9375;
  }
  return n1 * (t -= 2.625 / d1) * t + 0.984375;
}

function easeOutElastic(t) {
  if (t === 0 || t === 1) {
    return t;
  }
  const c4 = (2 * Math.PI) / 3;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

function makePositionKey(x, z) {
  return `${x}:${z}`;
}

function makePairKey(fromId, toId) {
  return `${fromId}->${toId}`;
}

function worldX(logicalX) {
  return (logicalX - GRID_SIZE / 2) * GRID_SPACING;
}

function worldZ(logicalZ) {
  return (logicalZ - GRID_SIZE / 2) * GRID_SPACING;
}

function surfaceY(logicalY) {
  return logicalY * HEIGHT_UNIT;
}

function heuristic(blockA, blockB) {
  return (
    Math.abs(blockA.x - blockB.x) +
    Math.abs(blockA.z - blockB.z) +
    Math.abs(blockA.y - blockB.y) * 1.8
  );
}

Page({
  data: {},

  onReady() {
    this.viewportWidth = 0;
    this.viewportHeight = 0;
    this.isUnloading = false;
    this.rafId = null;

    this.THREE = null;
    this.canvas = null;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.raycaster = null;
    this.pointer = null;
    this.cameraLookAt = null;
    this.cameraDesired = null;

    this.interactiveRoots = [];
    this.sceneObjects = [];
    this.blockDataMap = {};
    this.positionMap = {};
    this.blockMeshes = {};
    this.bridgeColliders = {};
    this.blockActiveState = {};
    this.mechanismMeshes = {};
    this.mechanismStates = {};
    this.activeLinks = {};
    this.bridgePaths = [];
    this.bridgePathMap = {};

    this.activeMove = null;
    this.pendingPath = [];
    this.activeMechanismAnimations = [];
    this.levelClearState = null;
    this.blockedUntil = 0;
    this.playerBlockId = level.startBlockId;
    this.playerContainer = null;
    this.playerAvatarRoot = null;
    this.fallbackPlayer = null;
    this.timeStart = Date.now();

    this.prepareLevelData();
    this.initCanvas();
  },

  onUnload() {
    this.isUnloading = true;
    if (this.rafId != null && this.canvas && this.canvas.cancelAnimationFrame) {
      this.canvas.cancelAnimationFrame(this.rafId);
    }
    this.clearSceneObjects();
    if (this.renderer) {
      this.renderer.dispose();
    }
  },

  prepareLevelData() {
    let i = 0;
    while (i < level.blocks.length) {
      const block = Object.assign({}, level.blocks[i], {
        isBridge: false,
        isRuntime: false,
      });
      this.registerBlock(block, true);
      i += 1;
    }

    i = 0;
    while (i < level.mechanisms.length) {
      this.createRuntimeBridgeNodes(level.mechanisms[i]);
      i += 1;
    }
  },

  registerBlock(block, activeByDefault) {
    this.blockDataMap[block.id] = block;
    this.positionMap[makePositionKey(block.x, block.z)] = block;
    this.blockActiveState[block.id] = !!activeByDefault;
  },

  createRuntimeBridgeNodes(mechanism) {
    const seenPairs = {};
    const stateKeys = Object.keys(mechanism.linksByState || {});
    let s = 0;
    while (s < stateKeys.length) {
      const pairs = mechanism.linksByState[stateKeys[s]] || [];
      let p = 0;
      while (p < pairs.length) {
        const fromId = pairs[p][0];
        const toId = pairs[p][1];
        const pairKey = makePairKey(fromId, toId);
        if (!seenPairs[pairKey]) {
          seenPairs[pairKey] = true;
          this.createBridgePathIfNeeded(mechanism.id, fromId, toId);
        }
        p += 1;
      }
      s += 1;
    }
  },

  createBridgePathIfNeeded(mechanismId, fromId, toId) {
    const fromBlock = this.blockDataMap[fromId];
    const toBlock = this.blockDataMap[toId];
    if (!fromBlock || !toBlock) {
      return;
    }

    const dx = toBlock.x - fromBlock.x;
    const dz = toBlock.z - fromBlock.z;
    const length = Math.abs(dx) + Math.abs(dz);
    if (length <= 1 || (dx !== 0 && dz !== 0)) {
      return;
    }

    const stepX = dx === 0 ? 0 : dx / Math.abs(dx);
    const stepZ = dz === 0 ? 0 : dz / Math.abs(dz);
    const nodeIds = [];
    const routeIds = [fromId];
    const bridgeKey = makePairKey(fromId, toId);
    let step = 1;

    while (step < length) {
      const t = step / length;
      const nodeId = `${mechanismId}_bridge_${fromId}_${toId}_${step}`;
      const block = {
        id: nodeId,
        x: fromBlock.x + stepX * step,
        y: lerp(fromBlock.y, toBlock.y, t),
        z: fromBlock.z + stepZ * step,
        type: 5,
        isBridge: true,
        isRuntime: true,
        mechanismId,
        bridgeKey,
      };
      this.registerBlock(block, false);
      nodeIds.push(nodeId);
      routeIds.push(nodeId);
      step += 1;
    }

    routeIds.push(toId);
    const bridgePath = {
      key: bridgeKey,
      mechanismId,
      fromId,
      toId,
      nodeIds,
      routeIds,
      group: null,
      beam: null,
      railA: null,
      railB: null,
      currentScale: 0.001,
      startScale: 0.001,
      targetScale: 0.001,
      startTime: 0,
      duration: BRIDGE_ANIMATION_DURATION,
      animating: false,
    };

    this.bridgePaths.push(bridgePath);
    this.bridgePathMap[bridgeKey] = bridgePath;
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
      this.scene.fog = new THREE.Fog(COLORS.fog, 16, 82);

      this.renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
      });
      this.renderer.setPixelRatio(dpr);
      this.renderer.setSize(width, height);

      const aspect = width / height;
      const frustumSize = 14;
      this.camera = new THREE.OrthographicCamera(
        (-frustumSize * aspect) / 2,
        (frustumSize * aspect) / 2,
        frustumSize / 2,
        -frustumSize / 2,
        0.1,
        180
      );

      this.raycaster = new THREE.Raycaster();
      this.pointer = new THREE.Vector2();
      this.cameraLookAt = new THREE.Vector3();
      this.cameraDesired = new THREE.Vector3();

      this.addSceneDecorations();
      this.buildLevelGeometry();
      this.createPlayerContainer();
      this.placePlayerAtBlock(this.playerBlockId);
      this.updateCamera(true);
      this.renderLoop();
    });
  },

  addSceneDecorations() {
    const THREE = this.THREE;

    const ambient = new THREE.AmbientLight(0xffffff, 0.68);
    this.scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xfff4ea, 1.22);
    keyLight.position.set(12, 18, 8);
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xa8dadc, 0.42);
    fillLight.position.set(-12, 9, -13);
    this.scene.add(fillLight);

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(45, 64),
      new THREE.MeshBasicMaterial({
        color: COLORS.shadow,
        transparent: true,
        opacity: 0.38,
      })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.92;
    this.scene.add(ground);
    this.sceneObjects.push(ground);
  },

  buildLevelGeometry() {
    const ids = Object.keys(this.blockDataMap);
    let i = 0;

    while (i < ids.length) {
      const block = this.blockDataMap[ids[i]];
      const group = this.createBlockGroup(block);
      this.blockMeshes[block.id] = group;
      this.interactiveRoots.push(group);
      this.scene.add(group);
      this.sceneObjects.push(group);
      i += 1;
    }

    i = 0;
    while (i < ids.length) {
      const block = this.blockDataMap[ids[i]];
      if (block.isBridge) {
        const collider = this.createBridgeCollider(block);
        this.bridgeColliders[block.id] = collider;
        this.interactiveRoots.push(collider);
        this.scene.add(collider);
        this.sceneObjects.push(collider);
      }
      i += 1;
    }

    i = 0;
    while (i < this.bridgePaths.length) {
      this.createBridgeVisual(this.bridgePaths[i]);
      i += 1;
    }

    i = 0;
    while (i < level.mechanisms.length) {
      const mechanism = level.mechanisms[i];
      this.mechanismStates[mechanism.id] = {
        rotationState: mechanism.initialState || 0,
      };
      const mesh = this.mechanismMeshes[mechanism.id];
      if (mesh) {
        mesh.rotation.y = (mechanism.initialState || 0) * Math.PI / 2;
      }
      i += 1;
    }

    this.rebuildMechanismLinks(true);
  },

  clearSceneObjects() {
    let i = 0;
    while (i < this.sceneObjects.length) {
      const object = this.sceneObjects[i];
      this.scene.remove(object);
      this.disposeObject3D(object);
      i += 1;
    }
    this.sceneObjects = [];
  },

  disposeObject3D(object) {
    if (object.geometry) {
      object.geometry.dispose();
    }
    if (object.material) {
      if (Array.isArray(object.material)) {
        let i = 0;
        while (i < object.material.length) {
          if (object.material[i] && object.material[i].dispose) {
            object.material[i].dispose();
          }
          i += 1;
        }
      } else if (object.material.dispose) {
        object.material.dispose();
      }
    }
    if (object.children && object.children.length) {
      let i = 0;
      while (i < object.children.length) {
        this.disposeObject3D(object.children[i]);
        i += 1;
      }
    }
  },

  createBlockGroup(block) {
    const THREE = this.THREE;
    const group = new THREE.Group();
    const position = this.getWorldPositionForBlock(block);
    group.position.set(position.x, 0, position.z);

    const topY = surfaceY(block.y);
    const pillarHeight = Math.max(PILLAR_MIN_HEIGHT, topY + BLOCK_THICKNESS / 2 + 0.45);
    const pillar = new THREE.Mesh(
      new THREE.BoxGeometry(BLOCK_SIZE * 0.72, pillarHeight, BLOCK_SIZE * 0.72),
      new THREE.MeshLambertMaterial({ color: COLORS.pillar })
    );
    pillar.position.y = pillarHeight / 2 - 0.45;

    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_THICKNESS, BLOCK_SIZE),
      new THREE.MeshLambertMaterial({ color: this.getBlockColor(block) })
    );
    cap.position.y = topY;

    const accent = new THREE.Mesh(
      new THREE.BoxGeometry(BLOCK_SIZE * 0.8, 0.08, BLOCK_SIZE * 0.8),
      new THREE.MeshLambertMaterial({ color: this.getBlockAccentColor(block) })
    );
    accent.position.y = topY + BLOCK_THICKNESS / 2 + 0.06;

    group.add(pillar);
    group.add(cap);
    group.add(accent);

    if (block.deadEnd) {
      const marker = new THREE.Mesh(
        new THREE.BoxGeometry(BLOCK_SIZE * 0.22, 0.1, BLOCK_SIZE * 0.68),
        new THREE.MeshLambertMaterial({ color: COLORS.dead })
      );
      marker.position.y = topY + BLOCK_THICKNESS / 2 + 0.14;
      group.add(marker);
    }

    if (block.type === 4) {
      this.addStairDetails(group, topY);
    }

    if (block.type === 2) {
      this.addMechanismDetails(group, topY, block);
      this.mechanismMeshes[block.mechanismId] = group;
    }

    if (block.type === 3) {
      this.addGoalDetails(group, topY);
    }

    if (block.type === 5) {
      this.addBridgeNodeDetails(group, topY);
    }

    group.userData = {
      blockId: block.id,
      type: block.type,
      mechanismId: block.mechanismId || '',
      isBridge: !!block.isBridge,
    };
    this.assignUserDataRecursive(group, group);
    return group;
  },

  addStairDetails(group, topY) {
    const THREE = this.THREE;
    const material = new THREE.MeshLambertMaterial({ color: COLORS.stairAccent });
    const stepA = new THREE.Mesh(new THREE.BoxGeometry(BLOCK_SIZE * 0.78, 0.1, 0.22), material);
    stepA.position.set(0, topY + BLOCK_THICKNESS / 2 + 0.12, -0.26);
    const stepB = new THREE.Mesh(new THREE.BoxGeometry(BLOCK_SIZE * 0.68, 0.12, 0.22), material);
    stepB.position.set(0, topY + BLOCK_THICKNESS / 2 + 0.22, 0);
    const stepC = new THREE.Mesh(new THREE.BoxGeometry(BLOCK_SIZE * 0.58, 0.14, 0.22), material);
    stepC.position.set(0, topY + BLOCK_THICKNESS / 2 + 0.34, 0.26);
    group.add(stepA);
    group.add(stepB);
    group.add(stepC);
  },

  addMechanismDetails(group, topY) {
    const THREE = this.THREE;
    const armMaterial = new THREE.MeshLambertMaterial({ color: COLORS.mechanismAccent });
    const longArm = new THREE.Mesh(
      new THREE.BoxGeometry(BLOCK_SIZE * 0.94, 0.14, BLOCK_SIZE * 0.2),
      armMaterial
    );
    longArm.position.set(0, topY + BLOCK_THICKNESS / 2 + 0.13, 0);
    const shortArm = new THREE.Mesh(
      new THREE.BoxGeometry(BLOCK_SIZE * 0.2, 0.14, BLOCK_SIZE * 0.94),
      armMaterial
    );
    shortArm.position.set(0, topY + BLOCK_THICKNESS / 2 + 0.15, 0);
    const core = new THREE.Mesh(
      new THREE.CylinderGeometry(0.17, 0.22, 0.28, 18),
      new THREE.MeshLambertMaterial({ color: 0xffffff })
    );
    core.position.y = topY + BLOCK_THICKNESS / 2 + 0.24;
    group.add(longArm);
    group.add(shortArm);
    group.add(core);
  },

  addGoalDetails(group, topY) {
    const THREE = this.THREE;
    const beacon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.2, 0.58, 18),
      new THREE.MeshLambertMaterial({ color: COLORS.goalAccent })
    );
    beacon.position.y = topY + BLOCK_THICKNESS / 2 + 0.31;
    const crown = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.22, 0),
      new THREE.MeshLambertMaterial({ color: 0xffffff })
    );
    crown.position.y = topY + BLOCK_THICKNESS / 2 + 0.76;
    group.add(beacon);
    group.add(crown);
  },

  addBridgeNodeDetails(group, topY) {
    const THREE = this.THREE;
    const railMaterial = new THREE.MeshLambertMaterial({ color: COLORS.bridgeAccent });
    const railA = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.15, BLOCK_SIZE * 0.86), railMaterial);
    railA.position.set(-0.34, topY + BLOCK_THICKNESS / 2 + 0.12, 0);
    const railB = railA.clone();
    railB.position.x = 0.34;
    group.add(railA);
    group.add(railB);
  },

  createBridgeCollider(block) {
    const THREE = this.THREE;
    const position = this.getWorldPositionForBlock(block);
    const collider = new THREE.Mesh(
      new THREE.BoxGeometry(BLOCK_SIZE * 1.18, BLOCK_THICKNESS + 0.5, BLOCK_SIZE * 1.18),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      })
    );
    collider.position.set(position.x, position.y, position.z);
    collider.userData = {
      blockId: block.id,
      type: block.type,
      mechanismId: block.mechanismId || '',
      isBridge: true,
      isBridgeCollider: true,
      root: collider,
    };
    collider.visible = false;
    return collider;
  },

  createBridgeVisual(bridgePath) {
    if (!bridgePath.nodeIds.length) {
      return;
    }

    const THREE = this.THREE;
    const fromPosition = this.getWorldPositionForBlock(this.blockDataMap[bridgePath.fromId]);
    const toPosition = this.getWorldPositionForBlock(this.blockDataMap[bridgePath.toId]);
    const dx = toPosition.x - fromPosition.x;
    const dz = toPosition.z - fromPosition.z;
    const length = Math.sqrt(dx * dx + dz * dz);
    const centerY = (fromPosition.y + toPosition.y) / 2 - 0.02;

    const group = new THREE.Group();
    group.position.set(
      (fromPosition.x + toPosition.x) / 2,
      centerY,
      (fromPosition.z + toPosition.z) / 2
    );
    group.rotation.y = Math.atan2(dx, dz);

    const beam = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.16, length + 0.08),
      new THREE.MeshLambertMaterial({ color: COLORS.bridge })
    );
    beam.scale.z = 0.001;

    const railA = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.1, length + 0.02),
      new THREE.MeshLambertMaterial({ color: COLORS.bridgeAccent })
    );
    railA.position.set(-0.42, 0.17, 0);
    railA.scale.z = 0.001;

    const railB = railA.clone();
    railB.position.x = 0.42;

    group.add(beam);
    group.add(railA);
    group.add(railB);
    group.visible = false;

    bridgePath.group = group;
    bridgePath.beam = beam;
    bridgePath.railA = railA;
    bridgePath.railB = railB;

    this.scene.add(group);
    this.sceneObjects.push(group);
  },

  assignUserDataRecursive(object, root) {
    object.userData.root = root;
    if (object.children && object.children.length) {
      let i = 0;
      while (i < object.children.length) {
        this.assignUserDataRecursive(object.children[i], root);
        i += 1;
      }
    }
  },

  getBlockColor(block) {
    if (block.type === 2) {
      return COLORS.mechanism;
    }
    if (block.type === 3) {
      return COLORS.goal;
    }
    if (block.type === 4) {
      return COLORS.stair;
    }
    if (block.type === 5) {
      return COLORS.bridge;
    }
    if (block.deadEnd) {
      return 0xe9b8d6;
    }
    return COLORS.path;
  },

  getBlockAccentColor(block) {
    if (block.type === 2) {
      return COLORS.mechanismAccent;
    }
    if (block.type === 3) {
      return COLORS.goalAccent;
    }
    if (block.type === 4) {
      return COLORS.stairAccent;
    }
    if (block.type === 5) {
      return COLORS.bridgeAccent;
    }
    if (block.deadEnd) {
      return 0xf3d2e7;
    }
    return COLORS.pathAccent;
  },

  getWorldPositionForBlock(block) {
    return {
      x: worldX(block.x),
      y: surfaceY(block.y) + BLOCK_THICKNESS / 2,
      z: worldZ(block.z),
    };
  },

  isBlockActive(blockId) {
    return !!this.blockActiveState[blockId];
  },

  setBridgeNodeActive(blockId, active, immediate) {
    this.blockActiveState[blockId] = active;
    const mesh = this.blockMeshes[blockId];
    const collider = this.bridgeColliders[blockId];

    if (mesh) {
      mesh.visible = active || !immediate;
      if (immediate) {
        mesh.scale.set(1, 1, active ? 1 : 0.001);
        mesh.visible = active;
      }
    }
    if (collider) {
      collider.visible = active;
      if (immediate) {
        collider.scale.set(1, 1, active ? 1 : 0.001);
      }
    }
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
    if (
      !this.camera ||
      !this.raycaster ||
      this.activeMove ||
      this.activeMechanismAnimations.length ||
      this.levelClearState
    ) {
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

    const hits = this.raycaster.intersectObjects(this.interactiveRoots, true);
    if (!hits.length) {
      return;
    }

    const target = this.resolveInteractiveRoot(hits[0].object);
    if (!target || !target.userData) {
      return;
    }

    const blockId = target.userData.blockId;
    if (!this.isBlockActive(blockId)) {
      return;
    }

    const block = this.blockDataMap[blockId];
    if (!block) {
      return;
    }

    if (block.type === 2) {
      if (!this.canOperateMechanism(block.id)) {
        this.blockedUntil = Date.now() + BLOCKED_FEEDBACK_DURATION;
        return;
      }
      this.triggerMechanism(block.mechanismId);
      return;
    }

    if (block.type === 1 || block.type === 3 || block.type === 4 || block.type === 5) {
      this.requestMoveToBlock(block.id);
    }
  },

  resolveInteractiveRoot(object) {
    let current = object;
    while (current) {
      if (current.userData && current.userData.blockId) {
        return current.userData.root || current;
      }
      current = current.parent;
    }
    return null;
  },

  canOperateMechanism(mechanismBlockId) {
    if (this.playerBlockId === mechanismBlockId) {
      return true;
    }

    const playerBlock = this.blockDataMap[this.playerBlockId];
    const mechanismBlock = this.blockDataMap[mechanismBlockId];
    if (!playerBlock || !mechanismBlock) {
      return false;
    }

    const manhattan2D =
      Math.abs(playerBlock.x - mechanismBlock.x) +
      Math.abs(playerBlock.z - mechanismBlock.z);
    return manhattan2D === 1 && Math.abs(playerBlock.y - mechanismBlock.y) <= 0.75;
  },

  requestMoveToBlock(targetBlockId) {
    if (targetBlockId === this.playerBlockId) {
      return;
    }

    const path = this.findPath(this.playerBlockId, targetBlockId);
    if (!path || path.length < 2) {
      this.blockedUntil = Date.now() + BLOCKED_FEEDBACK_DURATION;
      return;
    }

    this.pendingPath = path.slice(1);
    this.startNextMove();
  },

  findPath(startId, goalId) {
    const startBlock = this.blockDataMap[startId];
    const goalBlock = this.blockDataMap[goalId];
    if (!startBlock || !goalBlock || !this.isBlockActive(startId) || !this.isBlockActive(goalId)) {
      return null;
    }

    const openSet = [startId];
    const closedSet = {};
    const cameFrom = {};
    const gScore = {};
    const fScore = {};
    gScore[startId] = 0;
    fScore[startId] = heuristic(startBlock, goalBlock);

    while (openSet.length) {
      openSet.sort((a, b) => fScore[a] - fScore[b]);
      const currentId = openSet.shift();
      if (currentId === goalId) {
        return this.reconstructPath(cameFrom, currentId);
      }

      closedSet[currentId] = true;
      const neighbors = this.getNeighbors(currentId);
      let i = 0;
      while (i < neighbors.length) {
        const neighborId = neighbors[i];
        if (closedSet[neighborId] || !this.isBlockActive(neighborId)) {
          i += 1;
          continue;
        }

        const tentativeScore = gScore[currentId] + this.getTraversalCost(currentId, neighborId);
        if (gScore[neighborId] === undefined || tentativeScore < gScore[neighborId]) {
          cameFrom[neighborId] = currentId;
          gScore[neighborId] = tentativeScore;
          fScore[neighborId] = tentativeScore + heuristic(this.blockDataMap[neighborId], goalBlock);
          if (openSet.indexOf(neighborId) === -1) {
            openSet.push(neighborId);
          }
        }
        i += 1;
      }
    }

    return null;
  },

  reconstructPath(cameFrom, currentId) {
    const path = [currentId];
    let cursor = currentId;
    while (cameFrom[cursor]) {
      cursor = cameFrom[cursor];
      path.unshift(cursor);
    }
    return path;
  },

  getTraversalCost(fromId, toId) {
    const fromBlock = this.blockDataMap[fromId];
    const toBlock = this.blockDataMap[toId];
    return 1 + Math.abs(fromBlock.y - toBlock.y) * 0.65;
  },

  getNeighbors(blockId) {
    const block = this.blockDataMap[blockId];
    const neighbors = [];
    const linked = this.activeLinks[blockId];
    let i = 0;

    if (linked && linked.length) {
      while (i < linked.length) {
        if (this.isBlockActive(linked[i]) && neighbors.indexOf(linked[i]) === -1) {
          neighbors.push(linked[i]);
        }
        i += 1;
      }
    }

    const directions = [
      { x: 1, z: 0 },
      { x: -1, z: 0 },
      { x: 0, z: 1 },
      { x: 0, z: -1 },
    ];

    i = 0;
    while (i < directions.length) {
      const direction = directions[i];
      const nextBlock = this.positionMap[makePositionKey(block.x + direction.x, block.z + direction.z)];
      if (
        nextBlock &&
        this.isBlockActive(nextBlock.id) &&
        !this.isMechanismControlledPair(block, nextBlock) &&
        this.canWalkBetween(block, nextBlock) &&
        neighbors.indexOf(nextBlock.id) === -1
      ) {
        neighbors.push(nextBlock.id);
      }
      i += 1;
    }

    return neighbors;
  },

  isMechanismControlledPair(a, b) {
    return a.type === 2 || b.type === 2 || a.type === 5 || b.type === 5;
  },

  canWalkBetween(fromBlock, toBlock) {
    const manhattan2D = Math.abs(fromBlock.x - toBlock.x) + Math.abs(fromBlock.z - toBlock.z);
    if (manhattan2D !== 1) {
      return false;
    }

    const heightDiff = Math.abs(fromBlock.y - toBlock.y);
    if (fromBlock.type === 4 || toBlock.type === 4) {
      return heightDiff <= 1;
    }
    return heightDiff <= 0.5;
  },

  addActiveLink(fromId, toId) {
    if (!this.blockDataMap[fromId] || !this.blockDataMap[toId]) {
      return;
    }
    if (!this.activeLinks[fromId]) {
      this.activeLinks[fromId] = [];
    }
    if (!this.activeLinks[toId]) {
      this.activeLinks[toId] = [];
    }
    if (this.activeLinks[fromId].indexOf(toId) === -1) {
      this.activeLinks[fromId].push(toId);
    }
    if (this.activeLinks[toId].indexOf(fromId) === -1) {
      this.activeLinks[toId].push(fromId);
    }
  },

  rebuildMechanismLinks(immediate) {
    this.activeLinks = {};

    let i = 0;
    while (i < this.bridgePaths.length) {
      this.setBridgePathActive(this.bridgePaths[i], false, immediate);
      i += 1;
    }

    i = 0;
    while (i < level.mechanisms.length) {
      const mechanism = level.mechanisms[i];
      const state = this.mechanismStates[mechanism.id];
      const rotationState = state ? state.rotationState : mechanism.initialState || 0;
      const links = (mechanism.linksByState && mechanism.linksByState[rotationState]) || [];

      let j = 0;
      while (j < links.length) {
        this.activateMechanismPair(links[j][0], links[j][1], immediate);
        j += 1;
      }
      i += 1;
    }
  },

  activateMechanismPair(fromId, toId, immediate) {
    const bridgePath = this.bridgePathMap[makePairKey(fromId, toId)];
    if (bridgePath) {
      this.setBridgePathActive(bridgePath, true, immediate);
      let i = 0;
      while (i < bridgePath.routeIds.length - 1) {
        this.addActiveLink(bridgePath.routeIds[i], bridgePath.routeIds[i + 1]);
        i += 1;
      }
      return;
    }

    this.addActiveLink(fromId, toId);
  },

  setBridgePathActive(bridgePath, active, immediate) {
    let i = 0;
    while (i < bridgePath.nodeIds.length) {
      this.setBridgeNodeActive(bridgePath.nodeIds[i], active, immediate);
      i += 1;
    }

    const targetScale = active ? 1 : 0.001;
    if (immediate) {
      bridgePath.currentScale = targetScale;
      bridgePath.startScale = targetScale;
      bridgePath.targetScale = targetScale;
      bridgePath.animating = false;
      this.applyBridgeVisualScale(bridgePath);
      return;
    }

    if (bridgePath.targetScale !== targetScale) {
      bridgePath.startScale = bridgePath.currentScale;
      bridgePath.targetScale = targetScale;
      bridgePath.startTime = Date.now();
      bridgePath.animating = true;
      if (bridgePath.group) {
        bridgePath.group.visible = true;
      }
      i = 0;
      while (i < bridgePath.nodeIds.length) {
        const mesh = this.blockMeshes[bridgePath.nodeIds[i]];
        if (mesh) {
          mesh.visible = true;
        }
        i += 1;
      }
    }
  },

  applyBridgeVisualScale(bridgePath) {
    const scaleZ = Math.max(0.001, bridgePath.currentScale);
    const active = bridgePath.targetScale > 0.001 || bridgePath.animating;

    if (bridgePath.group) {
      bridgePath.group.visible = active;
    }
    if (bridgePath.beam) {
      bridgePath.beam.scale.z = scaleZ;
    }
    if (bridgePath.railA) {
      bridgePath.railA.scale.z = scaleZ;
    }
    if (bridgePath.railB) {
      bridgePath.railB.scale.z = scaleZ;
    }

    let i = 0;
    while (i < bridgePath.nodeIds.length) {
      const nodeId = bridgePath.nodeIds[i];
      const mesh = this.blockMeshes[nodeId];
      const collider = this.bridgeColliders[nodeId];
      if (mesh) {
        mesh.scale.set(1, 1, scaleZ);
        mesh.visible = active || this.blockActiveState[nodeId];
        if (!active && !this.blockActiveState[nodeId]) {
          mesh.visible = false;
        }
      }
      if (collider) {
        collider.scale.set(1, 1, scaleZ);
        collider.visible = !!this.blockActiveState[nodeId];
      }
      i += 1;
    }
  },

  updateBridgeAnimations(now) {
    let i = 0;
    while (i < this.bridgePaths.length) {
      const bridgePath = this.bridgePaths[i];
      if (bridgePath.animating) {
        const progress = clamp((now - bridgePath.startTime) / bridgePath.duration, 0, 1);
        const eased = easeOutCubic(progress);
        bridgePath.currentScale = lerp(bridgePath.startScale, bridgePath.targetScale, eased);
        if (progress >= 1) {
          bridgePath.currentScale = bridgePath.targetScale;
          bridgePath.animating = false;
        }
      }
      this.applyBridgeVisualScale(bridgePath);
      i += 1;
    }
  },

  triggerMechanism(mechanismId) {
    const mechanismMesh = this.mechanismMeshes[mechanismId];
    const state = this.mechanismStates[mechanismId];

    if (!mechanismMesh || !state) {
      return;
    }

    let i = 0;
    while (i < this.activeMechanismAnimations.length) {
      if (this.activeMechanismAnimations[i].mechanismId === mechanismId) {
        return;
      }
      i += 1;
    }

    const nextState = (state.rotationState + 1) % 4;
    this.activeMechanismAnimations.push({
      mechanismId,
      mesh: mechanismMesh,
      fromRotation: mechanismMesh.rotation.y,
      toRotation: mechanismMesh.rotation.y + Math.PI / 2,
      baseY: mechanismMesh.position.y,
      startTime: Date.now(),
      duration: MECHANISM_ROTATION_DURATION,
      nextState,
    });
  },

  updateMechanismAnimations(now) {
    if (!this.activeMechanismAnimations.length) {
      return;
    }

    const nextAnimations = [];
    let i = 0;
    while (i < this.activeMechanismAnimations.length) {
      const animation = this.activeMechanismAnimations[i];
      const progress = clamp((now - animation.startTime) / animation.duration, 0, 1);
      const rotationProgress = easeOutElastic(progress);
      animation.mesh.rotation.y = lerp(animation.fromRotation, animation.toRotation, rotationProgress);

      let lift = 0;
      if (progress < 0.5) {
        lift = easeOutCubic(progress / 0.5) * 0.22;
      } else {
        lift = (1 - easeOutBounce((progress - 0.5) / 0.5)) * 0.22;
      }
      animation.mesh.position.y = animation.baseY + lift;

      if (progress >= 1) {
        animation.mesh.rotation.y = animation.toRotation;
        animation.mesh.position.y = animation.baseY;
        this.mechanismStates[animation.mechanismId].rotationState = animation.nextState;
        this.rebuildMechanismLinks(false);
      } else {
        nextAnimations.push(animation);
      }
      i += 1;
    }

    this.activeMechanismAnimations = nextAnimations;
  },

  startNextMove() {
    if (!this.pendingPath.length) {
      return;
    }

    const nextId = this.pendingPath.shift();
    const currentBlock = this.blockDataMap[this.playerBlockId];
    const nextBlock = this.blockDataMap[nextId];
    const fromPosition = this.getWorldPositionForBlock(currentBlock);
    const toPosition = this.getWorldPositionForBlock(nextBlock);
    const duration =
      PLAYER_MOVE_BASE_DURATION +
      Math.abs(nextBlock.y - currentBlock.y) * PLAYER_MOVE_HEIGHT_BONUS;

    this.playerContainer.rotation.y = Math.atan2(
      toPosition.x - fromPosition.x,
      toPosition.z - fromPosition.z
    );

    this.activeMove = {
      blockId: nextId,
      fromX: fromPosition.x,
      fromY: fromPosition.y,
      fromZ: fromPosition.z,
      toX: toPosition.x,
      toY: toPosition.y,
      toZ: toPosition.z,
      startTime: Date.now(),
      duration,
    };
  },

  updatePlayerMovement(now) {
    if (!this.activeMove) {
      return;
    }

    const progress = clamp((now - this.activeMove.startTime) / this.activeMove.duration, 0, 1);
    const eased = easeInOutQuad(progress);
    const hop = Math.sin(progress * Math.PI) * 0.16;

    this.playerContainer.position.set(
      lerp(this.activeMove.fromX, this.activeMove.toX, eased),
      lerp(this.activeMove.fromY, this.activeMove.toY, eased) + 0.18 + hop,
      lerp(this.activeMove.fromZ, this.activeMove.toZ, eased)
    );

    if (progress >= 1) {
      this.playerBlockId = this.activeMove.blockId;
      this.activeMove = null;
      this.placePlayerAtBlock(this.playerBlockId);

      if (this.pendingPath.length) {
        this.startNextMove();
      } else if (this.blockDataMap[this.playerBlockId].type === 3) {
        this.startLevelClear();
      }
    }
  },

  startLevelClear() {
    if (this.levelClearState) {
      return;
    }

    this.pendingPath = [];
    this.activeMove = null;
    this.levelClearState = {
      startTime: Date.now(),
      duration: LEVEL_CLEAR_DURATION,
      modalShown: false,
    };

    console.log('Level Cleared');
  },

  showLevelClearModal() {
    if (!wx || !wx.showModal) {
      this.resetLevelToStart();
      return;
    }

    wx.showModal({
      title: '通关成功',
      content: '你解开了两座转盘迷宫，已经抵达终点。',
      showCancel: false,
      confirmText: '回到起点',
      success: () => {
        this.resetLevelToStart();
      },
    });
  },

  resetLevelToStart() {
    this.pendingPath = [];
    this.activeMove = null;
    this.activeMechanismAnimations = [];
    this.blockedUntil = 0;
    this.levelClearState = null;

    let i = 0;
    while (i < level.mechanisms.length) {
      const mechanism = level.mechanisms[i];
      const initialState = mechanism.initialState || 0;
      this.mechanismStates[mechanism.id].rotationState = initialState;
      const mesh = this.mechanismMeshes[mechanism.id];
      if (mesh) {
        mesh.rotation.y = initialState * Math.PI / 2;
        mesh.position.y = 0;
      }
      i += 1;
    }

    this.rebuildMechanismLinks(true);
    this.playerBlockId = level.startBlockId;
    this.placePlayerAtBlock(this.playerBlockId);
    this.playerContainer.rotation.set(0, 0, 0);
    this.playerAvatarRoot.rotation.set(0, 0, 0);
    this.playerAvatarRoot.scale.set(1, 1, 1);
    this.updateCamera(true);
  },

  createPlayerContainer() {
    this.playerContainer = new this.THREE.Group();
    this.playerAvatarRoot = new this.THREE.Group();
    this.playerContainer.add(this.playerAvatarRoot);
    this.scene.add(this.playerContainer);
    this.sceneObjects.push(this.playerContainer);

    this.fallbackPlayer = this.createFallbackPlayer();
    this.playerAvatarRoot.add(this.fallbackPlayer.root);
  },

  createFallbackPlayer() {
    const THREE = this.THREE;
    const root = new THREE.Group();

    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.25, 0.56, 16),
      new THREE.MeshLambertMaterial({ color: COLORS.playerSecondary })
    );
    body.position.y = 0.42;

    const chest = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.18, 0.16),
      new THREE.MeshLambertMaterial({ color: COLORS.playerMetal })
    );
    chest.position.set(0, 0.46, 0.15);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.23, 16, 16),
      new THREE.MeshLambertMaterial({ color: COLORS.playerPrimary })
    );
    head.position.y = 0.86;

    const antenna = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.024, 0.2, 8),
      new THREE.MeshLambertMaterial({ color: COLORS.playerMetal })
    );
    antenna.position.y = 1.1;

    const antennaTip = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 10, 10),
      new THREE.MeshLambertMaterial({ color: COLORS.playerAccent })
    );
    antennaTip.position.y = 1.22;

    const backpack = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.22, 0.14),
      new THREE.MeshLambertMaterial({ color: COLORS.playerAccent })
    );
    backpack.position.set(0, 0.42, -0.18);

    const armLeft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.06, 0.34, 12),
      new THREE.MeshLambertMaterial({ color: COLORS.playerPrimary })
    );
    armLeft.position.set(-0.23, 0.48, 0);

    const armRight = armLeft.clone();
    armRight.position.x = 0.23;

    const legLeft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.065, 0.34, 12),
      new THREE.MeshLambertMaterial({ color: COLORS.playerMetal })
    );
    legLeft.position.set(-0.09, 0.12, 0);

    const legRight = legLeft.clone();
    legRight.position.x = 0.09;

    const eyeLeft = new THREE.Mesh(
      new THREE.SphereGeometry(0.032, 10, 10),
      new THREE.MeshLambertMaterial({ color: COLORS.eye })
    );
    eyeLeft.position.set(-0.065, 0.9, 0.19);

    const eyeRight = eyeLeft.clone();
    eyeRight.position.x = 0.065;

    root.add(body);
    root.add(chest);
    root.add(head);
    root.add(antenna);
    root.add(antennaTip);
    root.add(backpack);
    root.add(armLeft);
    root.add(armRight);
    root.add(legLeft);
    root.add(legRight);
    root.add(eyeLeft);
    root.add(eyeRight);

    return {
      root,
      body,
      chest,
      head,
      antenna,
      antennaTip,
      backpack,
      armLeft,
      armRight,
      legLeft,
      legRight,
    };
  },

  placePlayerAtBlock(blockId) {
    const position = this.getWorldPositionForBlock(this.blockDataMap[blockId]);
    this.playerContainer.position.set(position.x, position.y + 0.18, position.z);
  },

  updatePlayerAvatar(now) {
    const elapsed = (now - this.timeStart) / 1000;
    const walker = this.fallbackPlayer;
    if (!walker) {
      return;
    }

    if (this.activeMove) {
      const walkWave = Math.sin(elapsed * 12);
      walker.armLeft.rotation.x = walkWave * 0.64;
      walker.armRight.rotation.x = -walkWave * 0.64;
      walker.legLeft.rotation.x = -walkWave * 0.68;
      walker.legRight.rotation.x = walkWave * 0.68;
      walker.body.position.y = 0.42 + Math.abs(walkWave) * 0.05;
      walker.head.position.y = 0.86 + Math.abs(walkWave) * 0.035;
      walker.backpack.position.y = 0.42 + Math.abs(walkWave) * 0.02;
      walker.antennaTip.position.y = 1.22 + Math.abs(walkWave) * 0.035;
    } else {
      const breath = Math.sin(elapsed * 3.2);
      walker.body.scale.y = 1 + breath * 0.035;
      walker.armLeft.rotation.x = breath * 0.08;
      walker.armRight.rotation.x = -breath * 0.08;
      walker.legLeft.rotation.x = 0;
      walker.legRight.rotation.x = 0;
      walker.body.position.y = 0.42;
      walker.head.position.y = 0.86 + breath * 0.04;
      walker.backpack.position.y = 0.42 + breath * 0.02;
      walker.antennaTip.position.y = 1.22 + breath * 0.035;
    }

    if (now < this.blockedUntil) {
      const blockedProgress = 1 - (this.blockedUntil - now) / BLOCKED_FEEDBACK_DURATION;
      const wobble = Math.sin(blockedProgress * Math.PI * 4) * 0.08;
      this.playerAvatarRoot.rotation.z = wobble;
      this.playerAvatarRoot.scale.set(1 + Math.abs(wobble) * 0.2, 1 - Math.abs(wobble) * 0.08, 1);
    } else {
      this.playerAvatarRoot.rotation.z = 0;
      this.playerAvatarRoot.scale.set(1, 1, 1);
    }
  },

  updateCamera(forceSnap) {
    if (!this.playerContainer) {
      return;
    }

    const targetX = this.playerContainer.position.x;
    const targetY = this.playerContainer.position.y + 0.95;
    const targetZ = this.playerContainer.position.z;

    if (this.levelClearState) {
      const progress = clamp(
        (Date.now() - this.levelClearState.startTime) / this.levelClearState.duration,
        0,
        1
      );
      const eased = easeInOutQuad(progress);
      const angle = eased * Math.PI * 2;
      const radius = lerp(11, 18, easeOutCubic(progress));
      const height = lerp(9.5, 14, easeOutCubic(progress));

      this.cameraDesired.set(
        targetX + Math.cos(angle) * radius,
        targetY + height,
        targetZ + Math.sin(angle) * radius
      );
      if (forceSnap) {
        this.camera.position.copy(this.cameraDesired);
        this.cameraLookAt.set(targetX, targetY + 0.8, targetZ);
      } else {
        this.camera.position.lerp(this.cameraDesired, 0.065);
        this.cameraLookAt.lerp(new this.THREE.Vector3(targetX, targetY + 0.8, targetZ), 0.09);
      }
      this.camera.lookAt(this.cameraLookAt);

      if (progress >= 1 && !this.levelClearState.modalShown) {
        this.levelClearState.modalShown = true;
        this.showLevelClearModal();
      }
      return;
    }

    this.cameraDesired.set(
      targetX + CAMERA_OFFSET.x,
      targetY + CAMERA_OFFSET.y,
      targetZ + CAMERA_OFFSET.z
    );

    if (forceSnap) {
      this.camera.position.copy(this.cameraDesired);
      this.cameraLookAt.set(targetX, targetY, targetZ);
    } else {
      this.camera.position.lerp(this.cameraDesired, CAMERA_LERP);
      this.cameraLookAt.lerp(new this.THREE.Vector3(targetX, targetY, targetZ), CAMERA_LERP);
    }

    this.camera.lookAt(this.cameraLookAt);
  },

  renderLoop() {
    if (this.isUnloading) {
      return;
    }

    const now = Date.now();
    this.updatePlayerMovement(now);
    this.updateMechanismAnimations(now);
    this.updateBridgeAnimations(now);
    this.updatePlayerAvatar(now);
    this.updateCamera(false);

    this.renderer.render(this.scene, this.camera);

    this.rafId = this.canvas.requestAnimationFrame(() => {
      this.renderLoop();
    });
  },
});
