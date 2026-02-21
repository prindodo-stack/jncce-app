import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Calendar from './components/Calendar';
import StatsSidebar from './components/StatsSidebar';
import EntryForm from './components/EntryForm';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import { motion, AnimatePresence } from 'motion/react';
import { ViewType } from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('calendar');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const handleNavigateToEntry = (date: string) => {
    setSelectedDate(date);
    setCurrentView('entry');
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onNavigateToEntry={handleNavigateToEntry} />;
      case 'calendar':
        return <Calendar />;
      case 'entry':
        return <EntryForm initialDate={selectedDate} onSaved={() => setSelectedDate(null)} />;
      case 'settings':
        return (
          <Settings 
            isAdmin={isAdmin} 
            onLogin={() => setIsAdmin(true)} 
            onLogout={() => setIsAdmin(false)} 
          />
        );
      default:
        return <Calendar />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f6f6f8]">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} isAdmin={isAdmin} />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        
        <div className="flex-1 flex overflow-hidden">
          <section className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentView}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderView()}
              </motion.div>
            </AnimatePresence>
          </section>

          {currentView === 'calendar' && <StatsSidebar />}
        </div>
      </main>

      {/* Mobile Navigation Trigger */}
      <div className="fixed bottom-6 right-6 lg:hidden">
        <button className="size-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95">
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>
    </div>
  );
}
