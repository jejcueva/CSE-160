(function initWorldData(globalScope) {
  const math = (typeof module !== "undefined" && module.exports)
    ? require("./math.js")
    : globalScope;

  const {
    gridToWorldCoordinate,
  } = math;

  const WORLD_SIZE = 32;
  const WORLD_HALF = WORLD_SIZE / 2;
  const MAX_WALL_HEIGHT = 4;

  const HEIGHT_ROW_STRINGS = Object.freeze([
    "44444444" + "44444444" + "44444444" + "44444444",
    "42222222" + "00000000" + "00000000" + "22222224",
    "42000002" + "20000000" + "00000000" + "02000024",
    "42000002" + "20001110" + "00000000" + "02000024",
    "42000002" + "20001110" + "00001110" + "02000024",
    "42000000" + "00000000" + "00001110" + "00000024",
    "42222000" + "00000000" + "00000000" + "00112224",
    "40002000" + "00111110" + "00000000" + "00100004",
    "40002000" + "00100010" + "00000000" + "00100004",
    "40002000" + "00100010" + "00111110" + "00100004",
    "40000000" + "00100000" + "00100010" + "00100004",
    "40111100" + "00100000" + "00100010" + "00000004",
    "40100100" + "00111100" + "00100010" + "01111004",
    "40100100" + "00000100" + "00100000" + "01001004",
    "40100111" + "11000100" + "00111100" + "01001004",
    "40000000" + "01000100" + "00000100" + "01000004",
    "40000000" + "01000111" + "11000100" + "01110004",
    "40011110" + "01000000" + "01000100" + "00010004",
    "40010010" + "01000000" + "01000111" + "11010004",
    "40010010" + "01111100" + "01000000" + "01010004",
    "40010000" + "00000100" + "01000000" + "01010004",
    "40011111" + "11100100" + "01111110" + "01010004",
    "40000000" + "00100100" + "00000010" + "01010004",
    "40111110" + "00100111" + "11100010" + "01010004",
    "40100010" + "00100000" + "00100010" + "01010004",
    "40100010" + "00111110" + "00101110" + "01010004",
    "40100010" + "00000010" + "00100000" + "01000004",
    "40101111" + "11111010" + "00100000" + "01111104",
    "40100000" + "00001000" + "00100000" + "00000104",
    "40111111" + "11101111" + "11101111" + "11110104",
    "40000000" + "00000000" + "00000000" + "00000004",
    "44444444" + "44444444" + "44444444" + "44444444",
  ]);

  const WORLD_HEIGHTS = Object.freeze(
    HEIGHT_ROW_STRINGS.map((row) => Object.freeze([...row].map(Number))),
  );

  const TEXTURE_IDS = Object.freeze({
    grass: 0,
    stone: 1,
    wood: 2,
    sky: 3,
  });

  function toWorldPoint(x, z, extra = {}) {
    return Object.freeze({
      x,
      z,
      worldX: gridToWorldCoordinate(x, WORLD_HALF),
      worldZ: gridToWorldCoordinate(z, WORLD_HALF),
      ...extra,
    });
  }

  const SPAWN_POINT = Object.freeze({
    eye: [
      gridToWorldCoordinate(4, WORLD_HALF),
      1.65,
      gridToWorldCoordinate(5, WORLD_HALF),
    ],
    yaw: 25,
    pitch: -4,
  });

  const SHRINE_RETURN_ZONE = toWorldPoint(4, 4, {
    radius: 1.15,
  });

  const QUEST_MARKERS = Object.freeze([
    toWorldPoint(27, 4, { id: "flame-east", color: [1, 0.72, 0.28, 1] }),
    toWorldPoint(22, 17, { id: "flame-middle", color: [0.3, 0.88, 1, 1] }),
    toWorldPoint(8, 28, { id: "flame-south", color: [0.94, 0.52, 1, 1] }),
  ]);

  const FOX_HOME = toWorldPoint(6, 6, {
    yaw: 35,
  });

  const PROTECTED_CELLS = Object.freeze([
    { x: 4, z: 4 },
    { x: 4, z: 5 },
    { x: 5, z: 5 },
    { x: 6, z: 6 },
    ...QUEST_MARKERS.map((marker) => ({ x: marker.x, z: marker.z })),
  ]);

  function getWallTextureIndex(x, z) {
    if (x < 10 && z < 10) {
      return TEXTURE_IDS.wood;
    }

    if (x > 20 && z < 10) {
      return TEXTURE_IDS.wood;
    }

    return TEXTURE_IDS.stone;
  }

  function isProtectedCell(x, z) {
    return PROTECTED_CELLS.some((cell) => cell.x === x && cell.z === z);
  }

  const api = Object.freeze({
    FOX_HOME,
    MAX_WALL_HEIGHT,
    PROTECTED_CELLS,
    QUEST_MARKERS,
    SHRINE_RETURN_ZONE,
    SPAWN_POINT,
    TEXTURE_IDS,
    WORLD_HALF,
    WORLD_HEIGHTS,
    WORLD_SIZE,
    getWallTextureIndex,
    isProtectedCell,
  });

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  Object.assign(globalScope, api);
}(typeof globalThis !== "undefined" ? globalThis : this));
