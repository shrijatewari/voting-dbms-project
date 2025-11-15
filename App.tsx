
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AnomalyDashboard from './components/AnomalyDashboard';
import Header from './components/Header';
import { MenuIcon } from './components/icons';

export type View = 'dashboard' | 'anomalies';

const App: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<View>('dashboard');

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'anomalies':
        return <AnomalyDashboard />;
      default:
        return <Dashboard />;
    }
  };
  
  const getHeaderTitle = () => {
    switch (currentView) {
      case 'dashboard':
        return 'Dashboard';
      case 'anomalies':
        return 'Anomaly Detection';
      default:
        return 'Dashboard';
    }
  }

  return (
    <div className="flex h-screen bg-light-bg text-secondary">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} currentView={currentView} setCurrentView={setCurrentView} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={getHeaderTitle()}>
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-secondary">
             <MenuIcon className="h-6 w-6" />
          </button>
        </Header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-light-bg">
          <div className="container mx-auto px-6 py-8">
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
