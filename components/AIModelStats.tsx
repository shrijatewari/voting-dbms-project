
import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

const confidenceData = [
    { name: '<50%', value: 5, color: '#dc2626' },
    { name: '50-70%', value: 15, color: '#f59e0b' },
    { name: '70-90%', value: 45, color: '#0ea5e9' },
    { name: '>90%', value: 35, color: '#059669' },
];

const AIModelStats: React.FC = () => {
    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-semibold text-primary mb-4">AI Model Performance</h3>
            <div className="grid grid-cols-2 gap-4 text-center mb-4">
                <div className="bg-light-bg p-3 rounded-lg">
                    <p className="text-sm text-secondary">Accuracy</p>
                    <p className="text-2xl font-bold text-success">92.8%</p>
                </div>
                <div className="bg-light-bg p-3 rounded-lg">
                    <p className="text-sm text-secondary">Model Version</p>
                    <p className="text-2xl font-bold text-primary">v2.1.3</p>
                </div>
            </div>
            
            <div>
                <h4 className="text-md font-semibold text-primary mb-2 text-center">Confidence Distribution</h4>
                 <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={confidenceData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} />
                            <YAxis tick={{ fontSize: 11, fill: '#475569' }} />
                            <Tooltip
                                cursor={{ fill: 'rgba(240, 240, 240, 0.5)' }}
                                contentStyle={{ 
                                    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                                    border: '1px solid #e0e0e0', 
                                    borderRadius: '0.5rem' 
                                }}
                            />
                            <Bar dataKey="value" name="Anomalies (%)" radius={[4, 4, 0, 0]}>
                                {confidenceData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default AIModelStats;
