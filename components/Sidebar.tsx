
import React from 'react';

interface TabsProps {
  activeView: string;
  onViewChange: (view: string) => void;
  showIcons?: boolean;
}

const Tabs: React.FC<TabsProps> = ({ activeView, onViewChange, showIcons = false }) => {
  const tabBaseClasses = "px-6 sm:px-8 py-3 text-lg font-semibold rounded-xl transition-colors duration-200 flex items-center justify-center gap-2";
  const activeTabClasses = "bg-purple-600 text-white neon-glow";
  const inactiveTabClasses = "text-gray-400 bg-gray-800 hover:bg-gray-700 hover:text-white";

  const handleClick = (e: React.MouseEvent, view: string) => {
    e.preventDefault();
    onViewChange(view);
  };

  const views = [
    { id: 'scriptCreator', name: 'Script', icon: 'fa-scroll' },
    { id: 'videoCreator', name: 'Video', icon: 'fa-film' },
  ];

  return (
    <nav className="flex flex-wrap items-center justify-center gap-4 sm:gap-5 mt-8 mb-12 px-4">
      {views.map(view => (
        <a 
          href="#" 
          key={view.id}
          onClick={(e) => handleClick(e, view.id)} 
          className={`${tabBaseClasses} ${activeView === view.id ? activeTabClasses : inactiveTabClasses}`}
        >
          {showIcons && <i className={`fas ${view.icon}`}></i>}
          <span>{view.name}</span>
        </a>
      ))}
    </nav>
  );
};

export default Tabs;