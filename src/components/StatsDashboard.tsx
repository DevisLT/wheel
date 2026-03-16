import React from 'react';
import { GameResult, COLOR_MAP } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface StatsDashboardProps {
  history: GameResult[];
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ history }) => {
  const counts = history.reduce((acc, curr) => {
    acc[curr.color] = (acc[curr.color] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const data = [
    { name: 'Blue', value: counts.blue || 0, color: COLOR_MAP.blue.hex },
    { name: 'Red', value: counts.red || 0, color: COLOR_MAP.red.hex },
    { name: 'Green', value: counts.green || 0, color: COLOR_MAP.green.hex },
    { name: 'Yellow', value: counts.yellow || 0, color: COLOR_MAP.yellow.hex },
  ];

  const recent50 = history.slice(0, 50);
  const recentCounts = recent50.reduce((acc, curr) => {
    acc[curr.color] = (acc[curr.color] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const probabilityData = data.map(d => ({
    ...d,
    percent: history.length > 0 ? Math.round((recentCounts[d.name.toLowerCase()] || 0) / Math.min(history.length, 50) * 100) : 0
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
        <h3 className="text-xs font-mono text-white/40 uppercase tracking-widest mb-6">Frequency Distribution</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis dataKey="name" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
        <h3 className="text-xs font-mono text-white/40 uppercase tracking-widest mb-6">Rolling Probability (Last 50)</h3>
        <div className="space-y-4">
          {probabilityData.map((item) => (
            <div key={item.name} className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-white/60">{item.name}</span>
                <span className="text-white">{item.percent}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full transition-all duration-500" 
                  style={{ width: `${item.percent}%`, backgroundColor: item.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
