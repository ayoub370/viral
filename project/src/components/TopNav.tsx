import React from 'react';

interface TopNavProps {
  activeTab: 'story' | 'live' | 'feed';
  onNavigateToStories: () => void;
  onNavigateToLive: () => void;
  onNavigateToFeed: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ activeTab, onNavigateToStories, onNavigateToLive, onNavigateToFeed }) => {
  const tabs: { key: 'story' | 'live' | 'feed'; label: string; onClick: () => void }[] = [
    { key: 'story', label: 'Story', onClick: onNavigateToStories },
    { key: 'live', label: 'Live', onClick: onNavigateToLive },
    { key: 'feed', label: 'Feed', onClick: onNavigateToFeed },
  ];

  return (
    <div className="fixed top-3 left-1/2 z-[100] -translate-x-1/2">
      <nav className="flex items-center gap-6 px-2 py-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={tab.onClick}
            className="relative text-sm font-semibold transition-all duration-200 active:scale-90"
            style={{ color: activeTab === tab.key ? '#ffffff' : 'rgba(255,255,255,0.55)' }}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full" style={{ background: '#ffffff' }} />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
};
