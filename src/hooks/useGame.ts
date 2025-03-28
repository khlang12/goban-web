// src/hooks/useGame.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import { Game } from '@/lib/game';
import { Stone } from '@/lib/types';

export default function useGame() {
  const [game, setGame] = useState<Game | null>(null);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isGameEnded, setIsGameEnded] = useState(false);
  const [boardState, setBoardState] = useState<any>(null);
  const [blackScore, setBlackScore] = useState(0);
  const [whiteScore, setWhiteScore] = useState(0);
  const [blackTerritory, setBlackTerritory] = useState(0);
  const [whiteTerritory, setWhiteTerritory] = useState(0);
  const [currentPlayer, setCurrentPlayer] = useState<Stone>(Stone.Black);
  const [lastMove, setLastMove] = useState<{x: number, y: number} | null>(null);
  const gameRef = useRef<Game | null>(null);
  
  // 게임 상태 변화 시 UI 업데이트
  const updateGameState = useCallback(() => {
    if (!gameRef.current) return;
    
    const game = gameRef.current;
    setBoardState([...game.intersections]);
    setBlackScore(game.getBlackScore());
    setWhiteScore(game.getWhiteScore());
    setCurrentPlayer(game.getTurn());
    
    const lastMove = game.getLastMove();
    setLastMove(lastMove ? {x: lastMove.xPos, y: lastMove.yPos} : null);
    
    // 영역 점수 계산
    const { territory: blackTerr } = game.getScoreWithTerritory(Stone.Black);
    const { territory: whiteTerr } = game.getScoreWithTerritory(Stone.White);
    setBlackTerritory(blackTerr);
    setWhiteTerritory(whiteTerr);
    
    // 게임이 끝났는지 확인
    setIsGameEnded(game.getTurn() === Stone.None);
  }, []);
  
  // 새 게임 시작
  const startGame = useCallback(() => {
    const newGame = new Game(19, 19, updateGameState);
    gameRef.current = newGame;
    setGame(newGame);
    setIsGameStarted(true);
    setIsGameEnded(false);
    setCurrentPlayer(Stone.Black);
    setBoardState([...newGame.intersections]);
    setBlackScore(0);
    setWhiteScore(0);
    setBlackTerritory(0);
    setWhiteTerritory(0);
    setLastMove(null);
  }, [updateGameState]);
  
  // SGF 로드
  const loadSGF = useCallback((sgfContent: string) => {
    const loadedGame = Game.loadSGF(sgfContent);
    if (loadedGame) {
      gameRef.current = loadedGame;
      setGame(loadedGame);
      setIsGameStarted(true);
      setBoardState([...loadedGame.intersections]);
      setBlackScore(loadedGame.getBlackScore());
      setWhiteScore(loadedGame.getWhiteScore());
      setCurrentPlayer(loadedGame.getTurn());
      const lastMove = loadedGame.getLastMove();
      setLastMove(lastMove ? {x: lastMove.xPos, y: lastMove.yPos} : null);
    }
  }, []);
  
  // 돌 놓기
  const makeMove = useCallback((x: number, y: number) => {
    if (!gameRef.current || isGameEnded) return false;
    
    const success = gameRef.current.makeMove(x, y);
    if (success) {
      updateGameState();
    }
    return success;
  }, [isGameEnded, updateGameState]);
  
  // 패스
  const pass = useCallback(() => {
    if (!gameRef.current || isGameEnded) return;
    
    gameRef.current.pass();
    updateGameState();
  }, [isGameEnded, updateGameState]);
  
  // 무르기
  const undo = useCallback(() => {
    if (!gameRef.current) return;
    
    gameRef.current.undo();
    updateGameState();
  }, [updateGameState]);
  
  // 앞으로 가기
  const redo = useCallback(() => {
    if (!gameRef.current) return;
    
    gameRef.current.redo();
    updateGameState();
  }, [updateGameState]);
  
  // SGF 저장
  const saveSGF = useCallback(() => {
    if (!gameRef.current) return;
    
    gameRef.current.saveSGF();
  }, []);

  // SGF 불러오기
  const importSGF = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.sgf';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const sgfContent = reader.result as string;
        loadSGF(sgfContent);
      };
      reader.readAsText(file);
    };
    input.click();
  }, [loadSGF]);

  // 영역 점령
  const claimTerritory = useCallback((x: number, y: number) => {
    if (!gameRef.current || !isGameEnded) return false;
    
    const success = gameRef.current.claimTerritory(x, y);
    if (success) {
      updateGameState();
    }
    return success;
  }, [isGameEnded, updateGameState]);

  return {
    game,
    isGameStarted,
    isGameEnded,
    boardState,
    blackScore,
    whiteScore,
    blackTerritory,
    whiteTerritory,
    currentPlayer,
    lastMove,
    startGame,
    loadSGF,
    makeMove,
    pass,
    undo,
    redo,
    saveSGF,
    claimTerritory,
    importSGF,
  };
}