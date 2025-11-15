
import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { IChartData } from '../types';

interface RegistrationChartProps {
  data: IChartData[];
}

const RegistrationChart: React.FC<RegistrationChartProps> = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md h-96">
      <h3 className="text-xl font-semibold text-primary mb-4">Registration Trends</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis dataKey="month" angle={-35} textAnchor="end" height={60} interval={0} tick={{ fill: '#475569', fontSize: 12 }} />
          <YAxis tick={{ fill: '#475569', fontSize: 12 }} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.8)', 
              backdropFilter: 'blur(5px)',
              border: '1px solid #e0e0e0', 
              borderRadius: '0.5rem' 
            }}
          />
          <Legend wrapperStyle={{ paddingTop: '30px' }} />
          <Line type="monotone" dataKey="registrations" stroke="#1e3a8a" strokeWidth={3} activeDot={{ r: 8 }} dot={{ r: 4 }} name="New Voters"/>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RegistrationChart;
