'use client';

import { Search, User, SlidersHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Header() {
  return (
    <header className="w-full px-6 pt-12 pb-4">
      <div className="flex justify-between items-start mb-6">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h1 className="text-4xl font-bold text-gray-900 leading-tight">
            Dear <br/>
            <span className="text-red-900">Adore</span>
          </h1>
        </motion.div>
        
        <motion.div 
          className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-sm"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <User size={24} className="text-gray-500" />
        </motion.div>
      </div>

      <motion.div 
        className="flex items-center gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="flex-1 flex items-center bg-white rounded-full px-4 py-3 shadow-sm border border-gray-100">
          <Search size={20} className="text-gray-400 mr-3" />
          <input 
            type="text" 
            placeholder="Cari tema, gaya..." 
            className="bg-transparent border-none outline-none w-full text-gray-700 placeholder-gray-400 text-sm"
          />
        </div>
        <button className="bg-white p-3 rounded-full shadow-sm border border-gray-100 text-gray-600 flex-shrink-0">
          <SlidersHorizontal size={20} />
        </button>
      </motion.div>
    </header>
  );
}
