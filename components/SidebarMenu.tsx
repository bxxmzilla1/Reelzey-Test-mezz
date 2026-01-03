
import React from 'react';

interface SidebarMenuProps {
  activeMenu: string;
  onMenuChange: (menu: string) => void;
}

const MirrorIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <path d="M13 7a9.3 9.3 0 0 0 1.516 -.546c.911 -.438 1.494 -1.015 1.937 -1.932c.207 -.428 .382 -.928 .547 -1.522c.165 .595 .34 1.095 .547 1.521c.443 .918 1.026 1.495 1.937 1.933c.426 .205 .925 .38 1.516 .546a9.3 9.3 0 0 0 -1.516 .547c-.911 .438 -1.494 1.015 -1.937 1.932a9 9 0 0 0 -.547 1.521c-.165 -.594 -.34 -1.095 -.547 -1.521c-.443 -.918 -1.026 -1.494 -1.937 -1.932a9 9 0 0 0 -1.516 -.547" />
    <path d="M3 14a21 21 0 0 0 1.652 -.532c2.542 -.953 3.853 -2.238 4.816 -4.806a20 20 0 0 0 .532 -1.662a20 20 0 0 0 .532 1.662c.963 2.567 2.275 3.853 4.816 4.806q .75 .28 1.652 .532a21 21 0 0 0 -1.652 .532c-2.542 .953 -3.854 2.238 -4.816 4.806a20 20 0 0 0 -.532 1.662a20 20 0 0 0 -.532 -1.662c-.963 -2.568 -2.275 -3.853 -4.816 -4.806a21 21 0 0 0 -1.652 -.532" />
  </svg>
);

const SidebarMenu: React.FC<SidebarMenuProps> = ({ activeMenu, onMenuChange }) => {
  const menuItems = [
    { id: 'directorMode', name: 'Director Mode', icon: 'fa-video', iconType: 'fa' as const },
    { id: 'mirrorMode', name: 'Mirror Mode', icon: 'mirror', iconType: 'svg' as const },
  ];

  const handleClick = (e: React.MouseEvent, menuId: string) => {
    e.preventDefault();
    onMenuChange(menuId);
  };

  const renderIcon = (item: typeof menuItems[0], size: 'lg' | 'xl' = 'lg') => {
    if (item.iconType === 'svg') {
      return <MirrorIcon className={size === 'lg' ? 'w-5 h-5' : 'w-6 h-6'} />;
    }
    return <i className={`fas ${item.icon} ${size === 'lg' ? 'text-lg' : 'text-xl'}`}></i>;
  };

  return (
    <>
      {/* Desktop: Left Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-16 bottom-0 w-64 bg-black/80 backdrop-blur-sm border-r border-purple-500/20 z-30">
        <nav className="w-full p-4 flex flex-col gap-2">
          {menuItems.map(item => (
            <a
              href="#"
              key={item.id}
              onClick={(e) => handleClick(e, item.id)}
              className={`px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-3 ${
                activeMenu === item.id
                  ? 'bg-purple-600 text-white neon-glow'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {renderIcon(item, 'lg')}
              <span className="font-semibold">{item.name}</span>
            </a>
          ))}
        </nav>
      </aside>

      {/* Mobile: Footer Menu */}
      <footer className="md:hidden fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm border-t border-purple-500/20 z-40 safe-area-inset-bottom">
        <nav className="flex items-center justify-around px-2 py-3">
          {menuItems.map(item => (
            <a
              href="#"
              key={item.id}
              onClick={(e) => handleClick(e, item.id)}
              className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 min-w-[80px] ${
                activeMenu === item.id
                  ? 'text-purple-400'
                  : 'text-gray-400'
              }`}
            >
              {renderIcon(item, 'xl')}
              <span className="text-xs font-semibold">{item.name}</span>
            </a>
          ))}
        </nav>
      </footer>
    </>
  );
};

export default SidebarMenu;

