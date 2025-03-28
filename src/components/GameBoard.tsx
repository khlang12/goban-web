'use client';

import { useCallback, useEffect, useState } from 'react';
import Board from './Board';
import GameControls from './GameControls';
import useGame from '@/hooks/useGame';

export default function GameBoard() {
  const [currentTool, setCurrentTool] = useState<string>('move');
  const [markers, setMarkers] = useState<{ x: number; y: number; type: string; label?: string }[]>([]);
  
  const {
    isGameStarted,
    isGameEnded,
    boardState,
    blackScore,
    whiteScore,
    blackTerritory,
    whiteTerritory,
    currentPlayer,
    lastMove,
    makeMove,
    pass,
    undo,
    redo,
    saveSGF,
    importSGF,
    claimTerritory,
    startGame
  } = useGame();
  
  // 컴포넌트가 마운트되면 자동으로 게임을 시작합니다
  useEffect(() => {
    if (!boardState) {
      startGame();
    }
  }, [boardState, startGame]);
  
  const handleIntersectionClick = useCallback((x: number, y: number) => {
    if (isGameEnded) {
      claimTerritory(x, y);
    } else {
      if (currentTool === 'move') {
        makeMove(x, y);
      } else {
        setMarkers(prev => {
          const existing = prev.find(m => m.x === x && m.y === y);
          const updated = prev.filter(m => !(m.x === x && m.y === y));

          // If same marker already exists → remove it (toggle off)
          if (existing?.type === currentTool) {
            return updated;
          }

          let newMarker = { x, y, type: currentTool };

          // Handle letter marker sequence
          if (currentTool === 'letter') {
            const allLetters = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'];
            const nextLetter = allLetters.filter(ch => !prev.some(m => m.type === 'letter' && m.label === ch))[0] || '?';
            newMarker = { ...newMarker, label: nextLetter };
          }

          // Handle number marker sequence
          if (currentTool === 'number') {
            const nextNumber = 1 + Math.max(0, ...prev.filter(m => m.type === 'number').map(m => parseInt(m.label || '0')));
            newMarker = { ...newMarker, label: nextNumber.toString() };
          }

          return [...updated, newMarker];
        });
      }
    }
  }, [isGameEnded, makeMove, claimTerritory, currentTool]);
  
  if (!boardState) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl mb-4">게임 로딩 중...</h2>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      <GameControls
        currentPlayer={currentPlayer}
        blackScore={blackScore}
        whiteScore={whiteScore}
        blackTerritory={blackTerritory}
        whiteTerritory={whiteTerritory}
        isGameEnded={isGameEnded}
        onPass={pass}
        onUndo={undo}
        onRedo={redo}
        onSave={saveSGF}
        onLoad={importSGF}
        onSelectTool={setCurrentTool}
        selectedTool={currentTool}
      />
      
      <Board
        size={19}
        boardState={boardState}
        lastMove={lastMove}
        isGameEnded={isGameEnded}
        onIntersectionClick={handleIntersectionClick}
        markers={markers}
      />
    </div>
  );
}