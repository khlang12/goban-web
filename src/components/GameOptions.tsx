// src/components/GameOptions.tsx
'use client';

import Image from 'next/image';

interface GameOption {
  id: string;
  title: string;
  description: string;
  image: string;
}

interface GameOptionsProps {
  onSelectGame: (topology: string) => void;
}

const gameOptions: GameOption[] = [
  {
    id: 'classic',
    title: 'Classic',
    description: 'Classic game of Go with edges and corners.',
    image: '/images/Go_board.jpg'
  },
  {
    id: 'torus',
    title: 'Torus',
    description: 'Edges wrap around (Like pacman)',
    image: '/images/Torus-750x416.png'
  },
  {
    id: 'klein',
    title: 'Klein Bottle',
    description: 'Edges wrap around like the torus above and below, but flip vertically left and right.',
    image: '/images/Klein_bottle-750x416.png'
  },
  {
    id: 'rpp',
    title: 'Real Projective Plane',
    description: 'Edges wrap around, but flip horizontally up and down, and flip vertically left and right.',
    image: '/images/CrossCapTwoViews-750x416.png'
  },
  {
    id: 'cylinder',
    title: 'Cylinder',
    description: 'Wrap around like the torus left and right, but the top and bottom are hard edges like classic.',
    image: '/images/Circular_Cylinder_Quadric-750x416.png'
  },
  {
    id: 'mobius',
    title: 'Mobius Strip',
    description: 'Wrap around left and right and flips vertically, but the top and bottom are hard edges like classic.',
    image: '/images/Moebius_Surface_1_Display-750x416.png'
  },
];

export default function GameOptions({ onSelectGame }: GameOptionsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
      {gameOptions.map((option) => (
        <div key={option.id} className="border rounded overflow-hidden shadow-md">
          <div className="h-48 relative">
            <Image
              src={option.image}
              alt={option.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
            />
          </div>
          <div className="p-4">
            <h3 className="text-xl font-bold mb-2">{option.title}</h3>
            <p className="text-gray-700 mb-4 h-16">{option.description}</p>
            <div className="text-right">
              <button 
                onClick={() => onSelectGame(option.id)}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Start
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}