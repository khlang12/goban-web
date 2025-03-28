// src/components/NavBar.tsx
'use client';

import Link from 'next/link';

interface NavBarProps {
  isInGame: boolean;
  onNewGame: () => void;
}

export default function NavBar({ isInGame, onNewGame }: NavBarProps) {
  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div>
          <Link href="/" className="text-xl font-bold">
            Goβan <sup>BETA</sup>
          </Link>
        </div>
      </div>
    </nav>
  );
}