import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, getUserRole } from '../api';
import { useVideoCall } from '../hooks/useVideoCall';
import { Mic, MicOff, Video as VideoIcon, VideoOff, MessageSquare, PhoneOff, Heart, Send, X, Volume2, VolumeX, AudioLines, ShieldCheck, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { useFaceExpression } from '../hooks/useFaceExpression';

export default function VisitRoom() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [canStartCall, setCanStartCall] = useState(false);
  const [askedPermission, setAskedPermission] = useState(false);
  const [showMood, setShowMood] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const role = getUserRole() || 'family';
  const isNurseView = role === 'nurse' || role === 'admin';
  const postCallPath = role === 'nurse' || role === 'admin' ? '/admin' : '/family';
  const patientCode = (id || '').toUpperCase();
  const requiresPatientSelection = isNurseView && patientCode === 'LIVE-SESSION';
  const peerId = `${role}-${patientCode}`;

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
    remoteDistressed,
    sendDistressState,
    endCall,
    toggleMic,
    toggleVideo,
  } = useVideoCall({
    roomId: canStartCall && !requiresPatientSelection ? patientCode : '',
    peerId,
    autoStart: role === 'nurse', // Nurse auto-initiates
  });

  const { isDistressed } = useFaceExpression({
    videoRef: localVideoRef,
    enabled: role === 'family' && status === 'connected' && !isVideoOff
  });

  useEffect(() => {
    if (role === 'family') {
      sendDistressState(isDistressed);
    }
  }, [isDistressed, role, sendDistressState]);

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

  useEffect(() => {
    if (requiresPatientSelection) {
      navigate('/admin?startSession=1', { replace: true });
    }
  }, [requiresPatientSelection, navigate]);

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
    navigate(postCallPath);
  };

  const statusLabel = {
    idle: canStartCall ? 'Initializing...' : 'Waiting for confirmation...',
    connecting: 'Connecting...',
    waiting: 'Waiting for other person to join...',
    incoming: 'Incoming call...',
    connected: '',
    ended: 'Call ended',
  }[status];

  const roomCode = patientCode;
  const handleCallPermission = (allow: boolean) => {
    setAskedPermission(true);
    if (allow) {
      setCanStartCall(true);
      return;
    }
    navigate(role === 'nurse' || role === 'admin' ? '/admin' : '/family');
  };

  return (
    <div className="min-h-[100dvh] bg-[#f4f7f9] dark:bg-slate-950 flex flex-col px-4 pb-4 pt-7 sm:px-6 sm:pb-6 sm:pt-10 overflow-y-auto overscroll-y-contain app-grid-bg">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-16 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute -right-28 bottom-20 h-72 w-72 rounded-full bg-teal-500/20 blur-3xl" />
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between mb-4 z-10 px-2 gap-3">
        <div className="flex items-center gap-3 ml-auto">
           <div className="w-10 h-10 bg-gradient-to-br from-cyan-600 to-teal-600 rounded-full flex items-center justify-center text-white ring-4 ring-cyan-900/30 shadow-[0_0_15px_rgba(8,145,178,0.45)]">
            <Heart className="w-5 h-5 heartbeat" />
          </div>
          <div>
             <h3 className="text-slate-900 dark:text-white font-bold leading-tight">Live Visit Session</h3>
             <p className="text-cyan-400 text-xs tracking-widest uppercase font-black">WebRTC • Peer-to-Peer</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white/85 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700/50 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg">
            <span className="text-slate-600 dark:text-slate-400 text-xs font-bold mr-1">Room:</span>
            <span className="text-slate-900 dark:text-slate-100 font-mono text-sm font-black tracking-wider">{roomCode}</span>
          </div>
          {status === 'connected' && (
            <div className="bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/50 px-3 py-1 rounded-xl text-xs font-black animate-pulse flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" /> LIVE
            </div>
          )}
          {statusLabel && (
            <div className="hidden sm:block text-slate-400 text-sm font-medium">{statusLabel}</div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 relative">
        {!canStartCall && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/65 dark:bg-slate-950/80 p-4 backdrop-blur-md">
            <div className="w-full max-w-md rounded-3xl border border-slate-300 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 p-6 shadow-2xl">
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">Start Video Call?</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                {askedPermission ? 'Please choose whether you want to start this call.' : 'Do you want to start the secure patient video call now?'}
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleCallPermission(false)}
                  className="rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200"
                >
                  Not now
                </button>
                <button
                  type="button"
                  onClick={() => handleCallPermission(true)}
                  className="rounded-2xl bg-gradient-to-r from-cyan-600 to-teal-600 px-4 py-3 text-sm font-bold text-white"
                >
                  Start Call
                </button>
              </div>
            </div>
          </div>
        )}

        <div className={`mx-auto grid min-h-[420px] w-full max-w-[1680px] items-start gap-4 ${showChat ? 'grid-cols-1 pt-2 sm:pt-3 lg:grid-cols-12' : 'grid-cols-1'}`}>
          {/* Video Container */}
          <div className={`relative min-h-0 ${showChat ? 'lg:col-span-8' : ''}`}>
            {/* Remote video (large) */}
            <div className={`relative w-full overflow-hidden rounded-4xl border border-slate-300 bg-slate-100 shadow-2xl dark:border-slate-700/50 dark:bg-slate-900/80 ${showChat ? 'h-[48dvh] min-h-[300px] sm:h-[52dvh] lg:h-[68dvh] lg:min-h-[520px]' : 'h-[56dvh] min-h-[340px] sm:h-[60dvh] lg:h-[72dvh] lg:min-h-[560px]'} ${showChat ? 'max-w-none' : isNurseView ? 'max-w-[min(88vw,1080px)]' : 'max-w-[min(96vw,1400px)]'} mx-auto glass-card`}>
              <div className="pointer-events-none absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-white/85 dark:bg-slate-900/70 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-200 backdrop-blur-md">
                <ShieldCheck className="h-3.5 w-3.5" /> Secure Patient Session
              </div>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className={`w-full h-full object-cover transition-all duration-700 ${remoteDistressed && isNurseView ? 'blur-2xl opacity-40 grayscale' : ''}`}
              />
              
              {remoteDistressed && isNurseView && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-2xl z-30">
                  <div className="w-24 h-24 bg-rose-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse ring-8 ring-rose-500/30">
                    <AlertCircle className="w-12 h-12 text-rose-400" />
                  </div>
                  <h3 className="text-3xl font-black text-white mb-2 tracking-wide">Network Issue</h3>
                  <p className="text-slate-200 text-lg font-medium">Reconnecting to family securely...</p>
                  
                  <div className="mt-8 flex gap-3">
                     <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                     <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                     <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              {status !== 'connected' && !remoteDistressed && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/65 dark:bg-slate-900/60 backdrop-blur-sm z-10">
                  <div className="text-center space-y-6">
                    <div className="w-24 h-24 mx-auto bg-white/90 dark:bg-slate-800/80 rounded-full flex items-center justify-center ring-1 ring-slate-300 dark:ring-white/10 shadow-2xl">
                      <VideoIcon className="w-10 h-10 text-slate-400" />
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 text-lg font-medium tracking-wide">
                      {status === 'waiting' ? 'Waiting for the other person...' : 'Connecting securely...'}
                    </p>
                    <div className="flex justify-center gap-2">
                      <div className="w-2.5 h-2.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2.5 h-2.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Local video (small overlay) */}
            <motion.div
              className={`absolute bottom-4 right-4 sm:bottom-6 sm:right-6 ${isNurseView ? 'w-32 h-20 sm:w-40 sm:h-24 md:w-48 md:h-28 lg:w-52 lg:h-32' : 'w-36 h-24 sm:w-48 sm:h-32 md:w-56 md:h-36 lg:w-64 lg:h-40'} bg-slate-200 dark:bg-slate-800 rounded-3xl overflow-hidden shadow-2xl shadow-black/30 dark:shadow-black/50 ring-2 ring-white/30 dark:ring-white/10 z-20`}
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
              
              {/* Distress Warning for Family */}
              <AnimatePresence>
                {isDistressed && role === 'family' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute inset-0 z-30 flex items-center justify-center p-2"
                  >
                    <div className="bg-rose-600/90 backdrop-blur-md p-3 rounded-2xl border border-rose-400/50 shadow-2xl text-center">
                      <AlertCircle className="w-6 h-6 text-white mx-auto mb-1 animate-bounce" />
                      <p className="text-[10px] font-black text-white uppercase tracking-tighter leading-tight">
                        Emotional Alert
                      </p>
                      <p className="text-[9px] text-rose-100 font-bold leading-tight mt-1">
                        Please stay calm. Your distress is being shielded to protect the patient's recovery process.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Chat Panel (3:2 split, non-floating) */}
          <AnimatePresence>
            {showChat && (
              <motion.aside
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="min-h-0 flex h-[42dvh] min-h-[280px] max-h-[520px] flex-col overflow-hidden rounded-4xl border border-slate-300 bg-white/95 shadow-2xl lg:col-span-4 lg:h-[68dvh] lg:min-h-[520px] lg:max-h-none dark:border-slate-700/50 dark:bg-slate-900/90"
              >
              <div className="p-5 border-b border-slate-200 dark:border-slate-700/50 flex items-center justify-between bg-slate-100/65 dark:bg-white/5">
                <div className="flex items-center gap-3 relative">
                  <div className="status-dot text-emerald-400">
                    <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100">Live Chat</h3>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setShowChat(false)} className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="border-b border-slate-200 dark:border-slate-700/50 bg-white/70 dark:bg-slate-900/40 p-3">
                <div className="grid grid-cols-2 gap-2">
                  <motion.button
                    type="button"
                    onClick={toggleTTS}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    className={`relative inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-colors ${isTTSEnabled ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-200' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}
                  >
                    {isTTSEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                    Text to Voice
                    <AnimatePresence>
                      {isTTSEnabled && (
                        <motion.span
                          initial={{ opacity: 0, scaleX: 0.2 }}
                          animate={{ opacity: 1, scaleX: 1 }}
                          exit={{ opacity: 0, scaleX: 0.2 }}
                          transition={{ duration: 0.2 }}
                          className="absolute inset-x-2 -bottom-0.5 h-0.5 origin-center rounded-full bg-cyan-500"
                        />
                      )}
                    </AnimatePresence>
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={toggleListening}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    className={`relative inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-colors ${isListening ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}
                  >
                    <AudioLines className="h-4 w-4" />
                    Voice to Text
                    <AnimatePresence>
                      {isListening && (
                        <motion.span
                          initial={{ opacity: 0, scaleX: 0.2 }}
                          animate={{ opacity: 1, scaleX: 1 }}
                          exit={{ opacity: 0, scaleX: 0.2 }}
                          transition={{ duration: 0.2 }}
                          className="absolute inset-x-2 -bottom-0.5 h-0.5 origin-center rounded-full bg-rose-500"
                        />
                      )}
                    </AnimatePresence>
                  </motion.button>
                </div>
              </div>

              <div className="scrollbar-thin min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-5 [touch-action:pan-y]">
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
                            ? 'bg-gradient-to-br from-cyan-600 to-teal-600 text-white rounded-t-2xl rounded-l-2xl rounded-br-sm' 
                            : 'bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-t-2xl rounded-r-2xl rounded-bl-sm'
                        }`}>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap word-break">{msg.text}</p>
                          <span className={`text-[9px] ${isMe ? 'text-cyan-100' : 'text-slate-500'} self-end mt-1`}>
                            {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="p-4 border-t border-slate-200 dark:border-slate-700/50 bg-white/75 dark:bg-slate-900/50">
                <form onSubmit={handleSendChat} className="flex gap-2 relative">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={isListening ? "Listening..." : "Type a message..."}
                    className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm rounded-full pl-4 pr-12 py-3 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all shadow-inner"
                  />
                  <button 
                    type="submit" 
                    disabled={!chatInput.trim()}
                    className="absolute right-1.5 top-1.5 bottom-1.5 aspect-square bg-gradient-to-tr from-cyan-600 to-teal-600 text-white rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    <Send className="w-4 h-4 ml-0.5" />
                  </button>
                </form>
              </div>
              </motion.aside>
          )}
        </AnimatePresence>
        </div>
      </div>

      {/* Controls Bar */}
      <div className={`pt-6 pb-2 flex shrink-0 justify-center items-center gap-3 sm:gap-6 z-10 w-full ${isNurseView ? 'max-w-lg' : 'max-w-xl'} mx-auto relative mt-4`}>
        <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-300 dark:border-white/5 shadow-2xl rounded-full pointer-events-none -m-2" />
        <button 
          onClick={toggleMic}
          className={`relative z-10 p-4 sm:p-5 rounded-full transition-all active:scale-90 ${isMuted ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' : 'bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'}`}
        >
          {isMuted ? <MicOff className="w-6 h-6 sm:w-7 sm:h-7" /> : <Mic className="w-6 h-6 sm:w-7 sm:h-7" />}
        </button>
        <button 
          onClick={toggleVideo}
          className={`relative z-10 p-4 sm:p-5 rounded-full transition-all active:scale-90 ${isVideoOff ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' : 'bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'}`}
        >
          {isVideoOff ? <VideoOff className="w-6 h-6 sm:w-7 sm:h-7" /> : <VideoIcon className="w-6 h-6 sm:w-7 sm:h-7" />}
        </button>
        <button 
          onClick={() => setShowChat(prev => !prev)}
          className={`relative z-10 p-4 sm:p-5 rounded-full transition-all active:scale-90 ${showChat ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30 ring-2 ring-cyan-400' : 'bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'}`}
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
            className="fixed inset-0 bg-white/70 dark:bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6 z-[60]"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', bounce: 0.4 }}
              className="glass-card w-full max-w-md rounded-[3rem] p-10 text-center space-y-8 shadow-2xl relative overflow-hidden bg-white/95 dark:bg-slate-900/90"
            >
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-cyan-500 via-sky-500 to-teal-500" />
              
              <div className="space-y-3">
                <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100">How do you feel?</h2>
                <p className="text-slate-600 dark:text-slate-400 font-medium">Your connection helps the recovery process.</p>
              </div>
              
              <div className="flex justify-between items-center px-2 gap-2 sm:gap-4">
                {[1, 2, 3, 4, 5].map(score => (
                  <button 
                    key={score}
                    onClick={() => handleMood(score)}
                    className="group flex flex-col items-center gap-3 outline-none"
                  >
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl group-hover:scale-125 group-hover:-translate-y-2 group-hover:bg-cyan-500/20 group-hover:shadow-[0_10px_25px_rgba(8,145,178,0.3)] transition-all duration-300 group-active:scale-95 border border-slate-200 dark:border-white/5">
                      {['😢', '😟', '😐', '😊', '🥰'][score-1]}
                    </div>
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-500 group-hover:text-cyan-500 dark:group-hover:text-cyan-400 transition-colors">
                      {['Poor', 'Fair', 'Good', 'Great', 'Awesome'][score-1]}
                    </span>
                  </button>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-700/50">
                <button onClick={() => navigate(postCallPath)} className="w-full py-2 text-sm text-slate-600 dark:text-slate-400 font-bold hover:text-slate-900 dark:hover:text-slate-200 transition-colors">Skip for now</button>
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
