import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
  description: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, color, description }) => {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3.5 rounded-xl ${colorClasses[color] || 'bg-gray-50'} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
          <Icon className="w-6 h-6" />
        </div>
        <span className="text-3xl font-bold text-slate-800 tracking-tight">{value}</span>
      </div>
      <div>
        <h3 className="text-slate-600 font-semibold text-sm mb-1">{title}</h3>
        <p className="text-xs text-slate-400 font-medium">{description}</p>
      </div>
    </div>

  );
};

export default StatsCard;