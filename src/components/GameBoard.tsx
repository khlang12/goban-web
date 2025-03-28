// src/components/GameBoard.tsx
'use client';

import { useCallback, useEffect } from 'react';
import Board from './Board';
import GameControls from './GameControls';
import useGame from '@/hooks/useGame';

export default function GameBoard() {
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
      makeMove(x, y);
    }
  }, [isGameEnded, makeMove, claimTerritory]);
  
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
      />
      
      <Board
        size={19}
        boardState={boardState}
        lastMove={lastMove}
        isGameEnded={isGameEnded}
        onIntersectionClick={handleIntersectionClick}
      />
    </div>
  );
}