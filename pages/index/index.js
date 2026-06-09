const { createScopedThreejs } = require('threejs-miniprogram');

const GRID_SIZE = 50;
const GRID_SPACING = 1.7;
const HEIGHT_UNIT = 1.4;
const BLOCK_SIZE = 1.22;
const BLOCK_THICKNESS = 0.34;
const PILLAR_MIN_HEIGHT = 0.35;
const PLAYER_MOVE_BASE_DURATION = 180;
const PLAYER_MOVE_HEIGHT_BONUS = 90;
const MECHANISM_ROTATION_DURATION = 760;
const BRIDGE_ANIMATION_DURATION = 420;
const BLOCKED_FEEDBACK_DURATION = 260;
const LEVEL_CLEAR_DURATION = 3200;
const CAMERA_LERP = 0.08;
const CAMERA_OFFSET = { x: 9.5, y: 10.8, z: 9.5 };

const COLORS = {
  background: 0x2b2d42,
  fog: 0x323754,
  path: 0xffb7b2,
  pathAccent: 0xffd4cf,
  stair: 0xffc8c3,
  stairAccent: 0xffe0db,
  mechanism: 0xe2f0cb,
  mechanismAccent: 0xf6ffec,
  goal: 0xffe66d,
  goalAccent: 0xfff2b3,
  bridge: 0xd4f1f4,
  bridgeAccent: 0xf4fbff,
  pillar: 0x444b70,
  playerPrimary: 0xf7f7ff,
  playerSecondary: 0xff6b6b,
  playerAccent: 0x94d2bd,
  playerMetal: 0xd9dce7,
  shadow: 0x1b1e2c,
};

const level = {
  startBlockId: 'b1',
  goalBlockId: 'b59',
  blocks: [
    { id: 'b1', x: 4, y: 0, z: 4, type: 1 },
    { id: 'b2', x: 5, y: 0, z: 4, type: 1 },
    { id: 'b3', x: 6, y: 0, z: 4, type: 1 },
    { id: 'b4', x: 7, y: 0, z: 4, type: 1 },
    { id: 'b5', x: 8, y: 0, z: 4, type: 1 },
    { id: 'b6', x: 9, y: 0, z: 4, type: 1 },
    { id: 'b7', x: 10, y: 0, z: 4, type: 1 },
    { id: 'b8', x: 11, y: 0, z: 4, type: 1 },
    { id: 'b9', x: 12, y: 0.5, z: 4, type: 4 },
    { id: 'b10', x: 13, y: 1, z: 4, type: 4 },
    { id: 'b11', x: 14, y: 1, z: 4, type: 1 },
    { id: 'b12', x: 14, y: 1, z: 5, type: 1 },
    { id: 'b13', x: 14, y: 1, z: 6, type: 1 },
    { id: 'b14', x: 14, y: 1, z: 7, type: 1 },
    { id: 'b15', x: 14, y: 1, z: 8, type: 1 },
    { id: 'b16', x: 15, y: 1, z: 8, type: 1 },
    { id: 'b17', x: 16, y: 1, z: 8, type: 1 },
    { id: 'b18', x: 17, y: 1, z: 8, type: 1 },
    { id: 'b19', x: 18, y: 1.5, z: 8, type: 4 },
    { id: 'b20', x: 19, y: 2, z: 8, type: 4 },
    { id: 'b21', x: 20, y: 2, z: 8, type: 1 },
    { id: 'b22', x: 21, y: 2, z: 8, type: 1 },
    { id: 'b23', x: 22, y: 2, z: 8, type: 2, mechanismId: 'm1' },
    { id: 'b24', x: 25, y: 2, z: 8, type: 1 },
    { id: 'b25', x: 26, y: 2, z: 8, type: 1 },
    { id: 'b26', x: 27, y: 2, z: 8, type: 1 },
    { id: 'b27', x: 28, y: 2, z: 8, type: 1 },
    { id: 'b28', x: 28, y: 2, z: 9, type: 1 },
    { id: 'b29', x: 28, y: 2, z: 10, type: 1 },
    { id: 'b30', x: 28, y: 2, z: 11, type: 1 },
    { id: 'b31', x: 28, y: 2, z: 12, type: 1 },
    { id: 'b32', x: 29, y: 1.5, z: 12, type: 4 },
    { id: 'b33', x: 30, y: 1, z: 12, type: 4 },
    { id: 'b34', x: 31, y: 0.5, z: 12, type: 4 },
    { id: 'b35', x: 32, y: 0, z: 12, type: 4 },
    { id: 'b36', x: 32, y: 0, z: 13, type: 1 },
    { id: 'b37', x: 32, y: 0, z: 14, type: 1 },
    { id: 'b38', x: 33, y: 0, z: 14, type: 1 },
    { id: 'b39', x: 34, y: 0, z: 14, type: 1 },
    { id: 'b40', x: 35, y: 0.5, z: 14, type: 4 },
    { id: 'b41', x: 36, y: 1, z: 14, type: 4 },
    { id: 'b42', x: 37, y: 1, z: 14, type: 1 },
    { id: 'b43', x: 38, y: 1, z: 14, type: 1 },
    { id: 'b44', x: 38, y: 1, z: 15, type: 1 },
    { id: 'b45', x: 38, y: 1, z: 16, type: 1 },
    { id: 'b46', x: 38, y: 1.5, z: 17, type: 4 },
    { id: 'b47', x: 38, y: 2, z: 18, type: 4 },
    { id: 'b48', x: 37, y: 2, z: 18, type: 1 },
    { id: 'b49', x: 36, y: 2, z: 18, type: 1 },
    { id: 'b50', x: 35, y: 2, z: 18, type: 1 },
    { id: 'b51', x: 34, y: 2, z: 18, type: 1 },
    { id: 'b52', x: 33, y: 2, z: 18, type: 1 },
    { id: 'b53', x: 32, y: 2, z: 18, type: 1 },
    { id: 'b54', x: 31, y: 2, z: 18, type: 1 },
    { id: 'b55', x: 30, y: 2, z: 18, type: 1 },
    { id: 'b56', x: 29, y: 2, z: 18, type: 1 },
    { id: 'b57', x: 29, y: 2.5, z: 19, type: 4 },
    { id: 'b58', x: 29, y: 3, z: 20, type: 4 },
    { id: 'b59', x: 28, y: 3, z: 20, type: 3 },
  ],
  mechanisms: [
    {
      id: 'm1',
      type: 'rotate',
      axis: 'y',
      unlockState: 1,
      links: [['b23', 'b24']],
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
  if (t === 0) {
    return 0;
  }
  if (t === 1) {
    return 1;
  }
  const c4 = (2 * Math.PI) / 3;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

function makePositionKey(x, z) {
  return `${x}:${z}`;
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
    Math.abs(blockA.y - blockB.y) * 2
  );
}

Page({
  data: {},

  onReady() {
    this.viewportWidth = 0;
    this.viewportHeight = 0;
    this.isUnloading = false;
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
    this.blockActiveState = {};
    this.mechanismMeshes = {};
    this.mechanismStates = {};
    this.activeLinks = {};
    this.bridgeStates = [];
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
      });
      this.registerBlock(block);
      i += 1;
    }

    i = 0;
    while (i < level.mechanisms.length) {
      this.createRuntimeBridgeNodes(level.mechanisms[i]);
      i += 1;
    }
  },

  registerBlock(block) {
    this.blockDataMap[block.id] = block;
    this.positionMap[makePositionKey(block.x, block.z)] = block;
    this.blockActiveState[block.id] = !block.isBridge;
  },

  createRuntimeBridgeNodes(mechanism) {
    let linkIndex = 0;
    while (linkIndex < mechanism.links.length) {
      const pair = mechanism.links[linkIndex];
      const fromBlock = this.blockDataMap[pair[0]];
      const toBlock = this.blockDataMap[pair[1]];
      const dx = toBlock.x - fromBlock.x;
      const dz = toBlock.z - fromBlock.z;
      const stepX = dx === 0 ? 0 : dx / Math.abs(dx);
      const stepZ = dz === 0 ? 0 : dz / Math.abs(dz);
      const length = Math.abs(dx) + Math.abs(dz);
      let step = 1;

      while (step < length) {
        const x = fromBlock.x + stepX * step;
        const z = fromBlock.z + stepZ * step;
        const y = lerp(fromBlock.y, toBlock.y, step / length);
        const block = {
          id: `${mechanism.id}-bridge-${linkIndex}-${step}`,
          x,
          y,
          z,
          type: 5,
          isBridge: true,
          mechanismId: mechanism.id,
        };
        this.registerBlock(block);
        step += 1;
      }

      linkIndex += 1;
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
      this.scene.fog = new THREE.Fog(COLORS.fog, 18, 120);

      this.renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
      });
      this.renderer.setPixelRatio(dpr);
      this.renderer.setSize(width, height);

      const aspect = width / height;
      const frustumSize = 17;
      this.camera = new THREE.OrthographicCamera(
        (-frustumSize * aspect) / 2,
        (frustumSize * aspect) / 2,
        frustumSize / 2,
        -frustumSize / 2,
        0.1,
        220
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

    const ambient = new THREE.AmbientLight(0xffffff, 0.74);
    this.scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xfff4ea, 1.15);
    keyLight.position.set(12, 18, 7);
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xa8dadc, 0.42);
    fillLight.position.set(-10, 9, -15);
    this.scene.add(fillLight);

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(70, 72),
      new THREE.MeshBasicMaterial({
        color: COLORS.shadow,
        transparent: true,
        opacity: 0.34,
      })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.9;
    this.scene.add(ground);
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
      this.setBlockVisualState(block.id, this.blockActiveState[block.id], true);
      i += 1;
    }

    i = 0;
    while (i < level.mechanisms.length) {
      const mechanism = level.mechanisms[i];
      this.mechanismStates[mechanism.id] = {
        rotationState: 0,
        unlockState: mechanism.unlockState,
      };
      this.bridgeStates = this.bridgeStates.concat(this.createBridgeStates(mechanism));
      i += 1;
    }

    this.rebuildMechanismLinks();
  },

  createBlockGroup(block) {
    const THREE = this.THREE;
    const group = new THREE.Group();
    const position = this.getWorldPositionForBlock(block);
    group.position.set(position.x, 0, position.z);

    const topY = surfaceY(block.y);
    const pillarHeight = Math.max(PILLAR_MIN_HEIGHT, topY + BLOCK_THICKNESS / 2 + 0.45);
    const pillar = new THREE.Mesh(
      new THREE.BoxGeometry(BLOCK_SIZE * 0.76, pillarHeight, BLOCK_SIZE * 0.76),
      new THREE.MeshLambertMaterial({ color: COLORS.pillar })
    );
    pillar.position.y = pillarHeight / 2 - 0.45;

    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_THICKNESS, BLOCK_SIZE),
      new THREE.MeshLambertMaterial({ color: this.getBlockColor(block) })
    );
    cap.position.y = topY;

    const accent = new THREE.Mesh(
      new THREE.BoxGeometry(BLOCK_SIZE * 0.82, 0.08, BLOCK_SIZE * 0.82),
      new THREE.MeshLambertMaterial({ color: this.getBlockAccentColor(block) })
    );
    accent.position.y = topY + BLOCK_THICKNESS / 2 + 0.06;

    group.add(pillar);
    group.add(cap);
    group.add(accent);

    if (block.type === 4) {
      const stepA = new THREE.Mesh(
        new THREE.BoxGeometry(BLOCK_SIZE * 0.82, 0.1, BLOCK_SIZE * 0.28),
        new THREE.MeshLambertMaterial({ color: COLORS.stairAccent })
      );
      stepA.position.set(0, topY + BLOCK_THICKNESS / 2 + 0.12, -0.24);

      const stepB = new THREE.Mesh(
        new THREE.BoxGeometry(BLOCK_SIZE * 0.7, 0.12, BLOCK_SIZE * 0.24),
        new THREE.MeshLambertMaterial({ color: COLORS.stairAccent })
      );
      stepB.position.set(0, topY + BLOCK_THICKNESS / 2 + 0.22, 0.04);

      group.add(stepA);
      group.add(stepB);
    }

    if (block.type === 2) {
      const rotor = new THREE.Mesh(
        new THREE.BoxGeometry(BLOCK_SIZE * 0.9, 0.14, BLOCK_SIZE * 0.2),
        new THREE.MeshLambertMaterial({ color: COLORS.mechanismAccent })
      );
      rotor.position.set(0.18, topY + BLOCK_THICKNESS / 2 + 0.12, 0);

      const core = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.2, 0.26, 18),
        new THREE.MeshLambertMaterial({ color: 0xffffff })
      );
      core.position.set(0, topY + BLOCK_THICKNESS / 2 + 0.2, 0);

      group.add(rotor);
      group.add(core);
      this.mechanismMeshes[block.mechanismId] = group;
    }

    if (block.type === 3) {
      const beacon = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.18, 0.56, 18),
        new THREE.MeshLambertMaterial({ color: COLORS.goalAccent })
      );
      beacon.position.y = topY + BLOCK_THICKNESS / 2 + 0.3;
      group.add(beacon);
    }

    if (block.type === 5) {
      const railLeft = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.18, BLOCK_SIZE * 0.88),
        new THREE.MeshLambertMaterial({ color: COLORS.bridgeAccent })
      );
      railLeft.position.set(-0.34, topY + BLOCK_THICKNESS / 2 + 0.1, 0);
      const railRight = railLeft.clone();
      railRight.position.x = 0.34;
      group.add(railLeft);
      group.add(railRight);
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
    return COLORS.pathAccent;
  },

  createBridgeStates(mechanism) {
    const THREE = this.THREE;
    const states = [];
    let linkIndex = 0;

    while (linkIndex < mechanism.links.length) {
      const pair = mechanism.links[linkIndex];
      const fromBlock = this.blockDataMap[pair[0]];
      const toBlock = this.blockDataMap[pair[1]];
      const dx = toBlock.x - fromBlock.x;
      const dz = toBlock.z - fromBlock.z;
      const length = Math.abs(dx) + Math.abs(dz);
      const stepX = dx === 0 ? 0 : dx / Math.abs(dx);
      const stepZ = dz === 0 ? 0 : dz / Math.abs(dz);
      const nodeIds = [];
      const nodeGroups = [];

      let step = 1;
      while (step < length) {
        const nodeId = `${mechanism.id}-bridge-${linkIndex}-${step}`;
        nodeIds.push(nodeId);
        nodeGroups.push(this.blockMeshes[nodeId]);
        step += 1;
      }

      const bridgeGroup = new THREE.Group();
      const fromPosition = this.getWorldPositionForBlock(fromBlock);
      const toPosition = this.getWorldPositionForBlock(toBlock);
      const wxdx = toPosition.x - fromPosition.x;
      const wzdz = toPosition.z - fromPosition.z;
      const beamLength = Math.sqrt(wxdx * wxdx + wzdz * wzdz);
      const beamY = Math.min(fromPosition.y, toPosition.y) + 0.1;

      bridgeGroup.position.set(
        (fromPosition.x + toPosition.x) / 2,
        beamY,
        (fromPosition.z + toPosition.z) / 2
      );
      bridgeGroup.rotation.y = Math.atan2(wxdx, wzdz);

      const beam = new THREE.Mesh(
        new THREE.BoxGeometry(0.72, 0.18, beamLength + 0.08),
        new THREE.MeshLambertMaterial({ color: COLORS.bridge })
      );
      beam.scale.z = 0.001;

      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.08, beamLength + 0.02),
        new THREE.MeshLambertMaterial({ color: COLORS.bridgeAccent })
      );
      rail.position.y = 0.16;
      rail.scale.z = 0.001;

      bridgeGroup.add(beam);
      bridgeGroup.add(rail);
      bridgeGroup.visible = false;

      this.scene.add(bridgeGroup);
      this.sceneObjects.push(bridgeGroup);

      states.push({
        id: `${mechanism.id}:${linkIndex}`,
        mechanismId: mechanism.id,
        fromId: fromBlock.id,
        toId: toBlock.id,
        nodeIds,
        nodeGroups,
        group: bridgeGroup,
        beam,
        rail,
        currentScale: 0.001,
        startScale: 0.001,
        targetScale: 0.001,
        startTime: 0,
        duration: BRIDGE_ANIMATION_DURATION,
        animating: false,
      });

      linkIndex += 1;
    }

    return states;
  },

  createPlayerContainer() {
    const THREE = this.THREE;

    this.playerContainer = new THREE.Group();
    this.playerAvatarRoot = new THREE.Group();
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
      new THREE.CylinderGeometry(0.18, 0.24, 0.56, 16),
      new THREE.MeshLambertMaterial({ color: COLORS.playerSecondary })
    );
    body.position.y = 0.42;

    const chest = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.18, 0.16),
      new THREE.MeshLambertMaterial({ color: COLORS.playerMetal })
    );
    chest.position.set(0, 0.46, 0.14);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 16, 16),
      new THREE.MeshLambertMaterial({ color: COLORS.playerPrimary })
    );
    head.position.y = 0.86;

    const backpack = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.22, 0.14),
      new THREE.MeshLambertMaterial({ color: COLORS.playerAccent })
    );
    backpack.position.set(0, 0.42, -0.18);

    const armLeft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.06, 0.34, 12),
      new THREE.MeshLambertMaterial({ color: COLORS.playerPrimary })
    );
    armLeft.position.set(-0.22, 0.48, 0);

    const armRight = armLeft.clone();
    armRight.position.x = 0.22;

    const legLeft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.065, 0.34, 12),
      new THREE.MeshLambertMaterial({ color: COLORS.playerMetal })
    );
    legLeft.position.set(-0.09, 0.12, 0);

    const legRight = legLeft.clone();
    legRight.position.x = 0.09;

    const eyeLeft = new THREE.Mesh(
      new THREE.SphereGeometry(0.03, 10, 10),
      new THREE.MeshLambertMaterial({ color: 0x212529 })
    );
    eyeLeft.position.set(-0.06, 0.9, 0.19);

    const eyeRight = eyeLeft.clone();
    eyeRight.position.x = 0.06;

    root.add(body);
    root.add(chest);
    root.add(head);
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
      backpack,
      armLeft,
      armRight,
      legLeft,
      legRight,
    };
  },

  getWorldPositionForBlock(block) {
    return {
      x: worldX(block.x),
      y: surfaceY(block.y) + BLOCK_THICKNESS / 2,
      z: worldZ(block.z),
    };
  },

  setBlockVisualState(blockId, active, immediate) {
    const group = this.blockMeshes[blockId];
    if (!group) {
      return;
    }

    if (!group.userData.isBridge) {
      group.visible = true;
      return;
    }

    if (active) {
      group.visible = true;
      if (immediate) {
        group.scale.set(1, 1, 1);
      } else {
        group.scale.set(1, 1, Math.max(group.scale.z, 0.001));
      }
    } else if (immediate) {
      group.visible = false;
      group.scale.set(1, 1, 0.001);
    }
  },

  isBlockActive(blockId) {
    return !!this.blockActiveState[blockId];
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
    if (!startBlock || !goalBlock) {
      return null;
    }

    const openSet = [startId];
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

      const neighbors = this.getNeighbors(currentId);
      let i = 0;
      while (i < neighbors.length) {
        const neighborId = neighbors[i];
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
    return 1 + Math.abs(fromBlock.y - toBlock.y) * 0.6;
  },

  getNeighbors(blockId) {
    const block = this.blockDataMap[blockId];
    const neighbors = [];
    const directions = [
      { x: 1, z: 0 },
      { x: -1, z: 0 },
      { x: 0, z: 1 },
      { x: 0, z: -1 },
    ];

    let i = 0;
    while (i < directions.length) {
      const direction = directions[i];
      const nextBlock = this.positionMap[makePositionKey(block.x + direction.x, block.z + direction.z)];
      if (nextBlock && this.isBlockActive(nextBlock.id) && this.canWalkBetween(block, nextBlock)) {
        neighbors.push(nextBlock.id);
      }
      i += 1;
    }

    const linked = this.activeLinks[blockId];
    if (linked && linked.length) {
      i = 0;
      while (i < linked.length) {
        neighbors.push(linked[i]);
        i += 1;
      }
    }

    return neighbors;
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

  placePlayerAtBlock(blockId) {
    const position = this.getWorldPositionForBlock(this.blockDataMap[blockId]);
    this.playerContainer.position.set(position.x, position.y + 0.18, position.z);
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

  rebuildMechanismLinks() {
    this.activeLinks = {};

    let i = 0;
    while (i < level.mechanisms.length) {
      const mechanism = level.mechanisms[i];
      const state = this.mechanismStates[mechanism.id];
      const active = state && state.rotationState === state.unlockState;
      let j = 0;
      while (j < mechanism.links.length) {
        const pair = mechanism.links[j];
        this.toggleBridgePath(mechanism.id, j, active);
        if (active && Math.abs(this.blockDataMap[pair[0]].x - this.blockDataMap[pair[1]].x) + Math.abs(this.blockDataMap[pair[0]].z - this.blockDataMap[pair[1]].z) === 1) {
          this.addActiveLink(pair[0], pair[1]);
        }
        j += 1;
      }
      i += 1;
    }
  },

  toggleBridgePath(mechanismId, linkIndex, active) {
    const prefix = `${mechanismId}:${linkIndex}`;
    let i = 0;
    while (i < this.bridgeStates.length) {
      const bridgeState = this.bridgeStates[i];
      if (bridgeState.id === prefix) {
        let nodeIndex = 0;
        while (nodeIndex < bridgeState.nodeIds.length) {
          this.blockActiveState[bridgeState.nodeIds[nodeIndex]] = active;
          this.setBlockVisualState(bridgeState.nodeIds[nodeIndex], active, false);
          nodeIndex += 1;
        }
        this.setBridgeTarget(bridgeState, active ? 1 : 0.001);
      }
      i += 1;
    }
  },

  addActiveLink(fromId, toId) {
    if (!this.activeLinks[fromId]) {
      this.activeLinks[fromId] = [];
    }
    if (!this.activeLinks[toId]) {
      this.activeLinks[toId] = [];
    }
    this.activeLinks[fromId].push(toId);
    this.activeLinks[toId].push(fromId);
  },

  setBridgeTarget(bridgeState, targetScale) {
    if (bridgeState.targetScale === targetScale) {
      return;
    }
    bridgeState.startScale = bridgeState.currentScale;
    bridgeState.targetScale = targetScale;
    bridgeState.startTime = Date.now();
    bridgeState.animating = true;
    bridgeState.group.visible = true;
    let i = 0;
    while (i < bridgeState.nodeGroups.length) {
      if (bridgeState.nodeGroups[i]) {
        bridgeState.nodeGroups[i].visible = true;
      }
      i += 1;
    }
  },

  updateBridgeAnimations(now) {
    let i = 0;
    while (i < this.bridgeStates.length) {
      const bridgeState = this.bridgeStates[i];
      if (bridgeState.animating) {
        const progress = clamp((now - bridgeState.startTime) / bridgeState.duration, 0, 1);
        const eased = easeOutCubic(progress);
        bridgeState.currentScale = lerp(bridgeState.startScale, bridgeState.targetScale, eased);
        if (progress >= 1) {
          bridgeState.currentScale = bridgeState.targetScale;
          bridgeState.animating = false;
        }
      }

      const scaleZ = Math.max(0.001, bridgeState.currentScale);
      bridgeState.beam.scale.z = scaleZ;
      bridgeState.rail.scale.z = scaleZ;

      let nodeIndex = 0;
      while (nodeIndex < bridgeState.nodeGroups.length) {
        const group = bridgeState.nodeGroups[nodeIndex];
        if (group) {
          group.scale.set(1, 1, scaleZ);
          if (!bridgeState.animating && bridgeState.targetScale <= 0.001) {
            group.visible = false;
          }
        }
        nodeIndex += 1;
      }

      if (!bridgeState.animating && bridgeState.targetScale <= 0.001) {
        bridgeState.group.visible = false;
      }

      i += 1;
    }
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
        lift = easeOutCubic(progress / 0.5) * 0.2;
      } else {
        lift = (1 - easeOutBounce((progress - 0.5) / 0.5)) * 0.2;
      }
      animation.mesh.position.y = animation.baseY + lift;

      if (progress >= 1) {
        animation.mesh.rotation.y = animation.toRotation;
        animation.mesh.position.y = animation.baseY;
        this.mechanismStates[animation.mechanismId].rotationState = animation.nextState;
        this.rebuildMechanismLinks();
      } else {
        nextAnimations.push(animation);
      }
      i += 1;
    }

    this.activeMechanismAnimations = nextAnimations;
  },

  updatePlayerMovement(now) {
    if (!this.activeMove) {
      return;
    }

    const progress = clamp((now - this.activeMove.startTime) / this.activeMove.duration, 0, 1);
    const eased = easeInOutQuad(progress);
    const hop = Math.sin(progress * Math.PI) * 0.18;

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
        this.startLevelClearSequence();
      }
    }
  },

  startLevelClearSequence() {
    if (this.levelClearState) {
      return;
    }

    this.pendingPath = [];
    this.levelClearState = {
      startTime: Date.now(),
      duration: LEVEL_CLEAR_DURATION,
      logged: false,
    };

    console.log('Level Cleared');
    if (wx && wx.showToast) {
      wx.showToast({
        title: 'Level Cleared',
        icon: 'none',
        duration: 1600,
      });
    }
  },

  updatePlayerAvatar(now) {
    const elapsed = (now - this.timeStart) / 1000;
    const walker = this.fallbackPlayer;
    if (!walker) {
      return;
    }

    if (this.activeMove) {
      const walkWave = Math.sin(elapsed * 12);
      walker.armLeft.rotation.x = walkWave * 0.6;
      walker.armRight.rotation.x = -walkWave * 0.6;
      walker.legLeft.rotation.x = -walkWave * 0.65;
      walker.legRight.rotation.x = walkWave * 0.65;
      walker.body.position.y = 0.42 + Math.abs(walkWave) * 0.05;
      walker.head.position.y = 0.86 + Math.abs(walkWave) * 0.03;
      walker.backpack.position.y = 0.42 + Math.abs(walkWave) * 0.02;
    } else {
      const breath = 1 + Math.sin(elapsed * 3.2) * 0.035;
      walker.body.scale.y = breath;
      walker.armLeft.rotation.x = Math.sin(elapsed * 3.2) * 0.08;
      walker.armRight.rotation.x = -Math.sin(elapsed * 3.2) * 0.08;
      walker.legLeft.rotation.x = 0;
      walker.legRight.rotation.x = 0;
      walker.body.position.y = 0.42;
      walker.head.position.y = 0.86 + Math.sin(elapsed * 3.2) * 0.04;
      walker.backpack.position.y = 0.42 + Math.sin(elapsed * 3.2) * 0.02;
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
      const angle = progress * Math.PI * 1.3;
      const radius = lerp(14, 22, easeOutCubic(progress));
      const height = lerp(11, 17, easeOutCubic(progress));
      this.cameraDesired.set(
        targetX + Math.cos(angle) * radius,
        targetY + height,
        targetZ + Math.sin(angle) * radius
      );
      this.cameraLookAt.lerp(new this.THREE.Vector3(targetX, targetY + 0.8, targetZ), forceSnap ? 1 : 0.08);
      if (forceSnap) {
        this.camera.position.copy(this.cameraDesired);
      } else {
        this.camera.position.lerp(this.cameraDesired, 0.06);
      }
      this.camera.lookAt(this.cameraLookAt);
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
