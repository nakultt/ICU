import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setUserId, setUserRole } from '../api';
import { Heart, Stethoscope, Users } from 'lucide-react';

export default function Landing() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleIdentify = async (role: 'nurse' | 'family') => {
    setLoading(true);
    try {
      const email = role === 'nurse' ? 'nurse@hospital.com' : 'family@guest.com';
      const name = role === 'nurse' ? 'Nurse Priya' : 'Guest Family';
      const user = await api.identify({ email, full_name: name, role });
      setUserId(user.id);
      setUserRole(user.role);
      navigate(role === 'nurse' ? '/nurse' : '/family');
    } catch (err) {
      alert("Failed to connect to backend. Is it running?");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full text-center space-y-8 bg-white p-10 rounded-3xl shadow-2xl border border-white/50 backdrop-blur-sm">
        <div className="space-y-2">
          <div className="inline-flex items-center justify-center p-4 bg-blue-100 rounded-2xl mb-4">
            <Heart className="w-12 h-12 text-blue-600 animate-pulse" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">VisiCare</h1>
          <p className="text-gray-500 text-lg">Virtual ICU Visitation Platform</p>
        </div>

        <div className="grid gap-4 pt-4">
          <button
            onClick={() => handleIdentify('nurse')}
            disabled={loading}
            className="group flex items-center justify-between p-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition-all shadow-lg hover:shadow-blue-200 active:scale-95 disabled:opacity-50"
          >
            <div className="flex items-center gap-4 text-left">
              <Stethoscope className="w-8 h-8 group-hover:rotate-12 transition-transform" />
              <div>
                <div className="font-bold text-lg">Hospital Staff</div>
                <div className="text-blue-100 text-sm">Manage patients & visits</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleIdentify('family')}
            disabled={loading}
            className="group flex items-center justify-between p-6 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-100 rounded-2xl transition-all shadow-sm hover:shadow-md active:scale-95 disabled:opacity-50"
          >
            <div className="flex items-center gap-4 text-left">
              <Users className="w-8 h-8 text-blue-600 group-hover:scale-110 transition-transform" />
              <div>
                <div className="font-bold text-lg">Family Member</div>
                <div className="text-gray-500 text-sm">Visit your loved ones</div>
              </div>
            </div>
          </button>
        </div>

        <p className="text-xs text-gray-400 pt-6">
          Hackathon Edition • Fast, Secure, & Emotional Connection
        </p>
      </div>
    </div>
  );
}
