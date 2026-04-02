import React from 'react';

const Sidebar = () => {
  const menuItems = ["Home", "Live Map", "Explore", "QR Scanner", "Saved", "Settings"];
  return (
    <aside className="w-72 p-10 flex flex-col border-r border-white/5 bg-black/40">
      <div className="flex items-center gap-3 mb-14">
        <div className="w-10 h-10 bg-lime-400 rounded-2xl flex items-center justify-center text-black font-black">S</div>
        <h1 className="text-white text-2xl font-bold tracking-tight">SmartNav</h1>
      </div>
      <nav className="flex-1 space-y-3">
        {menuItems.map((item, i) => (
          <button key={item} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${i === 0 ? 'bg-lime-400 text-black font-bold' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            {item}
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;