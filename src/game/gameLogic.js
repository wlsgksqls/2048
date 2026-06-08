// 순수 함수로 작성한 2048 게임 로직.
// 보드는 size x size 크기의 2차원 배열이며, 0은 빈 칸을 의미한다.

/** 빈 보드(모든 칸 0)를 만든다. */
export function emptyBoard(size) {
  return Array.from({ length: size }, () => Array(size).fill(0))
}

/** 보드의 빈 칸 좌표 목록을 반환한다. */
function emptyCells(board) {
  const cells = []
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      if (board[r][c] === 0) cells.push([r, c])
    }
  }
  return cells
}

/**
 * 빈 칸 하나에 새 타일(2는 90%, 4는 10%)을 추가한 새 보드를 반환한다.
 * 빈 칸이 없으면 원본을 그대로 반환한다.
 */
export function spawnTile(board) {
  const cells = emptyCells(board)
  if (cells.length === 0) return board
  const [r, c] = cells[Math.floor(Math.random() * cells.length)]
  const value = Math.random() < 0.9 ? 2 : 4
  const next = board.map((row) => row.slice())
  next[r][c] = value
  return next
}

/** 타일 2개가 스폰된 새 게임 보드를 만든다. */
export function createBoard(size) {
  return spawnTile(spawnTile(emptyBoard(size)))
}

/**
 * 한 줄을 왼쪽으로 슬라이드 + 머지한다.
 * @returns { row: number[], gained: number } 새 줄과 머지로 얻은 점수
 */
function slideRowLeft(row) {
  const tiles = row.filter((v) => v !== 0)
  const result = []
  let gained = 0
  for (let i = 0; i < tiles.length; i++) {
    if (i + 1 < tiles.length && tiles[i] === tiles[i + 1]) {
      const merged = tiles[i] * 2
      result.push(merged)
      gained += merged
      i++ // 다음 타일은 이미 머지됨
    } else {
      result.push(tiles[i])
    }
  }
  while (result.length < row.length) result.push(0)
  return { row: result, gained }
}

/** 보드를 시계 방향으로 90도 회전한다. */
function rotateCW(board) {
  const size = board.length
  const next = emptyBoard(size)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      next[c][size - 1 - r] = board[r][c]
    }
  }
  return next
}

/** 보드를 반시계 방향으로 90도 회전한다. */
function rotateCCW(board) {
  const size = board.length
  const next = emptyBoard(size)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      next[size - 1 - c][r] = board[r][c]
    }
  }
  return next
}

function boardsEqual(a, b) {
  for (let r = 0; r < a.length; r++) {
    for (let c = 0; c < a[r].length; c++) {
      if (a[r][c] !== b[r][c]) return false
    }
  }
  return true
}

/**
 * 보드를 주어진 방향으로 이동/머지한다.
 * left 기준 로직을 만들고 나머지 방향은 회전을 이용해 재사용한다.
 * @param {string} direction 'left' | 'right' | 'up' | 'down'
 * @returns {{ board: number[][], gained: number, moved: boolean }}
 */
export function move(board, direction) {
  // 모든 방향을 left 슬라이드로 환원하기 위한 회전 횟수.
  let working = board
  if (direction === 'up') working = rotateCCW(board)
  else if (direction === 'down') working = rotateCW(board)
  else if (direction === 'right') working = working.map((row) => row.slice().reverse())

  let gained = 0
  const slid = working.map((row) => {
    const { row: newRow, gained: g } = slideRowLeft(row)
    gained += g
    return newRow
  })

  // 원래 방향으로 되돌린다.
  let result = slid
  if (direction === 'up') result = rotateCW(slid)
  else if (direction === 'down') result = rotateCCW(slid)
  else if (direction === 'right') result = slid.map((row) => row.slice().reverse())

  const moved = !boardsEqual(board, result)
  return { board: result, gained, moved }
}

/** 더 이상 이동할 수 있는 수가 있는지 판정한다. */
export function canMove(board) {
  if (emptyCells(board).length > 0) return true
  const size = board.length
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const v = board[r][c]
      if (c + 1 < size && board[r][c + 1] === v) return true
      if (r + 1 < size && board[r + 1][c] === v) return true
    }
  }
  return false
}

/** 목표값(target) 이상인 타일이 있으면 승리. */
export function hasWon(board, target) {
  return board.some((row) => row.some((v) => v >= target))
}
