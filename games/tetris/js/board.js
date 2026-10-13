const COLS = 10;
const ROWS = 20;

function createGrid() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function isInsideGrid(row, col) {
  return row >= 0 && row < ROWS && col >= 0 && col < COLS;
}

function hasCollision(grid, piece, offsetRow = 0, offsetCol = 0, matrix = piece.matrix) {
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (!matrix[r][c]) continue;
      const newRow = piece.row + r + offsetRow;
      const newCol = piece.col + c + offsetCol;
      if (newCol < 0 || newCol >= COLS || newRow >= ROWS) return true;
      if (newRow >= 0 && grid[newRow][newCol]) return true;
    }
  }
  return false;
}

function mergePiece(grid, piece) {
  piece.matrix.forEach((row, r) => {
    row.forEach((value, c) => {
      if (!value) return;
      const boardRow = piece.row + r;
      const boardCol = piece.col + c;
      if (isInsideGrid(boardRow, boardCol)) {
        grid[boardRow][boardCol] = piece.color;
      }
    });
  });
}

function clearLines(grid) {
  let linesCleared = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (grid[r].every((cell) => cell !== null)) {
      grid.splice(r, 1);
      grid.unshift(Array(COLS).fill(null));
      linesCleared++;
      r++;
    }
  }
  return linesCleared;
}
