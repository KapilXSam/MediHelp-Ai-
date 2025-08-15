import React, { useState, useMemo, useEffect } from 'react';
import { Profile, Role } from '../../types';
import PatientDetailView from './PatientDetailView';
import { DoctorIcon } from '../icons/DoctorIcon';
import { supabase } from '../../services/supabaseClient';
import LoadingSpinner from '../LoadingSpinner';

interface DoctorDashboardProps {
  doctor: Profile;
}

const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ doctor }) => {
  const [selectedPatient, setSelectedPatient] = useState<Profile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', Role.PATIENT);
      
      if (error) {
        console.error("Error fetching patients:", error);
      } else if (data) {
        setPatients(data);
      }
      setLoading(false);
    };
    fetchPatients();
  }, []);
  
  const filteredPatients = useMemo(() => 
    patients.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
  , [patients, searchTerm]);

  const handleSelectPatient = (patient: Profile) => {
    setSelectedPatient(patient);
  };

  if (selectedPatient) {
    return <PatientDetailView patient={selectedPatient} onBack={() => setSelectedPatient(null)} />;
  }

  return (
    <div className="flex h-full bg-slate-50">
      {/* Sidebar Patient List */}
      <div className="w-1/3 border-r border-slate-200 h-full flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">My Patients ({filteredPatients.length})</h2>
          <div className="mt-4">
            <input 
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        {loading ? <div className="flex-grow flex items-center justify-center"><LoadingSpinner/></div> : (
          <ul className="overflow-y-auto flex-grow">
            {filteredPatients.map(patient => (
              <li key={patient.id}>
                <button 
                  onClick={() => handleSelectPatient(patient)}
                  className="w-full text-left p-4 hover:bg-blue-50 focus:bg-blue-100 focus:outline-none transition-colors duration-150"
                >
                  <p className="font-semibold text-slate-700">{patient.name}</p>
                  <p className="text-sm text-slate-500">{patient.details}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Main Content Area */}
      <div className="w-2/3 p-10 flex flex-col items-center justify-center text-center">
          <DoctorIcon className="h-24 w-24 text-slate-300 mb-4" />
          <h2 className="text-2xl font-bold text-slate-700">Doctor Dashboard</h2>
          <p className="text-slate-500 mt-2 max-w-md">Select a patient from the list on the left to view their triage history and consultation notes.</p>
      </div>
    </div>
  );
};

export default DoctorDashboard;