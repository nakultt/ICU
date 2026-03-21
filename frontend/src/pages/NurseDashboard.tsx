import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Plus, User, Calendar, ExternalLink, Activity, Info, Video } from 'lucide-react';

export default function NurseDashboard() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newPatient, setNewPatient] = useState({ full_name: '', bed_number: '', ward: 'ICU' });

  const load = React.useCallback(async () => {
    try {
      const p = await api.patients.list();
      const v = await api.visits.list();
      setPatients(p);
      setVisits(v);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.patients.create(newPatient);
    setShowAdd(false);
    load();
  };

  const handleApprove = async (id: string) => {
    await api.visits.approve(id);
    load();
  };

  const handleInstantCall = async (patientId: string) => {
    try {
      const visit = await api.visits.instant(patientId);
      navigate(`/visit/${visit.id}`);
    } catch (err) { alert(err); }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-full lg:w-72 bg-white border-r border-gray-200 p-6 space-y-8 shrink-0">
        <div className="flex items-center gap-2 px-2">
          <Activity className="w-8 h-8 text-blue-600" />
          <span className="text-xl font-bold tracking-tight">VisiCare</span>
        </div>
        <nav className="space-y-1">
          <button className="flex items-center gap-3 w-full p-4 bg-blue-50 text-blue-700 rounded-xl font-medium">
            <User className="w-5 h-5" /> Dashboard
          </button>
          <button className="flex items-center gap-3 w-full p-4 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
            <Info className="w-5 h-5" /> Help Center
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-10 space-y-10 overflow-auto">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ICU Bed Management</h1>
            <p className="text-gray-500">Monitor patients and approve virtual visitation requests.</p>
          </div>
          <button 
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-200 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" /> Add Patient
          </button>
        </header>

        <section className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {patients.map(p => (
            <div key={p.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 font-bold group-hover:scale-110 transition-transform">
                  {p.bed_number}
                </div>
                <div className="text-right">
                  <span className="text-xs uppercase tracking-widest font-bold text-gray-400">Access Code</span>
                  <div className="text-lg font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">{p.access_code}</div>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">{p.full_name}</h3>
              <p className="text-sm text-gray-500 mb-4">{p.ward} • {p.current_status}</p>
              <div className="flex items-center gap-2 mb-4">
                <button 
                  onClick={() => handleInstantCall(p.id)}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-green-100 transition-all active:scale-95"
                >
                  <Video className="w-4 h-4" /> Start Call
                </button>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-50 p-3 rounded-xl">
                <Calendar className="w-4 h-4" /> 
                {new Date(p.admission_date).toLocaleDateString()}
              </div>
            </div>
          ))}
        </section>

        <hr className="border-gray-200" />

        <section className="space-y-6 pb-12">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">Approved & Active Visits</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
             {visits.filter(v => v.status === 'approved').map(v => (
               <div key={v.id} className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold">{patients.find(p => p.id === v.patient_id)?.full_name}</div>
                      <div className="text-xs text-gray-400">{v.scheduled_date} @ {v.scheduled_time}</div>
                    </div>
                  </div>
                  <a 
                    href={`/visit/${v.id}`}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md shadow-blue-100"
                  >
                    Join Call <ExternalLink className="w-4 h-4" />
                  </a>
               </div>
             ))}
             {visits.filter(v => v.status === 'approved').length === 0 && (
               <div className="col-span-full py-8 text-center text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
                 No active visits at the moment
               </div>
             )}
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">Pending Visit Requests</h2>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="p-4 pl-10 text-xs font-black text-gray-400 uppercase tracking-widest">Patient</th>
                  <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest">Date / Time</th>
                  <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="p-4 pr-10 text-right text-xs font-black text-gray-400 uppercase tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {visits.filter(v => v.status === 'pending').map(v => (
                  <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 pl-10">
                      <div className="font-bold text-gray-900">{patients.find(p => p.id === v.patient_id)?.full_name}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-gray-600">{v.scheduled_date} at {v.scheduled_time}</div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 uppercase tracking-tighter">
                        Pending
                      </span>
                    </td>
                    <td className="p-4 pr-10 text-right">
                      <button 
                        onClick={() => handleApprove(v.id)}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-bold shadow-md shadow-green-100 transition-all active:scale-95"
                      >
                        Approve
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {visits.filter(v => v.status === 'pending').length === 0 && (
              <div className="p-10 text-center text-gray-400">No pending requests</div>
            )}
          </div>
        </section>
      </main>

      {/* Add Patient Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-2xl font-bold mb-6">Register New Patient</h3>
            <form onSubmit={handleCreatePatient} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-1">Patient Full Name</label>
                <input required className="w-full bg-gray-50 border-0 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={newPatient.full_name} onChange={e => setNewPatient({...newPatient, full_name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-1">Bed Number</label>
                  <input required className="w-full bg-gray-50 border-0 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={newPatient.bed_number} onChange={e => setNewPatient({...newPatient, bed_number: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-1">Ward</label>
                  <input required className="w-full bg-gray-50 border-0 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={newPatient.ward} onChange={e => setNewPatient({...newPatient, ward: e.target.value})} />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setShowAdd(false)} className="px-6 py-3 font-semibold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200">Create Patient</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
