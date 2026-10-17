const SHAPES = {
  I: {
    color: "#00f0ff",
    matrix: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
  },
  O: {
    color: "#ffe600",
    matrix: [
      [1, 1],
      [1, 1],
    ],
  },
  T: {
    color: "#c400ff",
    matrix: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
  },
  S: {
    color: "#00ff66",
    matrix: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
  },
  Z: {
    color: "#ff2b4d",
    matrix: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
  },
  J: {
    color: "#2b6bff",
    matrix: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
  },
  L: {
    color: "#ff9500",
    matrix: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
  },
};

const PIECE_TYPES = Object.keys(SHAPES);

function createPiece(type) {
  const shape = SHAPES[type];
  return {
    type,
    color: shape.color,
    matrix: shape.matrix.map((row) => row.slice()),
    row: 0,
    col: 0,
  };
}

function randomPiece() {
  const random = typeof window.JarvisTetrisRandom === "function" ? window.JarvisTetrisRandom : Math.random;
  const type = PIECE_TYPES[Math.floor(random() * PIECE_TYPES.length)];
  return createPiece(type);
}

function rotateMatrix(matrix) {
  const n = matrix.length;
  const result = [];
  for (let i = 0; i < n; i++) {
    result.push([]);
    for (let j = 0; j < n; j++) {
      result[i][j] = matrix[n - 1 - j][i];
    }
  }
  return result;
}

