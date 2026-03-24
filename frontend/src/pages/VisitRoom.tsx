import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, getUserRole } from '../api';
import { useVideoCall } from '../hooks/useVideoCall';
import { Mic, MicOff, Video as VideoIcon, VideoOff, MessageSquare, PhoneOff, Heart, Send, X, Volume2, VolumeX, AudioLines } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpeechToText } from '../hooks/useSpeechToText';

export default function VisitRoom() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showMood, setShowMood] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const role = getUserRole() || 'family';
  const peerId = `${role}-${id}`;

  const {
    localVideoRef,
    remoteVideoRef,
    status,
    isMuted,
    isVideoOff,
    messages,
    sendMessage,
    isTTSEnabled,
    toggleTTS,
    endCall,
    toggleMic,
    toggleVideo,
  } = useVideoCall({
    roomId: id || '',
    peerId,
    autoStart: role === 'nurse', // Nurse auto-initiates
  });

  const handleTranscript = useCallback((text: string) => {
    setChatInput((prev) => {
       const space = prev && !prev.endsWith(' ') ? ' ' : '';
       return prev + space + text;
    });
  }, []);

  const { isListening, toggleListening } = useSpeechToText(handleTranscript);

  // Auto-scroll chat when messages update
  useEffect(() => {
    if (showChat) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showChat]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      sendMessage(chatInput.trim());
      setChatInput('');
    }
  };

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
    navigate(role === 'nurse' ? '/admin' : '/family');
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
    <div className="fixed inset-0 bg-slate-950 flex flex-col p-4 sm:p-6 overflow-hidden app-grid-bg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 z-10 px-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white ring-4 ring-indigo-900/40 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            <Heart className="w-5 h-5 heartbeat" />
          </div>
          <div>
             <h3 className="text-white font-bold leading-tight">Live Visit Session</h3>
             <p className="text-indigo-400 text-xs tracking-widest uppercase font-black">WebRTC • Peer-to-Peer</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-800/80 border border-slate-700/50 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg">
            <span className="text-slate-400 text-xs font-bold mr-1">Room:</span>
            <span className="text-slate-100 font-mono text-sm font-black tracking-wider">{roomCode}</span>
          </div>
          {status === 'connected' && (
            <div className="bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/50 px-3 py-1 rounded-xl text-xs font-black animate-pulse flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" /> LIVE
            </div>
          )}
          {statusLabel && (
            <div className="text-slate-400 text-sm font-medium">{statusLabel}</div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 relative flex gap-4">
        {/* Video Container */}
        <div className={`flex-1 relative transition-all duration-300 ${showChat ? 'mr-0 lg:mr-[340px]' : ''}`}>
          {/* Remote video (large) */}
          <div className="w-full h-full glass-card !bg-slate-900/80 rounded-[2.5rem] shadow-2xl overflow-hidden relative border-slate-700/50">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {status !== 'connected' && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm z-10">
                <div className="text-center space-y-6">
                  <div className="w-24 h-24 mx-auto bg-slate-800/80 rounded-full flex items-center justify-center ring-1 ring-white/10 shadow-2xl">
                    <VideoIcon className="w-10 h-10 text-slate-400" />
                  </div>
                  <p className="text-slate-300 text-lg font-medium tracking-wide">
                    {status === 'waiting' ? 'Waiting for the other person...' : 'Connecting securely...'}
                  </p>
                  <div className="flex justify-center gap-2">
                    <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2.5 h-2.5 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Local video (small overlay) */}
          <motion.div 
            drag
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.1}
            className="absolute bottom-6 right-6 w-36 h-48 sm:w-48 sm:h-64 bg-slate-800 rounded-3xl overflow-hidden shadow-2xl shadow-black/50 ring-2 ring-white/10 z-20 cursor-move"
          >
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover mirror"
            />
            <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-md border border-white/10 text-white text-xs px-3 py-1 rounded-full font-bold shadow-lg">
              You
            </div>
          </motion.div>
        </div>

        {/* Chat Sidebar Overlay */}
        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-full max-w-xs lg:w-[340px] z-30 flex flex-col glass-card !bg-slate-900/90 rounded-[2.5rem] border-slate-700/50 shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-slate-700/50 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-3 relative">
                  <div className="status-dot text-emerald-400">
                    <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full" />
                  </div>
                  <h3 className="font-bold text-slate-100">Live Chat</h3>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={toggleTTS} 
                    title={isTTSEnabled ? "Disable Read-Aloud" : "Enable Read-Aloud"}
                    className={`p-2 rounded-full transition-colors ${isTTSEnabled ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                  >
                    {isTTSEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </button>
                  <button onClick={() => setShowChat(false)} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-3">
                    <MessageSquare className="w-12 h-12 text-slate-500 mb-2" />
                    <p className="text-sm text-slate-400">No messages yet.<br/>Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.from === peerId;
                    return (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`} key={msg.id}
                      >
                        <div className={`text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 mx-1`}>
                          {isMe ? 'You' : msg.from.split('-')[0]}
                        </div>
                        <div className={`px-4 py-2.5 shadow-md flex flex-col gap-1 max-w-[85%] ${
                          isMe 
                            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-t-2xl rounded-l-2xl rounded-br-sm' 
                            : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-t-2xl rounded-r-2xl rounded-bl-sm'
                        }`}>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap word-break">{msg.text}</p>
                          <span className={`text-[9px] ${isMe ? 'text-indigo-200' : 'text-slate-500'} self-end mt-1`}>
                            {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="p-4 border-t border-slate-700/50 bg-slate-900/50">
                <form onSubmit={handleSendChat} className="flex gap-2 relative">
                  <button
                    type="button"
                    onClick={toggleListening}
                    title="Voice Typing"
                    className={`absolute left-1.5 top-1.5 bottom-1.5 aspect-square rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-rose-500/20 text-rose-500 animate-pulse' : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`}
                  >
                    <AudioLines className="w-4 h-4" />
                  </button>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={isListening ? "Listening..." : "Type a message..."}
                    className="flex-1 bg-slate-800 border border-slate-700 text-sm rounded-full pl-10 pr-12 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-inner"
                  />
                  <button 
                    type="submit" 
                    disabled={!chatInput.trim()}
                    className="absolute right-1.5 top-1.5 bottom-1.5 aspect-square bg-gradient-to-tr from-indigo-500 to-purple-500 text-white rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    <Send className="w-4 h-4 ml-0.5" />
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls Bar */}
      <div className="pt-6 pb-2 flex justify-center items-center gap-3 sm:gap-6 z-10 w-full max-w-md mx-auto relative mt-auto">
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl border border-white/5 shadow-2xl rounded-full pointer-events-none -m-2" />
        <button 
          onClick={toggleMic}
          className={`relative z-10 p-4 sm:p-5 rounded-full transition-all active:scale-90 ${isMuted ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'}`}
        >
          {isMuted ? <MicOff className="w-6 h-6 sm:w-7 sm:h-7" /> : <Mic className="w-6 h-6 sm:w-7 sm:h-7" />}
        </button>
        <button 
          onClick={toggleVideo}
          className={`relative z-10 p-4 sm:p-5 rounded-full transition-all active:scale-90 ${isVideoOff ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'}`}
        >
          {isVideoOff ? <VideoOff className="w-6 h-6 sm:w-7 sm:h-7" /> : <VideoIcon className="w-6 h-6 sm:w-7 sm:h-7" />}
        </button>
        <button 
          onClick={() => setShowChat(prev => !prev)}
          className={`relative z-10 p-4 sm:p-5 rounded-full transition-all active:scale-90 ${showChat ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 ring-2 ring-indigo-400' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'}`}
        >
          <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7" />
          {messages.length > 0 && !showChat && (
            <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-slate-900 animate-pulse" />
          )}
        </button>
        <button 
          onClick={handleEnd}
          className="relative z-10 p-4 sm:p-5 bg-gradient-to-b from-rose-500 to-rose-600 text-white hover:from-rose-600 hover:to-rose-700 rounded-full transition-all shadow-[0_10px_30px_rgba(244,63,94,0.4)] hover:shadow-[0_10px_40px_rgba(244,63,94,0.6)] active:scale-90"
        >
          <PhoneOff className="w-6 h-6 sm:w-7 sm:h-7" />
        </button>
      </div>

      {/* Mood Overlay */}
      <AnimatePresence>
        {showMood && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6 z-[60]"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', bounce: 0.4 }}
              className="glass-card w-full max-w-md rounded-[3rem] p-10 text-center space-y-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500" />
              
              <div className="space-y-3">
                <h2 className="text-3xl font-black text-slate-100">How do you feel?</h2>
                <p className="text-slate-400 font-medium">Your connection helps the recovery process.</p>
              </div>
              
              <div className="flex justify-between items-center px-2 gap-2 sm:gap-4">
                {[1, 2, 3, 4, 5].map(score => (
                  <button 
                    key={score}
                    onClick={() => handleMood(score)}
                    className="group flex flex-col items-center gap-3 outline-none"
                  >
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl group-hover:scale-125 group-hover:-translate-y-2 group-hover:bg-indigo-500/20 group-hover:shadow-[0_10px_25px_rgba(99,102,241,0.3)] transition-all duration-300 group-active:scale-95 border border-white/5">
                      {['😢', '😟', '😐', '😊', '🥰'][score-1]}
                    </div>
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-500 group-hover:text-indigo-400 transition-colors">
                      {['Poor', 'Fair', 'Good', 'Great', 'Awesome'][score-1]}
                    </span>
                  </button>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-700/50">
                <button onClick={() => navigate('/')} className="w-full py-2 text-sm text-slate-400 font-bold hover:text-slate-200 transition-colors">Skip for now</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mirror CSS for local video & custom utility */}
      <style>{`
        .mirror {
          transform: scaleX(-1);
        }
        .word-break {
          word-break: break-word;
        }
      `}</style>
    </div>
  );
}
