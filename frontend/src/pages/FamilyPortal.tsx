import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Video, Calendar, Plus, Heart, MessageSquare, ArrowRight, Activity, Users, Search, ChevronsLeft, ChevronsRight } from 'lucide-react';

type Patient = {
  id: string;
  full_name: string;
  bed_number: string;
  status_note: string;
  current_status: string;
};

type Visit = {
  id: string;
  patient_id: string;
  status: string;
  scheduled_date: string;
  scheduled_time: string;
};

const PATIENTS_PER_PAGE = 6;

export default function FamilyPortal() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [accessCode, setAccessCode] = useState('');
  const [showLink, setShowLink] = useState(false);
  const [showBook, setShowBook] = useState<{id: string, name: string} | null>(null);
  const [bookData, setBookData] = useState({ date: '', time: '' });
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'stable' | 'critical'>('all');
  const [patientPage, setPatientPage] = useState(1);

  const load = React.useCallback(async () => {
    try {
      const p = await api.patients.list();
      const v = await api.visits.list();
      setPatients(p);
      setVisits(v);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void load();
    }, 0);
    // Poll every 5 seconds so incoming calls from nurse show up
    const interval = window.setInterval(() => {
      void load();
    }, 5000);
    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, [load]);

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.patients.link(accessCode, 'Family');
      setAccessCode('');
      setShowLink(false);
      void load();
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
    void load();
  };

  const handleInstantCall = async (patientId: string) => {
    try {
      const visit = await api.visits.instant(patientId);
      navigate(`/visit/${visit.id}`);
    } catch (err) { alert(err); }
  };

  // Find the most recent approved visit as the "incoming call"
  const approvedVisits = visits.filter((v) => v.status === 'approved');
  const incomingCall = approvedVisits.length > 0 ? approvedVisits[approvedVisits.length - 1] : null;

  const filteredPatients = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    let result = patients;

    if (normalizedQuery) {
      result = result.filter((p) =>
        p.full_name.toLowerCase().includes(normalizedQuery) ||
        p.bed_number.toLowerCase().includes(normalizedQuery),
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((p) => p.current_status.toLowerCase() === statusFilter);
    }

    return [...result].sort((a, b) => a.full_name.localeCompare(b.full_name));
  }, [patients, query, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / PATIENTS_PER_PAGE));
  const currentPage = Math.min(patientPage, totalPages);

  const paginatedPatients = useMemo(() => {
    const start = (currentPage - 1) * PATIENTS_PER_PAGE;
    return filteredPatients.slice(start, start + PATIENTS_PER_PAGE);
  }, [filteredPatients, currentPage]);

  const statusCounts = useMemo(() => {
    const stable = patients.filter((p) => p.current_status.toLowerCase() === 'stable').length;
    const critical = patients.filter((p) => p.current_status.toLowerCase() === 'critical').length;
    return { stable, critical, total: patients.length };
  }, [patients]);

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl space-y-8 px-4 py-6 md:px-6 lg:px-8">
      {/* Incoming Call Banner */}
      {incomingCall && (
        <div className="surface-elevated flex items-center justify-between rounded-2xl border-l-4 border-l-cyan-500 p-5 text-slate-900">
          <div className="flex items-center gap-4">
            <div className="brand-gradient flex h-12 w-12 items-center justify-center rounded-full">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <div className="text-lg font-black">Incoming Video Call</div>
              <div className="text-sm text-slate-600">
                {patients.find((p) => p.id === incomingCall.patient_id)?.full_name || 'Patient'} — tap to join now
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate(`/visit/${incomingCall.id}`)}
            className="surface-elevated brand-heading px-6 py-3 rounded-xl font-black text-lg transition-all active:scale-95"
          >
            Join Call
          </button>
        </div>
      )}

      <header className="surface-elevated flex items-center justify-between rounded-3xl px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="brand-gradient p-2 rounded-xl text-white shadow-lg shadow-cyan-200">
            <Heart className="w-6 h-6" />
          </div>
          <h1 className="brand-heading text-2xl font-black tracking-tight">VisiCare Family</h1>
        </div>
        <button 
          onClick={() => setShowLink(true)}
          className="surface-elevated flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-gray-700 shadow-sm transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" /> Link Patient
        </button>
      </header>

      {patients.length === 0 ? (
        <div className="surface-elevated flex flex-col items-center justify-center space-y-4 rounded-3xl border-2 border-dashed p-12 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
            <Users className="w-10 h-10 text-gray-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">No linked patients yet</h2>
            <p className="text-gray-500 max-w-xs mx-auto">Enter the 6-digit access code provided by the ICU nurse to link your family member.</p>
          </div>
          <button onClick={() => setShowLink(true)} className="action-primary px-8 py-3 rounded-2xl font-bold">Link Now</button>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Patient Cards */}
          <section className="space-y-6">
            <div className="flex flex-col gap-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-gray-800 px-2 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-500" /> My Family Members
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">Total {statusCounts.total}</span>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">Stable {statusCounts.stable}</span>
                  <span className="rounded-full bg-rose-100 px-3 py-1 text-rose-700">Critical {statusCounts.critical}</span>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2">
                  <Search className="h-4 w-4 text-gray-400" />
                  <input
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setPatientPage(1);
                    }}
                    placeholder="Search by name or bed"
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as 'all' | 'stable' | 'critical');
                    setPatientPage(1);
                  }}
                  className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 outline-none"
                >
                  <option value="all">All status</option>
                  <option value="stable">Stable</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              {paginatedPatients.map(p => (
                <div key={p.id} className="surface-elevated p-6 rounded-3xl flex flex-col justify-between gap-5 group">
                  <div className="space-y-2">
                    <div className="inline-flex px-3 py-1 bg-green-50 text-green-700 text-xs font-black uppercase tracking-widest rounded-full mb-1">
                      {p.current_status}
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 leading-none">{p.full_name}</h3>
                    <div className="text-gray-500 text-base flex items-center gap-2">
                       Bed {p.bed_number} • <span className="text-sm italic">"{p.status_note}"</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button 
                      onClick={() => handleInstantCall(p.id)}
                      className="action-primary inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-bold active:scale-95"
                    >
                      <Video className="w-5 h-5" /> Start Instant Call
                    </button>
                    <button 
                      onClick={() => setShowBook({id: p.id, name: p.full_name})}
                      className="surface-elevated inline-flex items-center gap-2 text-gray-700 px-5 py-3 rounded-2xl font-bold transition-all active:scale-95"
                    >
                      <Calendar className="w-5 h-5" /> Schedule Visit
                    </button>
                    <button className="p-3 bg-white border-2 border-gray-100 text-gray-400 rounded-2xl hover:bg-gray-50 hover:text-blue-600 transition-all">
                      <MessageSquare className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredPatients.length === 0 && (
              <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
                No patients match your search and filter.
              </div>
            )}

            {filteredPatients.length > PATIENTS_PER_PAGE && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm">
                <span className="font-semibold text-gray-600">
                  Showing {(currentPage - 1) * PATIENTS_PER_PAGE + 1} to {Math.min(currentPage * PATIENTS_PER_PAGE, filteredPatients.length)} of {filteredPatients.length}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPatientPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-1.5 font-semibold text-gray-700 disabled:opacity-40"
                  >
                    <ChevronsLeft className="h-4 w-4" /> Prev
                  </button>
                  <span className="rounded-xl bg-slate-100 px-3 py-1.5 font-bold text-slate-700">Page {currentPage} / {totalPages}</span>
                  <button
                    type="button"
                    onClick={() => setPatientPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-1.5 font-semibold text-gray-700 disabled:opacity-40"
                  >
                    Next <ChevronsRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
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
                    <button onClick={() => navigate(`/visit/${v.id}`)} className="action-primary inline-flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all group active:scale-95">
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
                <button type="submit" className="action-primary px-8 py-3 font-bold rounded-2xl">Link Patient</button>
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
                <button type="submit" className="action-primary px-8 py-3 font-bold rounded-2xl">Request Visit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
