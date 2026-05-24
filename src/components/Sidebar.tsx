import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Book, Tag, Home, Github, Twitter, Mail, Menu, X, Share2, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function Sidebar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Archives', path: '/essays', icon: Book },
    { name: 'Graph', path: '/graph', icon: Share2 },
    { name: 'Authors', path: '/authors', icon: Users },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#fdfdfc] border-r border-gray-100 transition-colors duration-300">
      <div className="p-8 flex items-center justify-between">
        <Link to="/" className="group block">
          <h1 className="text-xl font-bold tracking-tighter transition-colors group-hover:text-orange-600 text-gray-900">
            NEXUS <span className="text-gray-400">OF THOUGHT</span>
          </h1>
          <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-medium">Research & Deep Dives</p>
        </Link>
        <button onClick={() => setIsOpen(false)} className="lg:hidden p-2 text-gray-400 hover:text-gray-900 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-orange-50 text-orange-700'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon className={`w-4 h-4 ${isActive ? 'text-orange-600' : ''}`} />
              {item.name}
              {isActive && (
                <motion.div
                  layoutId="active-pill"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-600"
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-8 border-t border-gray-50 flex justify-center">
        <a 
          href="mailto:id24resch11002@iith.ac.in" 
          className="p-2.5 rounded-full border border-gray-100 text-gray-400 hover:text-orange-600 hover:border-orange-500 transition-all bg-white shadow-2xs flex items-center justify-center cursor-pointer"
          title="Send email to id24resch11002@iith.ac.in"
        >
          <Mail className="w-4 h-4" />
        </a>
      </div>
    </div>
  );

  return (
    <>
      <div className="lg:hidden fixed top-4 left-4 z-[60]">
        <button
          onClick={() => setIsOpen(true)}
          className="p-3 bg-[#fdfdfc] border border-gray-100 rounded-xl shadow-lg text-gray-500 hover:text-orange-600 transition-all"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <aside className="hidden lg:flex w-64 flex-shrink-0 flex-col h-screen sticky top-0 z-50">
        {sidebarContent}
      </aside>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 z-[80] lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
