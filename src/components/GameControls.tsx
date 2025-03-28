'use client';

import { Stone } from '@/lib/types';

interface GameControlsProps {
  currentPlayer: Stone;
  blackScore: number;
  whiteScore: number;
  blackTerritory: number; 
  whiteTerritory: number;
  isGameEnded: boolean;
  onPass: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onLoad: () => void;
  onSelectTool?: (tool: string) => void;
  selectedTool?: string;
}

export default function GameControls({
  currentPlayer,
  blackScore,
  whiteScore,
  blackTerritory,
  whiteTerritory,
  isGameEnded,
  onPass,
  onUndo,
  onRedo,
  onSave,
  onLoad,
  onSelectTool,
  selectedTool
}: GameControlsProps) {
  return (
    <div className="flex flex-col gap-4 my-4">
      <div className="flex justify-center gap-8">
        <div className={`p-3 rounded-md shadow-md ${currentPlayer === Stone.Black ? 'bg-gray-800 text-white' : 'bg-gray-100'}`}>
          <h3 className="text-center font-bold">흑 (Black)</h3>
          <div className="text-center text-xl">
            {isGameEnded 
              ? `${blackScore} + ${blackTerritory} = ${blackScore + blackTerritory}`
              : blackScore}
          </div>
        </div>
        <div className={`p-3 rounded-md shadow-md ${currentPlayer === Stone.White ? 'bg-gray-800 text-white' : 'bg-gray-100'}`}>
          <h3 className="text-center font-bold">백 (White)</h3>
          <div className="text-center text-xl">
            {isGameEnded 
              ? `${whiteScore} + ${whiteTerritory} = ${whiteScore + whiteTerritory}`
              : whiteScore}
          </div>
        </div>
      </div>
      
      <div className="flex justify-center gap-2">
        <button 
          onClick={onPass}
          disabled={isGameEnded}
          className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          패스
        </button>
        <button 
          onClick={onUndo}
          className="px-3 py-2 bg-gray-300 rounded hover:bg-gray-400"
        >
          무르기
        </button>
        <button 
          onClick={onRedo}
          className="px-3 py-2 bg-gray-300 rounded hover:bg-gray-400"
        >
          앞으로
        </button>
        <button 
          onClick={onSave}
          className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          SGF 저장
        </button>
        <button 
          onClick={onLoad}
          className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          SGF 불러오기
        </button>
      </div>
      
      <div className="flex justify-center gap-2 mt-2">
        <button 
          onClick={() => onSelectTool?.(selectedTool === 'cross' ? 'move' : 'cross')} 
          className={`px-3 py-2 rounded hover:bg-gray-300 ${selectedTool === 'cross' ? 'bg-gray-400 ring-2 ring-black font-bold' : 'bg-gray-200'}`}
        >
          ×
        </button>
        <button 
          onClick={() => onSelectTool?.(selectedTool === 'triangle' ? 'move' : 'triangle')} 
          className={`px-3 py-2 rounded hover:bg-gray-300 ${selectedTool === 'triangle' ? 'bg-gray-400 ring-2 ring-black font-bold' : 'bg-gray-200'}`}
        >
          △
        </button>
        <button 
          onClick={() => onSelectTool?.(selectedTool === 'square' ? 'move' : 'square')} 
          className={`px-3 py-2 rounded hover:bg-gray-300 ${selectedTool === 'square' ? 'bg-gray-400 ring-2 ring-black font-bold' : 'bg-gray-200'}`}
        >
          □
        </button>
        <button 
          onClick={() => onSelectTool?.(selectedTool === 'circle' ? 'move' : 'circle')} 
          className={`px-3 py-2 rounded hover:bg-gray-300 ${selectedTool === 'circle' ? 'bg-gray-400 ring-2 ring-black font-bold' : 'bg-gray-200'}`}
        >
          ○
        </button>
        <button 
          onClick={() => onSelectTool?.(selectedTool === 'letter' ? 'move' : 'letter')} 
          className={`px-3 py-2 rounded hover:bg-gray-300 ${selectedTool === 'letter' ? 'bg-gray-400 ring-2 ring-black font-bold' : 'bg-gray-200'}`}
        >
          A
        </button>
        <button 
          onClick={() => onSelectTool?.(selectedTool === 'number' ? 'move' : 'number')} 
          className={`px-3 py-2 rounded hover:bg-gray-300 ${selectedTool === 'number' ? 'bg-gray-400 ring-2 ring-black font-bold' : 'bg-gray-200'}`}
        >
          1
        </button>
      </div>
      
      {isGameEnded && (
        <div className="text-center mt-2 p-2 bg-yellow-100 rounded">
          게임이 종료되었습니다. 돌을 클릭하여 영역을 확인하세요.
        </div>
      )}
    </div>
  );
}