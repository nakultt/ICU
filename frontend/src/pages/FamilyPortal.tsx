import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Video, Calendar, Plus, Heart, MessageSquare, ArrowRight, Activity, Users } from 'lucide-react';

export default function FamilyPortal() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [accessCode, setAccessCode] = useState('');
  const [showLink, setShowLink] = useState(false);
  const [showBook, setShowBook] = useState<{id: string, name: string} | null>(null);
  const [bookData, setBookData] = useState({ date: '', time: '' });

  const load = React.useCallback(async () => {
    try {
      const p = await api.patients.list();
      const v = await api.visits.list();
      setPatients(p);
      setVisits(v);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    load();
    // Poll every 5 seconds so incoming calls from nurse show up
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.patients.link(accessCode, 'Family');
      setAccessCode('');
      setShowLink(false);
      load();
    } catch (err) { alert(err); }
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showBook) return;
    await api.visits.create({
      patient_id: showBook.id,
      scheduled_date: bookData.date,
      scheduled_time: bookData.time
    });
    setShowBook(null);
    load();
  };

  const handleInstantCall = async (patientId: string) => {
    try {
      const visit = await api.visits.instant(patientId);
      navigate(`/visit/${visit.id}`);
    } catch (err) { alert(err); }
  };

  // Find the most recent approved visit as the "incoming call"
  const approvedVisits = visits.filter((v: any) => v.status === 'approved');
  const incomingCall = approvedVisits.length > 0 ? approvedVisits[approvedVisits.length - 1] : null;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-10 min-h-screen">
      {/* Incoming Call Banner */}
      {incomingCall && (
        <div className="bg-green-500 text-white p-5 rounded-2xl shadow-xl shadow-green-200 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <div className="font-black text-lg">📞 Incoming Video Call</div>
              <div className="text-green-100 text-sm">
                {patients.find((p: any) => p.id === incomingCall.patient_id)?.full_name || 'Patient'} — tap to join now
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate(`/visit/${incomingCall.id}`)}
            className="bg-white text-green-600 px-6 py-3 rounded-xl font-black text-lg shadow-lg hover:bg-green-50 transition-all active:scale-95"
          >
            Join Call
          </button>
        </div>
      )}

      <header className="flex items-center justify-between py-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-200">
            <Heart className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">VisiCare Family</h1>
        </div>
        <button 
          onClick={() => setShowLink(true)}
          className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" /> Link Patient
        </button>
      </header>

      {patients.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
            <Users className="w-10 h-10 text-gray-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">No linked patients yet</h2>
            <p className="text-gray-500 max-w-xs mx-auto">Enter the 6-digit access code provided by the ICU nurse to link your family member.</p>
          </div>
          <button onClick={() => setShowLink(true)} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-blue-100">Link Now</button>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Patient Cards */}
          <section className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800 px-2 flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-500" /> My Family Members
            </h2>
            <div className="grid gap-6">
              {patients.map(p => (
                <div key={p.id} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                  <div className="space-y-2">
                    <div className="inline-flex px-3 py-1 bg-green-50 text-green-700 text-xs font-black uppercase tracking-widest rounded-full mb-1">
                      {p.current_status}
                    </div>
                    <h3 className="text-3xl font-black text-gray-900 leading-none">{p.full_name}</h3>
                    <div className="text-gray-500 text-lg flex items-center gap-2">
                       Bed {p.bed_number} • <span className="text-sm italic">"{p.status_note}"</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button 
                      onClick={() => handleInstantCall(p.id)}
                      className="inline-flex items-center gap-2 bg-green-500 text-white px-6 py-4 rounded-2xl font-bold shadow-xl shadow-green-100 hover:bg-green-600 transition-all active:scale-95"
                    >
                      <Video className="w-5 h-5" /> Start Instant Call
                    </button>
                    <button 
                      onClick={() => setShowBook({id: p.id, name: p.full_name})}
                      className="inline-flex items-center gap-2 bg-white border-2 border-gray-100 text-gray-700 px-6 py-4 rounded-2xl font-bold hover:bg-gray-50 transition-all active:scale-95"
                    >
                      <Calendar className="w-5 h-5" /> Schedule Visit
                    </button>
                    <button className="p-4 bg-white border-2 border-gray-100 text-gray-400 rounded-2xl hover:bg-gray-50 hover:text-blue-600 transition-all">
                      <MessageSquare className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Visits Timeline */}
          <section className="space-y-6 pb-20">
            <h2 className="text-xl font-bold text-gray-800 px-2 flex items-center gap-2">
               Scheduled Visits
            </h2>
            <div className="space-y-4">
              {visits.map(v => (
                <div key={v.id} className="bg-white/50 backdrop-blur-sm p-5 rounded-2xl border border-gray-100 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${v.status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{patients.find(p => p.id === v.patient_id)?.full_name}</div>
                      <div className="text-sm text-gray-500">{v.scheduled_date} at {v.scheduled_time}</div>
                    </div>
                  </div>
                  {v.status === 'approved' ? (
                    <button onClick={() => navigate(`/visit/${v.id}`)} className="inline-flex items-center gap-2 bg-green-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-green-600 shadow-lg shadow-green-100 transition-all group active:scale-95">
                      Join Call <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  ) : (
                    <span className="text-xs font-black uppercase text-yellow-600 tracking-widest px-3 py-1 bg-yellow-50 rounded-full">Waiting for Approval</span>
                  )}
                </div>
              ))}
              {visits.length === 0 && <div className="text-center py-10 text-gray-400">No visits scheduled</div>}
            </div>
          </section>
        </div>
      )}

      {/* Modals */}
      {showLink && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-2xl font-bold mb-6">Link to Family Member</h3>
            <form onSubmit={handleLink} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-1">6-Digit Access Code</label>
                <input required maxLength={6} className="text-center text-4xl tracking-widest font-mono w-full bg-gray-50 border-0 rounded-2xl p-6 focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={accessCode} onChange={e => setAccessCode(e.target.value)} placeholder="000000" />
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setShowLink(false)} className="px-6 py-3 font-semibold text-gray-500">Cancel</button>
                <button type="submit" className="px-8 py-3 bg-blue-600 text-white font-bold rounded-2xl shadow-lg">Link Patient</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBook && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-2xl font-bold mb-2">Book Video Visit</h3>
            <p className="text-gray-500 mb-8">For {showBook.name}</p>
            <form onSubmit={handleBook} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-1">Date</label>
                  <input type="date" required className="w-full bg-gray-50 border-0 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={bookData.date} onChange={e => setBookData({...bookData, date: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-1">Time</label>
                  <input type="time" required className="w-full bg-gray-50 border-0 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={bookData.time} onChange={e => setBookData({...bookData, time: e.target.value})} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowBook(null)} className="px-6 py-3 font-semibold text-gray-500">Cancel</button>
                <button type="submit" className="px-8 py-3 bg-blue-600 text-white font-bold rounded-2xl shadow-lg">Request Visit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
