// src/lib/game.ts
import { 
  Stone, 
  Intersection, 
  GameState, 
  Territory, 
  Hashable,
  Pointer
} from './types';

import * as FileSaver from 'file-saver';

/**
 * HashSet 클래스 구현
 * 같은 위치의 교차점을 중복 없이 저장하기 위해 사용
 */
export class HashSet<T extends Hashable> {
  private hashSet: {[key: string]: T} = {};

  constructor(...items: T[]) {
    for(const item of items) {
      this.insert(item);
    }
  }

  public includes(item: T | null): boolean {
    return item ? this.hashSet[item.hashKey()] === item : false;
  }

  public insert(item: T | null) {
    if(item) {
      this.hashSet[item.hashKey()] = item;
    }
  }

  public values(): T[] {
    return Object.keys(this.hashSet).map(key => this.hashSet[key]);
  }
}

/**
 * 바둑판의 교차점 구현
 */
export class IntersectionImpl implements Intersection, Hashable {
  xPos: number;
  yPos: number;
  stone: Stone;
  
  constructor(x: number, y: number, s: Stone = Stone.None) {
    this.xPos = x;
    this.yPos = y;
    this.stone = s;
  }
  
  public hashKey(): string {
    return `(${this.xPos},${this.yPos})`;
  }

  public copy(): Intersection {
    return new IntersectionImpl(this.xPos, this.yPos, this.stone);
  }
}

/**
 * 영역 클래스 구현
 */
export class TerritoryImpl implements Territory {
  region: Intersection[];
  owner: Stone;
  score: number = 0;

  constructor(owner: Stone, region?: Intersection[]) {
    this.owner = owner;
    this.region = region || [];

    if (region) {
      this.score = region.reduce((total, int) => 
        total + (int.stone === Stone.None ? 1 : 2), 0
      );
    }
  }

  public merge(territory: Territory): Territory {
    let merged = new TerritoryImpl(Stone.None);

    if(this.owner === Stone.None) {
      merged.owner = territory.owner;
    }
    else if(territory.owner === Stone.None) {
      merged.owner = this.owner;
    }
    else if(this.owner !== territory.owner) {
      merged.owner = Stone.Unknown;
    }
    else {
      merged.owner = this.owner;
    }

    merged.region = [...this.region, ...territory.region];
    merged.score = this.score + territory.score;

    return merged;
  }
}

/**
 * 게임 상태 클래스 구현
 */
export class GameStateImpl implements GameState {
  intersections: Intersection[][];
  turn: Stone;
  moveNum: number = 0;
  prevGameState: GameState | null;
  nextGameState: GameState | null = null;
  blackScore: number = 0;
  whiteScore: number = 0;
  isPass: boolean = false;
  move: Intersection | null = null;
  public comment: string = '';

  constructor(
    ints: Intersection[][], 
    t: Stone, 
    bScore: number = 0, 
    wScore: number = 0, 
    prev: GameState | null = null,
    public markers: { x: number; y: number; type: string; label?: string; moveNum?: number }[] = [],
    comment: string = ''
  ) {
    this.turn = t;
    this.prevGameState = prev;
    this.intersections = ints;
    this.blackScore = bScore;
    this.whiteScore = wScore;
    this.comment = comment;

    if(prev === null) {
      this.moveNum = 0;
    }
    else {
      this.moveNum = prev.moveNum + 1;
      prev.nextGameState = this;
    }
  }

  public toString(): string {
    const transpose = (array: any[][]) => 
      array[0].map((col, i) => array.map(row => row[i]));

    const transposed = transpose(this.intersections);
    
    return transposed.map(col => {
      return col.map(i => {
        if(i.stone === Stone.Black) {
          return 'b';
        }
        else if(i.stone === Stone.White) {
          return 'w';
        }
        else {
          return '-'
        }
      }).join(' ');
    }).join('\n');
  }

  public getState(moveNum: number): GameState | null {
    let state: GameState = this;

    while(state.moveNum > moveNum) {
      if (!state.prevGameState) return null;
      state = state.prevGameState;
    }

    return state;
  }
}

/**
 * 게임 클래스 구현
 * 핵심 바둑 게임 로직을 포함
 */
export class Game {
  public intersections: Intersection[][];
  public markers: { x: number; y: number; type: string; label?: string; moveNum?: number }[] = [];
  private gameState: GameState | null = null;
  private lastMove: Intersection | null = null;
  private xLines: number = 19;
  private yLines: number = 19;
  private turn: Stone = Stone.Black;
  private blackScore: number = 0;
  private whiteScore: number = 0;
  private claimedTerritories: Territory[] = [];
  private claimedTerritoryLookup: HashSet<Intersection> = new HashSet();
  private stateChangeCallback: (() => void) | null = null;

  constructor(
    xLines: number = 19, 
    yLines: number = 19,
    onStateChange: (() => void) | null = null
  ) {
    this.xLines = xLines;
    this.yLines = yLines;
    this.stateChangeCallback = onStateChange;
    
    this.intersections = Game.initIntersections(xLines, yLines);
    this.gameState = this.newGameState();
  }

  /**
   * 바둑판 초기화
   */
  static initIntersections(xLines: number = 19, yLines: number = 19): Intersection[][] {
    let ints = new Array(xLines);
    for(let x = 0; x < xLines; x++) {
      ints[x] = new Array(yLines);

      for(let y = 0; y < yLines; y++) {
        ints[x][y] = new IntersectionImpl(x, y);
      }
    }

    return ints;
  }

  /**
   * SGF 파일 로드
   */
  public static loadSGF(sgfContent: string): Game | null {
    const game = new Game();
    const charToPos = (char: string) => char.charCodeAt(0) - 97;
 
    // Parse board size
    const sizeMatch = sgfContent.match(/SZ\[(\d+)\]/);
    if (sizeMatch) {
      const size = parseInt(sizeMatch[1]);
      game.xLines = size;
      game.yLines = size;
      game.intersections = Game.initIntersections(size, size);
      game.gameState = game.newGameState();
    }
 
    // Parse nodes one by one
    const nodes = sgfContent.split(';').map(s => s.trim()).filter(s => s);
    const movePattern = /^(B|W)\[([a-z]{0,2})\]/;
    const markerPattern = /(TR|SQ|CR|MA|LB)((\[[^\]]+\])+)/g;
 
    for (const node of nodes) {
      const moveMatch = node.match(movePattern);
      const markers: { x: number; y: number; type: string; label?: string; moveNum?: number }[] = [];
    
      // 마커 먼저 파싱
      let markerMatch;
      while ((markerMatch = markerPattern.exec(node)) !== null) {
        const type = markerMatch[1];
        const coords = [...markerMatch[2].matchAll(/\[([a-z]{2})(?::([^\]]+))?\]/g)];
        for (const [, pos, label] of coords) {
          const x = charToPos(pos[0]);
          const y = charToPos(pos[1]);
          markers.push({ x, y, type: type === "MA" ? "circle" : type.toLowerCase(), label });
        }
      }
      
      // Extract and log comment
      const commentMatch = node.match(/C\[([\s\S]*?)\](?=\s|$)/);
      const comment = commentMatch ? commentMatch[1].replace(/\\]/g, "]") : '';
      console.log(`Parsed comment for node:`, comment);
    
      // 수가 없으면 건너뜀
      if (!moveMatch) continue;
    
      const color = moveMatch[1] === 'B' ? Stone.Black : Stone.White;
      const coord = moveMatch[2];
    
      game.setTurn(color);
    
      if (coord === '') {
        game.pass();
      } else {
        const x = charToPos(coord[0]);
        const y = charToPos(coord[1]);
        game.intersections[x][y].stone = color;
        game.lastMove = game.intersections[x][y];
      }
 
      const newState = new GameStateImpl(
        game.copyIntersections(),
        game.turn,
        game.blackScore,
        game.whiteScore,
        game.gameState,
        markers,
        comment
      );
 
      if (coord !== '') {
        newState.move = game.intersections[charToPos(coord[0])][charToPos(coord[1])].copy();
      }
 
      game.gameState = newState;
      game.markers = newState.markers;
    }
 
    if (game.stateChangeCallback) {
      game.stateChangeCallback();
    }
 
    return game;
  }

  /**
   * SGF 파일로 저장
   */
  public saveSGF(): void {
    const sgfBlob = new Blob([this.getSGF()], { type: "text/plain;charset=utf-8" });
    const date = new Date();
    const yy = String(date.getFullYear()).slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const dateString = `${yy}${mm}${dd}-${hh}${min}`;
    const fileName = `Goggle-${dateString}.sgf`;

    FileSaver.saveAs(sgfBlob, fileName);
  }

  /**
   * SGF 형식으로 변환
   */
  public getSGF(): string {
    let sgfNodes = [
      ";GM[1]FF[4]CA[UTF-8]AP[Goggle]SZ[19]"
    ];

    if (!this.gameState) return `(${sgfNodes.join('')})`;
    
    for (let state = this.gameState.getState(1); state != null; state = state.nextGameState) {
      const turn = state.turn !== Stone.Black ? "B" : "W";
      const move = state.move;
 
      let node = "";
 
      if (move) {
        const xChar = String.fromCharCode(97 + move.xPos);
        const yChar = String.fromCharCode(97 + move.yPos);
        node += `;${turn}[${xChar}${yChar}]`;
 
        const coord = (x: number, y: number) =>
          `[${String.fromCharCode(97 + x)}${String.fromCharCode(97 + y)}]`;
 
        const grouped = {
          TR: [] as string[], // triangle
          SQ: [] as string[], // square
          CR: [] as string[], // cross
          MA: [] as string[], // circle
          LB: [] as string[], // label
        };
 
        for (const marker of this.markers) {
          const c = coord(marker.x, marker.y);
          const isMatchingMoveNum = marker.moveNum === state.moveNum;
          const isMatchingCoords = move && marker.x === move.xPos && marker.y === move.yPos;

          if (isMatchingMoveNum || (!marker.moveNum && isMatchingCoords)) {
            if (marker.type === 'triangle') grouped.TR.push(c);
            else if (marker.type === 'square') grouped.SQ.push(c);
            else if (marker.type === 'cross') grouped.CR.push(c);
            else if (marker.type === 'circle') grouped.CR.push(c);
              else if (marker.type === 'letter' || marker.type === 'number') {
                grouped.LB.push(`${String.fromCharCode(97 + marker.x)}${String.fromCharCode(97 + marker.y)}:${marker.label}`);
              }
          }
        }
 
        for (const [tag, entries] of Object.entries(grouped)) {
          if (entries.length > 0) {
            if (tag === 'LB') {
              node += `LB${entries.map(e => `[${e}]`).join('')}`;
            } else {
              node += `${tag}${entries.join('')}`;
            }
          }
        }
      } else {
        node += `;${turn}[]`;
      }
 
      sgfNodes.push(node);
    }
    return `(${sgfNodes.join('')})`;
  }

  /**
   * 바둑판 상태 복사
   */
  public copyIntersections(): Intersection[][] {
    const { xLines, yLines, intersections } = this;

    let ints = new Array(xLines);
    for(let x = 0; x < xLines; x++) {
      ints[x] = new Array(yLines);

      for(let y = 0; y < yLines; y++) {
        ints[x][y] = new IntersectionImpl(x, y);
        ints[x][y].stone = intersections[x][y].stone;
      }
    }

    return ints;
  }

  /**
   * 돌 놓기
   */
  public makeMove(xPos: number, yPos: number): boolean {
    // 이미 돌이 있는 위치인지 확인
    if (this.intersections[xPos][yPos].stone !== Stone.None) {
      return false;
    }
    
    // 임시로 돌 놓기
    this.intersections[xPos][yPos].stone = this.turn;

    // 상대방 돌 잡기
    const capturedNeighbors = this.getCapturedNeighbors(xPos, yPos);
    let legalMove = capturedNeighbors.length > 0;
    
    // 잡힌 돌이 없다면, 방금 놓은 돌이 잡히는지 확인
    if (!legalMove) {
      const selfCaptured = this.getCapturedGroup(this.intersections[xPos][yPos]);
      legalMove = selfCaptured.length === 0;
    }
    
    // 유효한 수가 아니면 돌을 제거하고 종료
    if (!legalMove) {
      this.intersections[xPos][yPos].stone = Stone.None;
      return false;
    }
    
    // 상대방 돌 제거 및 점수 계산
    let numCaptured = 0;
    for (const group of capturedNeighbors) {
      for (const stone of group) {
        this.intersections[stone.xPos][stone.yPos].stone = Stone.None;
        numCaptured++;
      }
    }
    
    // 고 규칙 확인
    if (this.checkForKo()) {
      if (this.gameState) {
        this.loadGameState(this.gameState);
      }
      return false;
    }
    
    // 점수 업데이트
    if (numCaptured > 0) {
      if (this.turn === Stone.Black) {
        this.blackScore += numCaptured;
      } else {
        this.whiteScore += numCaptured;
      }
    }
    
    this.lastMove = this.intersections[xPos][yPos];
    this.nextTurn();
    return true;
  }

  /**
   * 패스
   */
  public pass(): void {
    if (this.gameState?.prevGameState?.isPass) {
      this.endGame();
    } else {
      if (this.gameState) {
        this.gameState.isPass = true;
      }
      this.nextTurn();
    }
  }

  /**
   * 무르기
   */
  public undo(): void {
    if (this.gameState?.prevGameState) {
      this.loadGameState(this.gameState.prevGameState);
      this.claimedTerritories = [];
      this.claimedTerritoryLookup = new HashSet();
      this.notifyStateChange();
    }
  }

  /**
   * 앞으로 가기
   */
  public redo(): void {
    if (this.gameState?.nextGameState) {
      this.loadGameState(this.gameState.nextGameState);
      this.notifyStateChange();
    }
  }

  /**
   * 게임 종료
   */
  private endGame(): void {
    this.setTurn(Stone.None);
    
    // 영역 계산
    const territories = this.getAllTerritories();
    this.notifyStateChange();
  }

  /**
   * 턴 변경
   */
  public setTurn(turn: Stone): void {
    this.turn = turn;
  }

  /**
   * 다음 턴으로 넘어가기
   */
  private nextTurn(): void {
    if (this.turn === Stone.Black) {
      this.setTurn(Stone.White);
    } else {
      this.setTurn(Stone.Black);
    }

    this.gameState = this.newGameState();
    if (this.lastMove) {
      this.gameState.move = this.lastMove.copy();
    }
    
    this.notifyStateChange();
  }

  /**
   * 새 게임 상태 생성
   */
  private newGameState(): GameState {
    return new GameStateImpl(
      this.copyIntersections(), 
      this.turn, 
      this.blackScore, 
      this.whiteScore, 
      this.gameState
    );
  }

  /**
   * 게임 상태 불러오기
   */
  private loadGameState(state: GameState): void {
    if (!state) return;
    
    const { xLines, yLines } = this;

    this.setTurn(state.turn);

    for (let x = 0; x < xLines; x++) {
      for (let y = 0; y < yLines; y++) {
        this.intersections[x][y].stone = state.intersections[x][y].stone;
      }
    }

    this.blackScore = state.blackScore;
    this.whiteScore = state.whiteScore;
    this.gameState = state;
    this.markers = state.markers ?? [];
    this.notifyStateChange();
  }

  /**
   * 고 규칙 체크 (같은 위치에 돌을 놓는 패턴 방지)
   */
  private checkForKo(): boolean {
    if (!this.gameState?.prevGameState) return false;
    
    const { xLines, yLines, intersections } = this;
    const prevState = this.gameState.prevGameState;

    for (let x = 0; x < xLines; x++) {
      for (let y = 0; y < yLines; y++) {
        if (intersections[x][y].stone !== prevState.intersections[x][y].stone) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * 주변에 잡히는 돌 그룹 찾기
   */
  private getCapturedNeighbors(xPos: number, yPos: number): Intersection[][] {
    const otherPlayer = this.getOtherPlayer();
    const intersection = this.intersections[xPos][yPos];
    const neighbors = this.getAdjacentNeighbors(intersection);
    let capturedGroups: Intersection[][] = [];

    // 중복 검사를 위한 해시셋
    let allCapturedStones: HashSet<Intersection> = new HashSet();
    
    const doesOverlap = (captured: Intersection[]) => {
      for (let int of captured) {
        if (allCapturedStones.includes(int)) {
          return true;
        } else {
          allCapturedStones.insert(int);
        }
      }
      return false;
    };

    for (let neighbor of neighbors) {
      if (neighbor && neighbor.stone === otherPlayer) {
        const captured = this.getCapturedGroup(neighbor);

        if (captured.length > 0 && !doesOverlap(captured)) {
          capturedGroups.push(captured);
        }
      }
    }

    return capturedGroups;
  }

  /**
   * 돌이 잡히는지 확인
   */
  private getCapturedGroup(intersection: Intersection, visited: HashSet<Intersection> = new HashSet()): Intersection[] {
    const neighbors = this.getAdjacentNeighbors(intersection).filter(int => !visited.includes(int));
    
    // visited 해시셋에 현재 돌과 방문하지 않은 이웃들 추가
    [intersection, ...neighbors].forEach(int => visited.insert(int));

    let captured = true;
    let group = [intersection];
    
    for (let neighbor of neighbors) {
      if (neighbor === null) {
        // 가장자리인 경우는 항상 잡힘
        captured = true;
      } else if (neighbor.stone === Stone.None) {
        // 빈 공간이 있으면 잡히지 않음
        captured = false;
      } else if (neighbor.stone === intersection.stone) {
        // 같은 색상의 돌이면 연결된 그룹 확인
        const subGroup = this.getCapturedGroup(neighbor, visited);
        captured = captured && subGroup.length > 0;

        if (captured) {
          group = [...group, ...subGroup];
        }
      }

      if (!captured) {
        return [];
      }
    }

    return group;
  }

  /**
   * 다른 플레이어 (색상) 가져오기
   */
  private getOtherPlayer(turn?: Stone): Stone {
    const currentTurn = turn !== undefined ? turn : this.turn;
    return currentTurn === Stone.Black ? Stone.White : Stone.Black;
  }

  /**
   * 인접한 교차점들 가져오기
   */
  private getAdjacentNeighbors(intersection: Intersection): (Intersection | null)[] {
    const { xPos, yPos } = intersection;
    
    // 중복 제거하여 이웃 교차점들 가져오기
    const adjacentPositions = [
      this.getValidIntersection(xPos, yPos - 1),
      this.getValidIntersection(xPos, yPos + 1),
      this.getValidIntersection(xPos - 1, yPos),
      this.getValidIntersection(xPos + 1, yPos)
    ];
    
    // Create HashSet only with non-null intersections
    const validNeighbors = adjacentPositions.filter((int): int is Intersection => int !== null);
    const neighbors = new HashSet<Intersection>(...validNeighbors);
    
    return adjacentPositions;
  }

  /**
   * 유효한 교차점 가져오기 (바둑판 범위 체크)
   */
  private getValidIntersection(xPos: number, yPos: number): Intersection | null {
    if (0 <= xPos && xPos < this.xLines && 0 <= yPos && yPos < this.yLines) {
      return this.intersections[xPos][yPos];
    }
    return null;
  }

  /**
   * 영역 점령
   */
  public claimTerritory(xPos: number, yPos: number): boolean {
    const intersection = this.intersections[xPos][yPos];

    if (intersection.stone === Stone.None || this.claimedTerritoryLookup.includes(intersection)) {
      return false;
    }

    const owner = this.getOtherPlayer(intersection.stone);
    const territory = this.getTerritory(intersection, owner);

    this.claimedTerritories.push(territory);

    for (let int of territory.region) {
      this.claimedTerritoryLookup.insert(int);
    }

    this.notifyStateChange();
    return true;
  }

  /**
   * 모든 영역 가져오기
   */
  public getAllTerritories(): Territory[] {
    const apparentTerritories = this.getAllApparentTerritories(this.claimedTerritoryLookup);
    return [...this.claimedTerritories, ...apparentTerritories];
  }

  /**
   * 명확한 영역 계산하기
   */
  private getAllApparentTerritories(exclude: HashSet<Intersection> = new HashSet()): Territory[] {
    const { xLines, yLines } = this;
    let visited = new HashSet<Intersection>();
    let territories: Territory[] = [];

    for (let x = 0; x < xLines; x++) {
      for (let y = 0; y < yLines; y++) {
        const int = this.intersections[x][y];

        if (int.stone === Stone.None && !visited.includes(int) && !exclude.includes(int)) {
          const territory = this.getApparentTerritory(int, visited, true);

          if (territory.owner !== Stone.Unknown) {
            territories.push(territory);
          }
        }
      }
    }

    return territories;
  }

  /**
   * 명확한 영역 가져오기
   */
  private getApparentTerritory(
    intersection: Intersection, 
    visited: HashSet<Intersection> = new HashSet(), 
    greedy: boolean = false, 
    mode: Pointer<Stone> = { value: Stone.None }
  ): Territory {
    if (intersection.stone !== Stone.None) {
      return new TerritoryImpl(Stone.None, []);
    }

    const neighbors = this.getAdjacentNeighbors(intersection).filter(int => 
      int !== null && !visited.includes(int)
    );

    // visited 해시셋에 현재 돌과 빈 교차점인 이웃들 추가
    [intersection, ...neighbors].forEach(int => {
      if (int !== null && int.stone === Stone.None) {
        visited.insert(int);
      }
    });

    let territory = new TerritoryImpl(Stone.None, [intersection]);
    
    for (let neighbor of neighbors) {
      if (neighbor === null) {
        // 가장자리
        continue;
      }

      if (mode.value === Stone.None) {
        // 모드가 아직 설정되지 않았으면 이웃의 색상으로 설정
        mode.value = neighbor.stone;
      }
      
      if (neighbor.stone === Stone.None) {
        // 빈 교차점이면 재귀적으로 탐색
        const subTerritory = this.getApparentTerritory(neighbor, visited, greedy, mode);

        if (subTerritory.owner !== Stone.Unknown) {
          territory = territory.merge(subTerritory);
        }
      } else if (neighbor.stone === mode.value) {
        // 현재 모드와 같은 색상
        continue;
      } else if (neighbor.stone !== mode.value) {
        // 다른 색상이 발견되면 영역이 아님
        mode.value = Stone.Unknown;
      }

      if (!greedy && mode.value === Stone.Unknown) {
        break;
      }
    }

    if (mode.value === Stone.Unknown) {
      return new TerritoryImpl(Stone.Unknown, []);
    }

    return new TerritoryImpl(mode.value, territory.region);
  }

  /**
   * 영역 가져오기
   */
  private getTerritory(
    intersection: Intersection, 
    mode: Stone, 
    visited: HashSet<Intersection> = new HashSet()
  ): Territory {
    if (intersection.stone === mode) {
      return new TerritoryImpl(Stone.None, []);
    }

    const neighbors = this.getAdjacentNeighbors(intersection).filter(int => 
      int !== null && !visited.includes(int)
    );

    // visited 해시셋에 현재 위치와 이웃들 추가
    [intersection, ...neighbors].forEach(int => visited.insert(int));

    let territory = new TerritoryImpl(mode, [intersection]);
    
    for (let neighbor of neighbors) {
      if (neighbor === null) {
        // 가장자리
        continue;
      }

      if (neighbor.stone !== mode) {
        // 모드와 다른 색이면 재귀적으로 탐색
        const subTerritory = this.getTerritory(neighbor, mode, visited);
        territory = territory.merge(subTerritory);
      }
    }

    return territory;
  }
  
  /**
   * 상태 변화 알림
   */
  private notifyStateChange(): void {
    if (this.stateChangeCallback) {
      this.stateChangeCallback();
    }
  }

  // 게터 메서드들
  public getXLines(): number { return this.xLines; }
  public getYLines(): number { return this.yLines; }
  public getTurn(): Stone { return this.turn; }
  public getBlackScore(): number { return this.blackScore; }
  public getWhiteScore(): number { return this.whiteScore; }
  public getLastMove(): Intersection | null { return this.lastMove; }
  public getGameState(): GameState | null { return this.gameState; }

  public getScoreWithTerritory(color: Stone): { score: number, territory: number } {
    const baseScore = color === Stone.Black ? this.blackScore : this.whiteScore;
    let territoryScore = 0;
    
    const territories = this.getAllTerritories();
    for (const territory of territories) {
      if (territory.owner === color) {
        territoryScore += territory.score;
      }
    }
    
    return { score: baseScore, territory: territoryScore };
  }

  public addMarker(x: number, y: number, type: string, label?: string): void {
    const moveNum = this.gameState?.moveNum ?? 0;
    const marker = { x, y, type, label, moveNum };

    this.markers.push(marker);
    if (this.gameState) {
      this.gameState.markers = [...(this.gameState.markers ?? []), marker];
    }

    this.notifyStateChange();
  }
  public setStateChangeCallback(cb: () => void): void {
    this.stateChangeCallback = cb;
  }
}