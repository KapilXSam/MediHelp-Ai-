import React, { useState, useEffect } from 'react';
import { Profile, TriageSession } from '../../types';
import { BotIcon } from '../icons/BotIcon';
import { UserIcon } from '../icons/UserIcon';
import { supabase } from '../../services/supabaseClient';
import LoadingSpinner from '../LoadingSpinner';

interface PatientDetailViewProps {
  patient: Profile;
  onBack: () => void;
}

const PatientDetailView: React.FC<PatientDetailViewProps> = ({ patient, onBack }) => {
  const [triageHistory, setTriageHistory] = useState<TriageSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchTriageHistory = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('triage_sessions')
        .select('*')
        .eq('patient_id', patient.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching patient triage history:", error);
      } else if (data) {
        setTriageHistory(data as TriageSession[]);
        // Initialize local notes state with fetched notes
        const initialNotes = data.reduce((acc, triage) => {
            acc[triage.id] = triage.doctor_notes || '';
            return acc;
        }, {} as Record<string, string>);
        setNotes(initialNotes);
      }
      setLoading(false);
    };

    fetchTriageHistory();
  }, [patient.id]);

  const handleNoteChange = (triageId: string, text: string) => {
    setNotes(prev => ({...prev, [triageId]: text}));
  }

  const handleSaveNote = async (triageId: string) => {
    const noteContent = notes[triageId];
    const { error } = await supabase
      .from('triage_sessions')
      .update({ doctor_notes: noteContent })
      .eq('id', triageId);
    
    if (error) {
      alert(`Error saving note: ${error.message}`);
    } else {
      alert(`Note for Triage ID ${triageId} saved successfully!`);
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  }

  return (
    <div className="p-8 h-full overflow-y-auto bg-white">
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="mr-4 p-2 rounded-full hover:bg-slate-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{patient.name}</h2>
          <p className="text-slate-500">{patient.details}</p>
        </div>
      </div>
      
      <h3 className="text-xl font-semibold text-slate-700 mb-4 mt-8 border-b pb-2">Triage History</h3>
      
      {loading ? <div className="flex justify-center items-center h-64"><LoadingSpinner/></div> : (
        triageHistory.length > 0 ? (
          <div className="space-y-6">
            {triageHistory.map(triage => (
              <div key={triage.id} className="bg-slate-50 border border-slate-200 rounded-lg p-6">
                <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-slate-800">{triage.summary}</p>
                      <p className="text-sm text-slate-500">{formatDate(triage.created_at)}</p>
                    </div>
                </div>

                <div className="mt-4 bg-white p-4 rounded-md border max-h-64 overflow-y-auto space-y-3">
                   {triage.chat_history.map((msg, index) => (
                      <div key={index} className={`flex items-start gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'model' && <BotIcon />}
                        <div className={`max-w-lg p-2 rounded-lg text-sm ${msg.role === 'user' ? 'bg-blue-100 text-blue-900' : 'bg-slate-100 text-slate-800'}`}>
                          {msg.text}
                        </div>
                        {msg.role === 'user' && <UserIcon />}
                      </div>
                    ))}
                </div>

                <div className="mt-4">
                    <h4 className="font-semibold text-slate-600 mb-2">Doctor's Notes</h4>
                    <textarea
                      value={notes[triage.id] ?? ''}
                      onChange={(e) => handleNoteChange(triage.id, e.target.value)}
                      rows={3}
                      className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add your notes for this triage session..."
                    />
                    <button
                      onClick={() => handleSaveNote(triage.id)}
                      className="mt-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                    >
                      Save Note
                    </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-center py-10">No triage history available for this patient.</p>
        )
      )}
    </div>
  );
};

export default PatientDetailView;