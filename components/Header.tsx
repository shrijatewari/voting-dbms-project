
import React from 'react';
import { SearchIcon, BellIcon } from './icons';

interface HeaderProps {
    children?: React.ReactNode;
    title: string;
}

const Header: React.FC<HeaderProps> = ({ children, title }) => {
  return (
    <header className="bg-white shadow-sm z-10">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center">
          {children}
          <h1 className="text-2xl font-semibold text-primary hidden sm:block ml-4">{title}</h1>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative hidden md:block">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </span>
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 border rounded-full bg-light-bg focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="Search..."
            />
          </div>

          <button className="p-2 text-secondary rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent">
            <BellIcon className="h-6 w-6" />
          </button>

          <div className="relative">
            <button className="flex items-center space-x-2">
                <img
                    className="h-9 w-9 rounded-full object-cover"
                    src="https://picsum.photos/100/100"
                    alt="User profile"
                />
                 <div className="hidden lg:block text-left">
                    <p className="text-sm font-medium text-primary">Admin User</p>
                    <p className="text-xs text-secondary">Super Admin</p>
                </div>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
