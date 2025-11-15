
import React from 'react';
import { DashboardIcon, UsersIcon, CheckCircleIcon, DocumentTextIcon, ShieldExclamationIcon, FingerPrintIcon, XIcon } from './icons';
import { View } from '../App';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  currentView: View;
  setCurrentView: (view: View) => void;
}

const NavLink: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; onClick: () => void; }> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 text-left ${
      active
        ? 'bg-sky-500/20 text-white'
        : 'text-gray-300 hover:bg-sky-500/10 hover:text-white'
    }`}
  >
    {icon}
    <span className="ml-3">{label}</span>
  </button>
);

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, currentView, setCurrentView }) => {
  const handleNavClick = (view: View) => {
    setCurrentView(view);
    if (window.innerWidth < 1024) { // Close sidebar on mobile after navigation
      setIsOpen(false);
    }
  }

  return (
    <>
      <div className={`fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsOpen(false)}></div>
      <aside className={`fixed lg:relative inset-y-0 left-0 bg-primary text-white w-64 space-y-6 py-7 px-2 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out z-30 flex flex-col`}>
        <div className="flex items-center justify-between px-4">
          <a href="#" className="flex items-center space-x-2">
            <FingerPrintIcon className="h-8 w-8 text-accent"/>
            <span className="text-2xl font-bold">SecureVote</span>
          </a>
          <button onClick={() => setIsOpen(false)} className="lg:hidden text-white p-1 rounded-md hover:bg-sky-500/20">
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <nav className="flex-1">
          <ul className="space-y-2">
            <li><NavLink icon={<DashboardIcon className="h-5 w-5"/>} label="Dashboard" active={currentView === 'dashboard'} onClick={() => handleNavClick('dashboard')} /></li>
            <li><NavLink icon={<UsersIcon className="h-5 w-5"/>} label="Voter Registration" onClick={() => {}} /></li>
            <li><NavLink icon={<CheckCircleIcon className="h-5 w-5"/>} label="Verification Portal" onClick={() => {}} /></li>
            <li><NavLink icon={<DocumentTextIcon className="h-5 w-5"/>} label="Audit Logs" onClick={() => {}} /></li>
            <li><NavLink icon={<ShieldExclamationIcon className="h-5 w-5"/>} label="Anomalies" active={currentView === 'anomalies'} onClick={() => handleNavClick('anomalies')} /></li>
          </ul>
        </nav>

        <div className="px-4">
            <div className="p-4 bg-sky-500/20 rounded-lg text-center">
                <h4 className="font-semibold text-white">System Status</h4>
                <div className="flex items-center justify-center mt-2">
                    <span className="h-3 w-3 rounded-full bg-success mr-2"></span>
                    <p className="text-sm text-gray-200">All Systems Normal</p>
                </div>
            </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
