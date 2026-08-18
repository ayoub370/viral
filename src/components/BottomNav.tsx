import React from 'react';
import { Search } from 'lucide-react';

interface BottomNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentPage, onNavigate }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[1000]">
      <div
        className="flex justify-around items-center py-4 px-2"
        style={{
          background: 'var(--nav-bg)',
          borderTop: '1px solid var(--nav-border)',
          backdropFilter: 'var(--glass-blur)',
          WebkitBackdropFilter: 'var(--glass-blur)',
        }}
      >
        {/* Bouton Home */}
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex flex-col items-center gap-1 transition-all duration-300 group py-2"
        >
          <img
            src={currentPage === 'dashboard' ? '/home_filled_white.png' : '/home_outline_white.png'}
            alt="Home"
            className={`w-7 h-7 object-contain transition-opacity ${
              currentPage === 'dashboard' ? 'opacity-100' : 'opacity-40 group-hover:opacity-70'
            }`}
          />
        </button>

        {/* Bouton Search */}
        <button
          onClick={() => onNavigate('search')}
          className="flex flex-col items-center gap-1 transition-all duration-300 group py-2"
        >
          <Search
            className={`w-6 h-6 transition-colors ${
              currentPage === 'search' ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'
            }`}
          />
        </button>

        {/* Bouton Caméra */}
        <button
          onClick={() => onNavigate('camera')}
          className="flex flex-col items-center gap-1 transition-all duration-300 group py-2"
        >
          <img
            src="/image copy.png"
            alt="Camera"
            className={`w-7 h-7 object-contain transition-opacity ${
              currentPage === 'camera' ? 'opacity-100' : 'opacity-40 group-hover:opacity-70'
            }`}
            style={{ filter: 'invert(1)' }}
          />
        </button>

        {/* Bouton Messages */}
        <button
          onClick={() => onNavigate('friends')}
          className="flex flex-col items-center gap-1 transition-all duration-300 group py-2"
        >
          <img
            src={currentPage === 'friends' ? '/messages_filled_white copy.png' : '/messages_outline_white copy.png'}
            alt="Messages"
            className={`w-7 h-7 object-contain transition-opacity ${
              currentPage === 'friends' ? 'opacity-100' : 'opacity-40 group-hover:opacity-70'
            }`}
          />
        </button>

        {/* Bouton Profile */}
        <button
          onClick={() => onNavigate('profile')}
          className="flex flex-col items-center gap-1 transition-all duration-300 group py-2"
        >
          <svg
            className={`w-6 h-6 transition-colors ${
              currentPage === 'profile' ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'
            }`}
            fill={currentPage === 'profile' ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </button>
      </div>
    </div>
  );
};
