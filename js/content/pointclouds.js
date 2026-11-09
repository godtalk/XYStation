const TANK = "OBJ/%E7%82%AE%E8%BD%A62.obj?v=2";
const SHUTTLE = [
  ["OBJ/坦克3.obj?v=1", true],
  ["OBJ/方形机械1.obj?v=1", false],
  ["OBJ/方形机械2.obj?v=1", true],
  ["OBJ/方形机械3.obj?v=1", false],
];

export const POINT_CLOUDS = [
  {
    from: 4.5,
    to: 8,
    url: TANK,
    fit: 0.7,
    yaw: 0.7,
    shift: [0, 0.04],
    arc: true,
  },
  ...SHUTTLE.map(([url, mirror], index) => ({
    from: 8 + index * 0.8,
    to: 8 + index * 0.8 + 1.6,
    url,
    fit: 0.7,
    yaw: 0.7,
    arc: true,
    mirror,
  })),
];
