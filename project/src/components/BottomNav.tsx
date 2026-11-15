import React from 'react';
import { Search } from 'lucide-react';
import { useUserPreferences } from '../contexts/UserPreferencesContext';

interface BottomNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const navButtonClass = 'flex min-w-0 flex-1 flex-col items-center gap-0.5 py-0.5 transition-all duration-300 group';
const iconFrameClass = 'flex h-6 w-6 shrink-0 items-center justify-center';
const labelClass = 'h-3 text-[10px] font-medium leading-3 transition-colors';

export const BottomNav: React.FC<BottomNavProps> = ({ currentPage, onNavigate }) => {
  const { preferences } = useUserPreferences();
  const isLightTheme = preferences?.theme === 'light' || document.documentElement.classList.contains('light-theme');
  const isHomeActive = ['dashboard', 'stories', 'live'].includes(currentPage);

  const activeColor = (isActive: boolean) =>
    isActive ? '' : 'opacity-50 group-hover:opacity-80';

  const darkIconFilter = isHomeActive ? 'invert(1)' : (isLightTheme ? 'none' : 'invert(1)');
  const whiteIconFilter = isHomeActive ? 'none' : (isLightTheme ? 'brightness(0)' : 'none');
  const navTextColor = isHomeActive ? '#ffffff' : 'var(--text-primary)';
  const navMutedColor = isHomeActive ? 'rgba(255,255,255,0.55)' : 'var(--text-muted)';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[1000]">
      <div
        className="grid grid-cols-5 items-start px-2 py-1"
        style={{
          background: isHomeActive ? '#000000' : 'var(--nav-bg)',
          borderTop: isHomeActive ? '1px solid #000000' : '1px solid var(--nav-border)',
        }}
      >
        <button onClick={() => onNavigate('dashboard')} className={navButtonClass}>
          <div className={iconFrameClass}>
            <img
              src={isHomeActive ? '/home_filled_white.png' : '/home_outline_white.png'}
              alt="Home"
              className="h-6 w-6 object-contain transition-opacity"
              style={{ opacity: isHomeActive ? 1 : 0.4, filter: whiteIconFilter }}
            />
          </div>
          <span className={`${labelClass} ${activeColor(isHomeActive)}`} style={{ color: isHomeActive ? navTextColor : navMutedColor }}>Maison</span>
        </button>

        <button onClick={() => onNavigate('search')} className={navButtonClass}>
          <div className={iconFrameClass}>
            <Search className={`h-6 w-6 ${activeColor(currentPage === 'search')}`} style={{ color: currentPage === 'search' ? navTextColor : navMutedColor }} />
          </div>
          <span className={`${labelClass} ${activeColor(currentPage === 'search')}`} style={{ color: currentPage === 'search' ? 'var(--text-primary)' : 'var(--text-muted)' }}>Recherche</span>
        </button>

        <button onClick={() => onNavigate('camera')} className={navButtonClass}>
          <div className="flex h-16 w-16 shrink-0 -translate-y-4 items-center justify-center">
            <img
              src={isHomeActive || !isLightTheme
                ? '/icons/camera/file_000000001b9c81f4a1c86310f5246c58.png'
                : '/icons/camera/file_000000001b8081f489a3851b0cb3ecb5.png'}
              alt="Caméra"
              className="h-16 w-16 object-contain transition-opacity"
              style={{ opacity: currentPage === 'camera' ? 1 : 0.4 }}
            />
          </div>
        </button>

        <button onClick={() => onNavigate('friends')} className={navButtonClass}>
          <div className={iconFrameClass}>
            <img
              src={currentPage === 'friends' ? '/messages_filled_white.png' : '/messages_outline_white.png'}
              alt="Messages"
              className="h-6 w-6 object-contain transition-opacity"
              style={{ opacity: currentPage === 'friends' ? 1 : 0.4, filter: whiteIconFilter }}
            />
          </div>
          <span className={`${labelClass} ${activeColor(currentPage === 'friends')}`} style={{ color: currentPage === 'friends' ? navTextColor : navMutedColor }}>Messages</span>
        </button>

        <button onClick={() => onNavigate('profile')} className={navButtonClass}>
          <div className={iconFrameClass}>
            <img
              src={currentPage === 'profile' ? '/icons/profile/utilisateur_active.png' : '/icons/profile/utilisateur_inactive.png'}
              alt="Profil"
              className="h-6 w-6 object-contain transition-opacity"
              style={{ opacity: currentPage === 'profile' ? 1 : 0.4, filter: darkIconFilter }}
            />
          </div>
          <span className={`${labelClass} ${activeColor(currentPage === 'profile')}`} style={{ color: currentPage === 'profile' ? navTextColor : navMutedColor }}>Profil</span>
        </button>
      </div>
    </div>
  );
};
