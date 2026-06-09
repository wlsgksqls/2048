// 타일 기반 2048 게임 로직 (순수 함수).
// 각 타일은 고유 id를 가져 슬라이드/머지 애니메이션을 렌더링할 수 있다.
// tile: { id, value, row, col, isNew, justMerged }

let tileId = 0
function nextId() {
  return ++tileId
}

function makeGrid(size) {
  return Array.from({ length: size }, () => Array(size).fill(null))
}

function emptyCells(tiles, size) {
  const occupied = new Set(tiles.map((t) => t.row * size + t.col))
  const cells = []
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!occupied.has(r * size + c)) cells.push({ row: r, col: c })
    }
  }
  return cells
}

/** 빈 칸 하나에 새 타일(2는 90%, 4는 10%)을 추가한 새 타일 목록을 반환한다. */
export function spawnRandomTile(tiles, size) {
  const cells = emptyCells(tiles, size)
  if (cells.length === 0) return tiles
  const { row, col } = cells[Math.floor(Math.random() * cells.length)]
  const value = Math.random() < 0.9 ? 2 : 4
  return [...tiles, { id: nextId(), value, row, col, isNew: true, justMerged: false }]
}

/** 타일 2개가 스폰된 새 게임 타일 목록을 만든다. */
export function createTiles(size) {
  return spawnRandomTile(spawnRandomTile([], size), size)
}

function getVector(direction) {
  switch (direction) {
    case 'up':
      return { row: -1, col: 0 }
    case 'down':
      return { row: 1, col: 0 }
    case 'left':
      return { row: 0, col: -1 }
    case 'right':
      return { row: 0, col: 1 }
    default:
      return { row: 0, col: 0 }
  }
}

// 이동 방향의 가장자리에 가까운 타일부터 처리하도록 순회 순서를 만든다.
function buildTraversals(vector, size) {
  const rows = []
  const cols = []
  for (let i = 0; i < size; i++) {
    rows.push(i)
    cols.push(i)
  }
  if (vector.row === 1) rows.reverse()
  if (vector.col === 1) cols.reverse()
  return { rows, cols }
}

function inBounds(pos, size) {
  return pos.row >= 0 && pos.row < size && pos.col >= 0 && pos.col < size
}

// 타일이 멈출 수 있는 가장 먼 위치와 그 다음 칸(머지 후보)을 찾는다.
function findFarthest(grid, start, vector, size) {
  let previous
  let cell = start
  do {
    previous = cell
    cell = { row: previous.row + vector.row, col: previous.col + vector.col }
  } while (inBounds(cell, size) && grid[cell.row][cell.col] === null)
  return { farthest: previous, next: inBounds(cell, size) ? cell : null }
}

/**
 * 타일들을 주어진 방향으로 이동/머지한다.
 * @returns {{ tiles, removed, gained, moved }}
 *   tiles: 이동 후 살아있는 타일(머지된 타일은 값이 2배, justMerged=true)
 *   removed: 머지로 흡수되어 사라진 타일(목적지 좌표로 갱신됨 — 슬라이드 애니메이션용)
 */
export function moveTiles(tiles, size, direction, wild = false) {
  const vector = getVector(direction)
  const { rows, cols } = buildTraversals(vector, size)

  // 새 좌표/플래그를 적용할 복사본을 만든다 (원본 불변 유지).
  const working = tiles.map((t) => ({ ...t, isNew: false, justMerged: false }))
  const grid = makeGrid(size)
  working.forEach((t) => {
    grid[t.row][t.col] = t
  })

  let moved = false
  let gained = 0
  const removed = []

  rows.forEach((row) => {
    cols.forEach((col) => {
      const tile = grid[row][col]
      if (!tile) return
      const { farthest, next } = findFarthest(grid, { row, col }, vector, size)
      const target = next ? grid[next.row][next.col] : null

      // wild(이스터에그) 모드: 값과 무관하게 인접 타일을 합치고, 더 큰 값을 기준으로 한다.
      if (target && !target.justMerged && (wild || target.value === tile.value)) {
        target.value = wild ? Math.max(target.value, tile.value) : target.value * 2
        target.justMerged = true
        gained += target.value
        grid[row][col] = null
        tile.row = target.row
        tile.col = target.col
        removed.push(tile)
        moved = true
      } else if (farthest.row !== row || farthest.col !== col) {
        grid[row][col] = null
        grid[farthest.row][farthest.col] = tile
        tile.row = farthest.row
        tile.col = farthest.col
        moved = true
      }
    })
  })

  const removedSet = new Set(removed)
  const nextTiles = working.filter((t) => !removedSet.has(t))
  return { tiles: nextTiles, removed, gained, moved }
}

/** 더 이상 이동할 수 있는 수가 있는지 판정한다. */
export function canMoveTiles(tiles, size) {
  if (tiles.length < size * size) return true
  const grid = makeGrid(size)
  tiles.forEach((t) => {
    grid[t.row][t.col] = t
  })
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const v = grid[r][c]?.value
      if (c + 1 < size && grid[r][c + 1]?.value === v) return true
      if (r + 1 < size && grid[r + 1][c]?.value === v) return true
    }
  }
  return false
}

/** 목표값(target) 이상인 타일이 있으면 승리. */
export function hasWonTiles(tiles, target) {
  return tiles.some((t) => t.value >= target)
}

/**
 * 이스터에그 조건: 한 줄(가로/세로/대각선)이 모두 같은 값(0 제외)으로
 * 일렬로 채워져 있으면 true.
 */
export function hasEasterEggLine(tiles, size) {
  const grid = Array.from({ length: size }, () => Array(size).fill(0))
  tiles.forEach((t) => {
    grid[t.row][t.col] = t.value
  })
  const allEqualNonZero = (vals) => vals[0] !== 0 && vals.every((v) => v === vals[0])

  // 가로
  for (let r = 0; r < size; r++) {
    if (allEqualNonZero(grid[r])) return true
  }
  // 세로
  for (let c = 0; c < size; c++) {
    const col = []
    for (let r = 0; r < size; r++) col.push(grid[r][c])
    if (allEqualNonZero(col)) return true
  }
  // 대각선 (↘, ↙)
  const main = []
  const anti = []
  for (let i = 0; i < size; i++) {
    main.push(grid[i][i])
    anti.push(grid[i][size - 1 - i])
  }
  if (allEqualNonZero(main)) return true
  if (allEqualNonZero(anti)) return true

  return false
}
