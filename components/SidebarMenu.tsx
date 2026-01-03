
import React from 'react';

interface SidebarMenuProps {
  activeMenu: string;
  onMenuChange: (menu: string) => void;
}

const SidebarMenu: React.FC<SidebarMenuProps> = ({ activeMenu, onMenuChange }) => {
  const menuItems = [
    { id: 'directorMode', name: 'Director Mode', icon: 'fa-video' },
    { id: 'mirrorMode', name: 'Mirror Mode', icon: 'fa-image' },
  ];

  const handleClick = (e: React.MouseEvent, menuId: string) => {
    e.preventDefault();
    onMenuChange(menuId);
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
              <i className={`fas ${item.icon} text-lg`}></i>
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
              <i className={`fas ${item.icon} text-xl`}></i>
              <span className="text-xs font-semibold">{item.name}</span>
            </a>
          ))}
        </nav>
      </footer>
    </>
  );
};

export default SidebarMenu;

