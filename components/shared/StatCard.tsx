import React from 'react';

interface StatCardProps {
    icon: React.ReactNode;
    title: string;
    value: string;
}

export const StatCard: React.FC<StatCardProps> = ({ icon, title, value }) => (
    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 flex items-center">
        <div className="bg-blue-100 text-blue-600 rounded-full p-4 mr-5">
            {icon}
        </div>
        <div>
            <p className="text-sm text-slate-500 font-medium">{title}</p>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
    </div>
);
