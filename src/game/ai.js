// 2048 AI: expectimax 기반으로 한 수를 고르는 순수 로직.
// 게임 상태(타일 목록)는 gameLogic의 moveTiles로 시뮬레이션한다(스폰 없이).

import { moveTiles } from './gameLogic.js'

const DIRECTIONS = ['up', 'down', 'left', 'right']

function toGrid(tiles, size) {
  const grid = Array.from({ length: size }, () => Array(size).fill(0))
  tiles.forEach((t) => {
    grid[t.row][t.col] = t.value
  })
  return grid
}

function emptyCellsOf(tiles, size) {
  const occupied = new Set(tiles.map((t) => t.row * size + t.col))
  const cells = []
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!occupied.has(r * size + c)) cells.push({ row: r, col: c })
    }
  }
  return cells
}

// --- 휴리스틱 평가 -----------------------------------------------------------
// 빈 칸이 많을수록, 큰 타일이 한쪽으로 단조롭게 정렬될수록, 인접 차이가 작을수록,
// 그리고 최댓값이 코너에 있을수록 좋은 국면으로 본다.
const WEIGHTS = {
  empty: 2.7,
  mono: 1.0,
  smooth: 0.1,
  maxCorner: 1.0,
}

function log2(v) {
  return v > 0 ? Math.log2(v) : 0
}

function monotonicity(grid, size) {
  // 행/열이 한 방향으로 단조 증가/감소하는 정도(둘 중 좋은 쪽).
  let totals = [0, 0, 0, 0] // left/right, up/down
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size - 1; c++) {
      const cur = log2(grid[r][c])
      const next = log2(grid[r][c + 1])
      if (cur > next) totals[0] += next - cur
      else totals[1] += cur - next
    }
  }
  for (let c = 0; c < size; c++) {
    for (let r = 0; r < size - 1; r++) {
      const cur = log2(grid[r][c])
      const next = log2(grid[r + 1][c])
      if (cur > next) totals[2] += next - cur
      else totals[3] += cur - next
    }
  }
  return Math.max(totals[0], totals[1]) + Math.max(totals[2], totals[3])
}

function smoothness(grid, size) {
  // 인접한 타일 값(log2) 차이의 합(작을수록 좋음 → 음수로 가중).
  let s = 0
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === 0) continue
      const v = log2(grid[r][c])
      if (c + 1 < size && grid[r][c + 1] !== 0) s -= Math.abs(v - log2(grid[r][c + 1]))
      if (r + 1 < size && grid[r + 1][c] !== 0) s -= Math.abs(v - log2(grid[r + 1][c]))
    }
  }
  return s
}

function maxCornerBonus(grid, size) {
  // 최댓값이 네 코너 중 하나에 있으면 보너스.
  let max = 0
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) max = Math.max(max, grid[r][c])
  const corners = [
    grid[0][0],
    grid[0][size - 1],
    grid[size - 1][0],
    grid[size - 1][size - 1],
  ]
  return corners.includes(max) ? log2(max) : 0
}

function evaluate(tiles, size) {
  const grid = toGrid(tiles, size)
  const empty = emptyCellsOf(tiles, size).length
  return (
    WEIGHTS.empty * empty +
    WEIGHTS.mono * monotonicity(grid, size) +
    WEIGHTS.smooth * smoothness(grid, size) +
    WEIGHTS.maxCorner * maxCornerBonus(grid, size)
  )
}

// --- expectimax -------------------------------------------------------------
function expectimax(tiles, size, depth) {
  if (depth <= 0) return evaluate(tiles, size)

  // 플레이어 노드: 가능한 4방향 중 최댓값.
  let best = -Infinity
  let movable = false
  for (const dir of DIRECTIONS) {
    const res = moveTiles(tiles, size, dir)
    if (!res.moved) continue
    movable = true
    best = Math.max(best, chance(res.tiles, size, depth))
  }
  if (!movable) return evaluate(tiles, size) // 막힘(게임오버 국면)
  return best
}

function chance(tiles, size, depth) {
  // 찬스 노드: 빈 칸마다 2 타일을 넣어 평균(속도 위해 4(10%)는 생략하는 표준 단순화).
  const cells = emptyCellsOf(tiles, size)
  if (cells.length === 0) return evaluate(tiles, size)

  let sum = 0
  for (const { row, col } of cells) {
    const next = [...tiles, { id: -1, value: 2, row, col, isNew: false, justMerged: false }]
    sum += expectimax(next, size, depth - 1)
  }
  return sum / cells.length
}

// 빈 칸이 많으면 분기가 폭발하므로 탐색 깊이를 적응적으로 조절한다.
function searchDepth(emptyCount) {
  if (emptyCount >= 8) return 2
  if (emptyCount >= 4) return 3
  return 4
}

/**
 * 현재 국면에서 둘 최선의 방향을 고른다.
 * @returns {'up'|'down'|'left'|'right'|null} 둘 수 없으면 null
 */
export function chooseBestMove(tiles, size) {
  const depth = searchDepth(emptyCellsOf(tiles, size).length)
  let bestDir = null
  let bestScore = -Infinity
  for (const dir of DIRECTIONS) {
    const res = moveTiles(tiles, size, dir)
    if (!res.moved) continue
    const score = chance(res.tiles, size, depth)
    if (score > bestScore) {
      bestScore = score
      bestDir = dir
    }
  }
  return bestDir
}
