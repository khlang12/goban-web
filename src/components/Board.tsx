// src/components/Board.tsx
'use client';

import { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { Stone as StoneEnum, STONE_CLASSES } from '@/lib/types';

interface BoardProps {
  size: number;
  boardState: any[][];
  lastMove: {x: number, y: number} | null;
  isGameEnded: boolean;
  onIntersectionClick: (x: number, y: number) => void;
}

export default function Board({ 
  size, 
  boardState, 
  lastMove, 
  isGameEnded,
  onIntersectionClick 
}: BoardProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const width = 500;
  const height = 500;
  const stoneRadius = Math.min(width / size, height / size) / 2;
  
  useEffect(() => {
    if (!svgRef.current || !boardState) return;
    
    const svg = d3.select(svgRef.current);
    
    // 기존 요소 제거
    svg.selectAll('*').remove();
    
    // 배경 추가
    svg.append('defs')
      .append('pattern')
      .attr('id', 'wood')
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('width', width)
      .attr('height', height)
      .append('image')
      .attr('xlink:href', '/images/board.png')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', width)
      .attr('height', height);
      
    svg.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'url(#wood)');
    
    // 눈금선 그리기
    const lines = svg.append('g').attr('class', 'lines');
    
    // 가로선
    for (let i = 0; i < size; i++) {
      lines.append('line')
        .attr('x1', stoneRadius)
        .attr('y1', stoneRadius + i * (height / size))
        .attr('x2', width - stoneRadius)
        .attr('y2', stoneRadius + i * (height / size))
        .attr('stroke', 'black')
        .attr('stroke-width', 1);
    }
    
    // 세로선
    for (let i = 0; i < size; i++) {
      lines.append('line')
        .attr('x1', stoneRadius + i * (width / size))
        .attr('y1', stoneRadius)
        .attr('x2', stoneRadius + i * (width / size))
        .attr('y2', height - stoneRadius)
        .attr('stroke', 'black')
        .attr('stroke-width', 1);
    }
    
    // 화점(星) 그리기
    if (size === 19) {
      const dots = svg.append('g').attr('class', 'dots');
      const handicapPoints = [
        [3, 3], [9, 3], [15, 3],
        [3, 9], [9, 9], [15, 9],
        [3, 15], [9, 15], [15, 15]
      ];
      
      handicapPoints.forEach(([x, y]) => {
        dots.append('circle')
          .attr('cx', stoneRadius + x * (width / size))
          .attr('cy', stoneRadius + y * (height / size))
          .attr('r', stoneRadius / 6)
          .attr('fill', 'black');
      });
    }
    
    // 돌 그리기
    const stones = svg.append('g').attr('class', 'stones');
    const allIntersections = [];
    
    // 교차점 데이터 평탄화
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        if (boardState[x] && boardState[x][y]) {
          allIntersections.push(boardState[x][y]);
        }
      }
    }
    
    // 돌 그리기 (빈 칸이 아닌 경우)
    stones.selectAll('.stone')
      .data(allIntersections.filter(stone => stone.stone !== StoneEnum.None))
      .enter()
      .append('image')
      .attr('xlink:href', d => d.stone === StoneEnum.Black ? '/images/black_stone.svg' : '/images/white_stone.svg')
      .attr('x', d => stoneRadius + d.xPos * (width / size) - stoneRadius)
      .attr('y', d => stoneRadius + d.yPos * (height / size) - stoneRadius)
      .attr('width', stoneRadius * 2)
      .attr('height', stoneRadius * 2)
      .attr('class', d => `stone ${STONE_CLASSES[d.stone]}`);
    
    // 클릭 영역
    const overlay = svg.append('g').attr('class', 'overlay');
    
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        overlay.append('rect')
          .attr('x', x * (width / size))
          .attr('y', y * (height / size))
          .attr('width', width / size)
          .attr('height', height / size)
          .attr('fill', 'transparent')
          .attr('data-x', x)
          .attr('data-y', y)
          .on('click', () => onIntersectionClick(x, y));
      }
    }
    
    // 마지막 수 표시
    if (lastMove) {
      const stoneColor = 
        boardState[lastMove.x][lastMove.y].stone === StoneEnum.Black ? 'white' : 'black';
        
      svg.append('circle')
        .attr('cx', stoneRadius + lastMove.x * (width / size))
        .attr('cy', stoneRadius + lastMove.y * (height / size))
        .attr('r', stoneRadius / 2.5)
        .attr('class', 'last-move')
        .attr('fill', 'none')
        .attr('stroke', stoneColor)
        .attr('stroke-width', 2);
    }
    
    // 게임이 끝났을 때 영역 표시
    if (isGameEnded) {
      // (간소화 버전에서는 생략)
    }
    
  }, [boardState, size, lastMove, isGameEnded, stoneRadius, onIntersectionClick]);
  
  return (
    <div className="w-full flex justify-center my-4">
      <svg 
        ref={svgRef} 
        width={width} 
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="mx-auto border rounded shadow-md"
      />
    </div>
  );
}