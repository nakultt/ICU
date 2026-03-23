import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, getUserRole } from '../api';
import { useVideoCall } from '../hooks/useVideoCall';
import { Mic, MicOff, Video as VideoIcon, VideoOff, MessageSquare, PhoneOff, Heart } from 'lucide-react';

export default function VisitRoom() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showMood, setShowMood] = useState(false);

  const role = getUserRole() || 'family';
  const peerId = `${role}-${id}`;


  const {
    localVideoRef,
    remoteVideoRef,
    status,
    isMuted,
    isVideoOff,

    endCall,
    toggleMic,
    toggleVideo,
  } = useVideoCall({
    roomId: id || '',
    peerId,
    autoStart: role === 'nurse', // Nurse auto-initiates
  });

  // If family joins and the nurse is already waiting, start the call
  useEffect(() => {
    if (role === 'family' && status === 'waiting') {
      // Family will receive the offer from nurse — handled by hook automatically
    }
  }, [role, status]);

  const handleEnd = useCallback(async () => {
    endCall();
    // Mark the visit as completed so it doesn't show as incoming call anymore
    if (id) {
      try { await api.visits.complete(id); } catch (e) { console.warn(e); }
    }
    setShowMood(true);
  }, [endCall, id]);

  const handleMood = async (score: number) => {
    if (id) await api.visits.logMood(id, score);
    navigate(role === 'nurse' ? '/nurse' : '/family');
  };

  const statusLabel = {
    idle: 'Initializing...',
    connecting: 'Connecting...',
    waiting: 'Waiting for other person to join...',
    incoming: 'Incoming call...',
    connected: '',
    ended: 'Call ended',
  }[status];

  const roomCode = (id || '').slice(0, 8).toUpperCase();

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
             <p className="text-blue-400 text-xs tracking-widest uppercase font-black">WebRTC • Peer-to-Peer</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Room Code — same on both sides so users can verify */}
          <div className="bg-gray-800 border border-gray-700 px-3 py-1.5 rounded-lg">
            <span className="text-gray-500 text-xs font-bold mr-1">Room:</span>
            <span className="text-white font-mono text-sm font-black tracking-wider">{roomCode}</span>
          </div>
          {status === 'connected' && (
            <div className="bg-red-500 text-white px-3 py-1 rounded-lg text-xs font-black animate-pulse">LIVE</div>
          )}
          {statusLabel && (
            <div className="text-gray-400 text-sm font-medium">{statusLabel}</div>
          )}
        </div>
      </div>

      {/* Video Container */}
      <div className="flex-1 min-h-0 relative">
        {/* Remote video (large) */}
        <div className="w-full h-full bg-gray-900 rounded-[2rem] shadow-2xl overflow-hidden">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {status !== 'connected' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto bg-gray-800 rounded-full flex items-center justify-center">
                  <VideoIcon className="w-10 h-10 text-gray-600" />
                </div>
                <p className="text-gray-500 text-lg font-medium">
                  {status === 'waiting' ? 'Waiting for the other person...' : 'Connecting...'}
                </p>
                <div className="flex justify-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Local video (small overlay) */}
        <div className="absolute bottom-4 right-4 w-40 h-28 sm:w-52 sm:h-36 bg-gray-800 rounded-2xl overflow-hidden shadow-2xl ring-2 ring-gray-700/50 z-10">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover mirror"
          />
          <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full font-bold">
            You
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="py-6 flex justify-center items-center gap-4 sm:gap-6 z-10">
        <button 
          onClick={toggleMic}
          className={`p-5 rounded-3xl transition-all active:scale-95 ${isMuted ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
        >
          {isMuted ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
        </button>
        <button 
          onClick={toggleVideo}
          className={`p-5 rounded-3xl transition-all active:scale-95 ${isVideoOff ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
        >
          {isVideoOff ? <VideoOff className="w-7 h-7" /> : <VideoIcon className="w-7 h-7" />}
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

      {/* Mirror CSS for local video */}
      <style>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
}
