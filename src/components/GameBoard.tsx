'use client';
import { Game } from '@/lib/game';
import * as FileSaver from 'file-saver';
import { useCallback, useEffect, useRef, useState } from 'react';
import Board from './Board';
import GameControls from './GameControls';
import useGame from '@/hooks/useGame';
import RightSidebar from './RightSidebar';

export default function GameBoard() {
  const [currentTool, setCurrentTool] = useState<string>('move');
  
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
    importSGF,
    claimTerritory,
    startGame,
    game,
    comment,
    addMarker
  } = useGame();

  const gameRef = useRef<Game | null>(null);
  
  // 컴포넌트가 마운트되면 자동으로 게임을 시작합니다
  useEffect(() => {
    if (!boardState) {
      startGame();
    }
  }, [boardState, startGame]);
  
  useEffect(() => {
    if (game) {
      gameRef.current = game;
    }
  }, [game]);

  useEffect(() => {
    if (gameRef.current) {
      gameRef.current.markers = game?.getGameState()?.markers ?? [];
    }
  }, [game]);

  const handleIntersectionClick = useCallback((x: number, y: number) => {
    if (isGameEnded) {
      claimTerritory(x, y);
    } else {
      if (currentTool === 'move') {
        makeMove(x, y);
      } else {
        const existing = game?.getGameState()?.markers?.find(m => m.x === x && m.y === y);
        if (existing?.type === currentTool) {
          // Toggle off
          if (!game) return;
          game.markers = game.markers.filter(m => !(m.x === x && m.y === y && m.type === currentTool));
          const state = game.getGameState();
          if (state) {
            state.markers = [...game.markers];
          }
        } else {
          if (!game) return;
          let label: string | undefined = undefined;

          if (currentTool === 'letter') {
            const allLetters = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'];
            const usedLabels = game.markers.filter(m => m.type === 'letter').map(m => m.label);
            label = allLetters.find(ch => !usedLabels.includes(ch)) ?? '?';
          }

          if (currentTool === 'number') {
            const usedNumbers = game.markers
              .filter(m => m.type === 'number')
              .map(m => parseInt(m.label || '0'));
            const nextNumber = 1 + Math.max(0, ...usedNumbers);
            label = nextNumber.toString();
          }

          game.addMarker(x, y, currentTool, label);
        }
      }
    }
  }, [isGameEnded, makeMove, claimTerritory, currentTool, game]);
  
  if (!boardState) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl mb-4">게임 로딩 중...</h2>
      </div>
    );
  }
  
  return (
    <div className="flex gap-4">
      <div className="flex-1">
        <div className="container mx-auto p-4">
          <Board
            size={19}
            boardState={boardState}
            lastMove={lastMove}
            isGameEnded={isGameEnded}
            onIntersectionClick={handleIntersectionClick}
            markers={game?.getGameState()?.markers ?? []}
          />
          
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
            onSave={() => {
              const sgf = gameRef.current?.saveSGF();
              if (sgf) {
                const blob = new Blob([sgf], { type: 'application/x-go-sgf' });
                FileSaver.saveAs(blob, 'game.sgf');
              }
            }}
            onLoad={importSGF}
            onSelectTool={setCurrentTool}
            selectedTool={currentTool}
          />
        </div>
      </div>
      <RightSidebar comment={comment} />
    </div>
  );
}