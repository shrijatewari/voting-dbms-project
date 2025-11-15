
import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  change?: string;
  changeType?: 'increase' | 'decrease';
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, change, changeType, color }) => {
  const changeColor = changeType === 'increase' ? 'text-green-500' : 'text-red-500';
  
  return (
    <div className="bg-white p-6 rounded-xl shadow-md flex items-center justify-between hover:shadow-lg transition-shadow duration-300">
      <div>
        <p className="text-sm font-medium text-secondary uppercase">{title}</p>
        <p className="text-3xl font-bold text-primary mt-1">{value}</p>
        {change && (
          <div className="flex items-center mt-2 text-sm">
            <span className={changeColor}>{change}</span>
            <span className="text-gray-500 ml-1">vs last month</span>
          </div>
        )}
      </div>
      <div className={`p-4 rounded-full`} style={{ backgroundColor: `${color}20`}}>
        {icon}
      </div>
    </div>
  );
};

export default StatCard;
