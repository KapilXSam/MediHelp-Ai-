import React, { useState, useEffect } from 'react';
import { Profile, Role } from '../../types';
import { StatCard } from '../shared/StatCard';
import { UserIcon } from '../icons/UserIcon';
import { DoctorIcon } from '../icons/DoctorIcon';
import { HistoryIcon } from '../icons/HistoryIcon';
import { AdminIcon } from '../icons/AdminIcon';
import { supabase } from '../../services/supabaseClient';
import LoadingSpinner from '../LoadingSpinner';

interface AdminDashboardProps {
  admin: Profile;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ admin }) => {
  const [stats, setStats] = useState({ patients: 0, doctors: 0, triages: 0 });
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      setLoading(true);

      // Fetch counts
      const { data: profiles, error: profilesError } = await supabase.from('profiles').select('id, role');
      const { count: triageCount, error: triageError } = await supabase.from('triage_sessions').select('*', { count: 'exact', head: true });

      if (profilesError || triageError) {
        console.error(profilesError || triageError);
      } else {
        const patientCount = profiles.filter(p => p.role === Role.PATIENT).length;
        const doctorCount = profiles.filter(p => p.role === Role.DOCTOR).length;
        setStats({ patients: patientCount, doctors: doctorCount, triages: triageCount || 0 });
        setUsers(profiles);
      }
      setLoading(false);
    };

    fetchAdminData();
  }, []);

  const handleManageUser = (action: string, userName: string) => {
    alert(`This is a UI simulation. Action: ${action} user "${userName}". A real implementation would require Supabase Edge Functions for secure user management.`);
  };

  return (
    <div className="p-8 bg-slate-50 h-full overflow-y-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800">Administrator Dashboard</h2>
        <p className="text-slate-500">System overview and management panel.</p>
      </div>
      
      {loading ? <div className="flex justify-center items-center h-64"><LoadingSpinner/></div> : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard icon={<AdminIcon />} title="Welcome" value={admin.name} />
            <StatCard icon={<UserIcon />} title="Total Patients" value={stats.patients.toString()} />
            <StatCard icon={<DoctorIcon />} title="Total Doctors" value={stats.doctors.toString()} />
            <StatCard icon={<HistoryIcon />} title="Total Triages" value={stats.triages.toString()} />
          </div>

          {/* Management Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <UserManagementPanel 
                title="Manage Doctors" 
                users={users.filter(u => u.role === Role.DOCTOR)} 
                onManageUser={handleManageUser} 
            />
            <UserManagementPanel 
                title="Manage Patients" 
                users={users.filter(u => u.role === Role.PATIENT)} 
                onManageUser={handleManageUser}
            />
          </div>
        </>
      )}
    </div>
  );
};

interface UserManagementPanelProps {
    title: string;
    users: Profile[];
    onManageUser: (action: string, userName: string) => void;
}

const UserManagementPanel: React.FC<UserManagementPanelProps> = ({ title, users, onManageUser }) => (
    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-slate-800">{title}</h3>
            <button 
                onClick={() => onManageUser('Add new', title.slice(7, -1))}
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
            >
                + Add New
            </button>
        </div>
        <div className="space-y-3 max-h-96 overflow-y-auto">
            {users.map(user => (
                <div key={user.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <div>
                        <p className="font-semibold text-slate-700">{user.name}</p>
                        <p className="text-sm text-slate-500">{user.details}</p>
                    </div>
                    <div>
                        <button onClick={() => onManageUser('Edit', user.name)} className="text-sm font-medium text-blue-600 hover:text-blue-800 mr-4">Edit</button>
                        <button onClick={() => onManageUser('Remove', user.name)} className="text-sm font-medium text-red-600 hover:text-red-800">Remove</button>
                    </div>
                </div>
            ))}
        </div>
    </div>
)

export default AdminDashboard;