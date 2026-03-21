import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, getUserRole } from '../api';
import DailyIframe from '@daily-co/daily-js';
import { Mic, MicOff, Video as VideoIcon, VideoOff, MessageSquare, PhoneOff, Heart } from 'lucide-react';

export default function VisitRoom() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [callFrame, setCallFrame] = useState<any>(null);
  const [showMood, setShowMood] = useState(false);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);

  useEffect(() => {
    const loadAndStart = async () => {
      try {
        if (!id) return;
        const found = await api.visits.getById(id);
        if (!found || !found.room_url) {
          alert(`Visit error: ${!found ? 'NotFound' : 'NoRoomUrl'}`);
          navigate('/');
          return;
        }

        // Daily.co integration
        const frame = DailyIframe.createFrame(
          document.getElementById('video-container') as HTMLElement,
          {
            iframeStyle: {
              width: '100%',
              height: '100%',
              border: '0',
              borderRadius: '24px',
            },
            showLeaveButton: false,
            showFullscreenButton: true,
          }
        );

        await frame.join({ url: found.room_url });
        setCallFrame(frame);

      } catch (err) {
        console.error(err);
        navigate('/');
      }
    };
    loadAndStart();

    return () => {
      if (callFrame) callFrame.destroy();
    };
  }, [id, navigate]); // callFrame is handled via cleanup

  const handleEnd = useCallback(async () => {
    if (callFrame) await callFrame.leave();
    setShowMood(true);
  }, [callFrame]);

  const handleMood = async (score: number) => {
    if (id) await api.visits.logMood(id, score);
    navigate(getUserRole() === 'nurse' ? '/nurse' : '/family');
  };

  const toggleMic = () => {
    if (!callFrame) return;
    callFrame.setLocalAudio(muted);
    setMuted(!muted);
  };

  const toggleVideo = () => {
    if (!callFrame) return;
    callFrame.setLocalVideo(videoOff);
    setVideoOff(!videoOff);
  };

  return (
    <div className="fixed inset-0 bg-gray-950 flex flex-col p-4 sm:p-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 z-10 px-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white ring-4 ring-blue-900/20">
            <Heart className="w-5 h-5" />
          </div>
          <div>
             <h3 className="text-white font-bold leading-tight">Live Visit Session</h3>
             <p className="text-blue-400 text-xs tracking-widest uppercase font-black">Encrypted • Secure</p>
          </div>
        </div>
        <div className="bg-red-500 text-white px-3 py-1 rounded-lg text-xs font-black animate-pulse">LIVE</div>
      </div>

      {/* Video Container */}
      <div className="flex-1 min-h-0 bg-gray-900 rounded-[2rem] relative shadow-2xl overflow-hidden">
        <div id="video-container" className="w-full h-full" />
      </div>

      {/* Controls Bar */}
      <div className="py-6 flex justify-center items-center gap-4 sm:gap-6 z-10">
        <button 
          onClick={toggleMic}
          className={`p-5 rounded-3xl transition-all active:scale-95 ${muted ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
        >
          {muted ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
        </button>
        <button 
          onClick={toggleVideo}
          className={`p-5 rounded-3xl transition-all active:scale-95 ${videoOff ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
        >
          {videoOff ? <VideoOff className="w-7 h-7" /> : <VideoIcon className="w-7 h-7" />}
        </button>
        <button className="p-5 bg-gray-800 text-gray-300 hover:bg-gray-700 rounded-3xl transition-all active:scale-95">
          <MessageSquare className="w-7 h-7" />
        </button>
        <button 
          onClick={handleEnd}
          className="p-5 bg-red-600 text-white hover:bg-red-700 rounded-3xl transition-all shadow-2xl shadow-red-600/30 active:scale-90"
        >
          <PhoneOff className="w-7 h-7" />
        </button>
      </div>

      {/* Mood Overlay */}
      {showMood && (
        <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-xl flex items-center justify-center p-6 z-[60]">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 text-center space-y-8 shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-gray-900">How do you feel?</h2>
              <p className="text-gray-500">Your connection helps the recovery process.</p>
            </div>
            
        <div className="flex justify-between items-center px-4 gap-4">
          {[1, 2, 3, 4, 5].map(score => (
            <button 
              key={score}
              onClick={() => handleMood(score)}
              className="group flex flex-col items-center gap-3"
            >
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-4xl group-hover:scale-125 group-hover:bg-blue-600/20 group-hover:shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all active:scale-90 border border-white/5">
                {['😢', '😟', '😐', '😊', '🥰'][score-1]}
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-gray-500 group-hover:text-blue-400 transition-colors">
                {['Poor', 'Fair', 'Good', 'Great', 'Amazing'][score-1]}
              </span>
            </button>
          ))}
        </div>

            <button onClick={() => navigate('/')} className="w-full py-4 text-gray-400 font-bold hover:text-gray-600 transition-colors">Skip for now</button>
          </div>
        </div>
      )}
    </div>
  );
}
