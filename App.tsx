import React, { useState, useEffect, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { AppView, Role, Profile, TriageSession } from './types';
import ChatWindow from './components/ChatWindow';
import Disclaimer from './components/Disclaimer';
import AuthScreen from './components/auth/AuthScreen';
import PatientDashboard from './components/patient/PatientDashboard';
import DoctorDashboard from './components/doctor/DoctorDashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import { supabase } from './services/supabaseClient';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async (user: any) => {
      if (!user) {
        setProfile(null);
        return;
      }
      // Fetch profile without .single() to handle cases where the profile might not exist yet
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id);

      if (error) {
        // Log the actual error message instead of the object
        console.error('Error fetching profile:', error.message);
        setProfile(null);
      } else if (profiles && profiles.length > 0) {
        // Profile found, set it
        setProfile(profiles[0]);
      } else {
        // User exists in auth, but no profile found in the table. This can happen with a delay after signup.
        console.warn(`No profile found for user ID: ${user.id}. The user might need to complete sign-up or there could be a replication delay.`);
        setProfile(null);
      }
    };

    // Fetch initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      fetchUserProfile(session?.user).finally(() => setLoading(false));
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      fetchUserProfile(session?.user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleTriageComplete = useCallback(async (summary: string, chatHistory: { role: 'user' | 'model'; text: string }[]) => {
    if (profile && profile.role === Role.PATIENT) {
      const newTriage: Omit<TriageSession, 'id' | 'created_at' | 'doctor_notes'> = {
        patient_id: profile.id,
        summary,
        chat_history: chatHistory,
      };

      const { error } = await supabase.from('triage_sessions').insert([newTriage]);
      if (error) {
        alert('Could not save triage session. Please try again.');
        console.error('Error inserting triage:', error);
      } else {
        setCurrentView(AppView.DASHBOARD);
      }
    }
  }, [profile]);
  
  const handleStartNewTriage = useCallback(() => {
    setCurrentView(AppView.TRIAGE);
  }, []);
  
  if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-xl font-semibold">Loading MediHelp AI...</div>
        </div>
      );
  }

  const renderHeader = () => (
    <header className="flex items-center justify-between mb-4 p-2 w-full">
      <div className="flex items-center space-x-3">
        <div className="bg-blue-600 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
        </div>
        <h1 className="text-3xl font-bold text-slate-800">MediHelp AI</h1>
      </div>
      {profile && (
        <div className="flex items-center space-x-4">
          <span className="text-slate-600 hidden sm:block">Welcome, <span className="font-bold">{profile.name}</span> ({profile.role})</span>
          <button onClick={handleLogout} className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 px-4 rounded-lg transition-colors duration-200">
            Logout
          </button>
        </div>
      )}
    </header>
  );

  const renderPatientView = () => {
    if (!profile) return null;

    if (currentView === AppView.TRIAGE) {
      return <ChatWindow onTriageComplete={handleTriageComplete} />;
    }
    return <PatientDashboard 
              user={profile} 
              onStartNewTriage={handleStartNewTriage} 
           />;
  };
  
  const renderViewForRole = () => {
    if (!session || !profile) {
      return <AuthScreen />;
    }
    
    switch (profile.role) {
      case Role.PATIENT:
        return renderPatientView();
      case Role.DOCTOR:
        return <DoctorDashboard doctor={profile} />;
      case Role.ADMIN:
        return <AdminDashboard admin={profile} />;
      default:
        return <AuthScreen />;
    }
  };

  return (
    <div className="bg-slate-100 min-h-screen font-sans text-slate-900 flex flex-col items-center p-4">
      <div className="w-full max-w-7xl mx-auto flex flex-col h-full">
        {renderHeader()}
        
        <main className="flex-grow bg-white rounded-2xl shadow-lg border border-slate-200 flex flex-col overflow-hidden">
          {renderViewForRole()}
        </main>
        
        <footer className="w-full text-center mt-6">
          {profile?.role === Role.PATIENT && <Disclaimer />}
          <p className="text-xs text-slate-500 mt-4">
            © 2024 MediHelp. All Rights Reserved. This is a conceptual application.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default App;