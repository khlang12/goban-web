// src/lib/d3Setup.ts
import * as d3 from 'd3';
import { GameBoardConfig } from './types';

export function setupD3Board({
  svgRef,
  width,
  height,
  xLines,
  yLines,
  showCoordinates = false
}: GameBoardConfig) {
  if (!svgRef.current) return null;

  const svg = d3.select(svgRef.current);
  svg.selectAll('*').remove();

  const stoneRadius = Math.min(width / xLines, height / yLines) / 2;
  const boardPadding = showCoordinates ? stoneRadius * 2 : stoneRadius;
  
  // 배경 패턴 설정
  svg.append('defs')
    .append('pattern')
    .attr('id', 'wood')
    .attr('patternUnits', 'userSpaceOnUse')
    .attr('width', width)
    .attr('height', height)
    .append('image')
    .attr('xlink:href', '/images/Cerberiopsis_candelabra_square.jpg')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', width)
    .attr('height', height);

  // 바둑판 배경
  svg.append('rect')
    .attr('width', width)
    .attr('height', height)
    .attr('fill', 'url(#wood)');

  const board = svg.append('g')
    .attr('transform', `translate(${boardPadding}, ${boardPadding})`);

  // 바둑판 선 그리기
  const boardWidth = width - boardPadding * 2;
  const boardHeight = height - boardPadding * 2;
  const cellWidth = boardWidth / (xLines - 1);
  const cellHeight = boardHeight / (yLines - 1);

  // 가로선
  for (let i = 0; i < yLines; i++) {
    board.append('line')
      .attr('x1', 0)
      .attr('y1', i * cellHeight)
      .attr('x2', boardWidth)
      .attr('y2', i * cellHeight)
      .attr('stroke', 'black')
      .attr('stroke-width', 1);
  }

  // 세로선
  for (let i = 0; i < xLines; i++) {
    board.append('line')
      .attr('x1', i * cellWidth)
      .attr('y1', 0)
      .attr('x2', i * cellWidth)
      .attr('y2', boardHeight)
      .attr('stroke', 'black')
      .attr('stroke-width', 1);
  }

  // 화점(星) 그리기
  if (xLines === 19 && yLines === 19) {
    const starPoints = [
      [3, 3], [9, 3], [15, 3],
      [3, 9], [9, 9], [15, 9],
      [3, 15], [9, 15], [15, 15]
    ];

    for (const [x, y] of starPoints) {
      board.append('circle')
        .attr('cx', x * cellWidth)
        .attr('cy', y * cellHeight)
        .attr('r', 4)
        .attr('fill', 'black');
    }
  }

  // 돌을 놓을 그룹과 오버레이 그룹 추가
  board.append('g').attr('class', 'stones');
  board.append('g').attr('class', 'territories');
  board.append('g').attr('class', 'overlay');
  board.append('g').attr('class', 'markers');

  // 좌표 표시
  if (showCoordinates) {
    const coords = board.append('g').attr('class', 'coordinates');
    
    // 가로 좌표
    for (let i = 0; i < xLines; i++) {
      coords.append('text')
        .attr('x', i * cellWidth)
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .text(String.fromCharCode(65 + i));
    }
    
    // 세로 좌표
    for (let i = 0; i < yLines; i++) {
      coords.append('text')
        .attr('x', -10)
        .attr('y', i * cellHeight + 4)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .text(yLines - i);
    }
  }

  return {
    svg,
    board,
    cellWidth,
    cellHeight,
    stoneRadius: Math.min(cellWidth, cellHeight) * 0.45
  };
}