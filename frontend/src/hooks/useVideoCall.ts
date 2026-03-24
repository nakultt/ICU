import { useRef, useEffect, useState, useCallback } from "react";

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export type CallStatus =
  | "idle"
  | "connecting"
  | "waiting"
  | "incoming"
  | "connected"
  | "ended";

interface UseVideoCallOptions {
  roomId: string;
  peerId: string;
  autoStart?: boolean;
}

function getWsBase(): string {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }
  if (import.meta.env.PROD) {
    return "wss://icu-r1j0.onrender.com";
  }
  const loc = window.location;
  const proto = loc.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${loc.host}`;
}

export function useVideoCall({ roomId, peerId, autoStart = false }: UseVideoCallOptions) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CallStatus>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [remotePeerId, setRemotePeerId] = useState<string | null>(null);
  const hasStartedRef = useRef(false);
  const autoStartRef = useRef(autoStart);
  autoStartRef.current = autoStart;

  const sendRef = useRef<(data: Record<string, unknown>) => void>(() => {});

  // Keep send function in a ref so it doesn't cause re-renders
  useEffect(() => {
    sendRef.current = (data: Record<string, unknown>) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ ...data, from: peerId }));
      }
    };
  }, [peerId]);

  const getLocalStream = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      console.error("[WebRTC] Camera/mic access error:", err);
      // Try video only
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        return stream;
      } catch {
        console.error("[WebRTC] No camera access at all");
        return null;
      }
    }
  }, []);

  const createPeerConnection = useCallback((targetPeerId: string) => {
    if (pcRef.current) {
      pcRef.current.close();
    }
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        sendRef.current({ type: "ice", candidate: e.candidate, target: targetPeerId });
      }
    };

    pc.ontrack = (e) => {
      if (remoteVideoRef.current && e.streams[0]) {
        remoteVideoRef.current.srcObject = e.streams[0];
      }
      setStatus("connected");
    };

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      console.log("[WebRTC] ICE state:", state);
      if (state === "disconnected" || state === "failed") {
        setStatus("ended");
      }
    };

    pcRef.current = pc;
    return pc;
  }, []);

  const doStartCall = useCallback(async (targetPeerId: string) => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    setStatus("connecting");
    setRemotePeerId(targetPeerId);
    console.log("[WebRTC] Starting call to", targetPeerId);

    const stream = await getLocalStream();
    const pc = createPeerConnection(targetPeerId);
    if (stream) {
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    }

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    sendRef.current({ type: "offer", sdp: pc.localDescription, target: targetPeerId });
    setStatus("waiting");
  }, [getLocalStream, createPeerConnection]);

  const doHandleOffer = useCallback(async (msg: { from: string; sdp: RTCSessionDescriptionInit }) => {
    const fromPeer = msg.from;
    setRemotePeerId(fromPeer);
    console.log("[WebRTC] Received offer from", fromPeer);

    const stream = await getLocalStream();
    const pc = createPeerConnection(fromPeer);
    if (stream) {
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    }

    await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    sendRef.current({ type: "answer", sdp: pc.localDescription, target: fromPeer });
    setStatus("connected");
  }, [getLocalStream, createPeerConnection]);

  // Store handlers in refs so the WebSocket effect doesn't depend on them
  const doStartCallRef = useRef(doStartCall);
  doStartCallRef.current = doStartCall;
  const doHandleOfferRef = useRef(doHandleOffer);
  doHandleOfferRef.current = doHandleOffer;

  // ---- Single stable WebSocket effect — only depends on roomId & peerId ----
  useEffect(() => {
    if (!roomId || !peerId) return;

    let cancelled = false;
    const wsBase = getWsBase();
    const wsUrl = `${wsBase}/ws/${roomId}/${peerId}`;
    console.log("[WebRTC] Connecting to signaling:", wsUrl);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = async () => {
      if (cancelled) return;
      console.log(`[WebRTC] Connected to signaling as ${peerId} in room ${roomId}`);
      // Start camera immediately
      await getLocalStream();
      setStatus("waiting");
    };

    ws.onmessage = async (event) => {
      if (cancelled) return;
      const msg = JSON.parse(event.data);
      console.log("[WebRTC] Received message:", msg.type);

      switch (msg.type) {
        case "room-peers": {
          // Filter out our own peerId (shouldn't happen but safety check)
          const otherPeers = (msg.peers || []).filter((p: string) => p !== peerId);
          if (autoStartRef.current && !hasStartedRef.current && otherPeers.length > 0) {
            console.log("[WebRTC] Found peers in room:", otherPeers, "— initiating call");
            doStartCallRef.current(otherPeers[0]);
          }
          break;
        }

        case "peer-joined":
          // Never call yourself
          if (msg.peerId === peerId) break;
          if (autoStartRef.current && !hasStartedRef.current) {
            console.log("[WebRTC] Peer joined:", msg.peerId, "— initiating call");
            doStartCallRef.current(msg.peerId);
          }
          break;

        case "offer":
          await doHandleOfferRef.current(msg);
          break;

        case "answer":
          if (pcRef.current) {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(msg.sdp));
            setStatus("connected");
          }
          break;

        case "ice":
          if (pcRef.current && msg.candidate) {
            try {
              await pcRef.current.addIceCandidate(new RTCIceCandidate(msg.candidate));
            } catch (e) {
              console.warn("ICE candidate error:", e);
            }
          }
          break;

        case "peer-left":
          // Only end if we were actually connected — ignore during StrictMode reconnect cycles
          if (pcRef.current && (pcRef.current.connectionState === "connected" || pcRef.current.iceConnectionState === "connected")) {
            setStatus("ended");
          }
          break;

        case "chat": {
          const id = msg.id || Math.random().toString(36).slice(2, 9);
          setMessages((prev) => [...prev, { id, from: msg.from, text: msg.text, time: msg.time }]);
          if (isTTSEnabledRef.current && msg.from !== peerId) {
            const utterance = new SpeechSynthesisUtterance(msg.text);
            window.speechSynthesis.speak(utterance);
          }
          break;
        }
      }
    };

    ws.onclose = () => {
      if (!cancelled) {
        console.log("[WebRTC] Signaling disconnected");
      }
    };

    ws.onerror = (e) => {
      if (!cancelled) {
        console.error("[WebRTC] Signaling error:", e);
      }
    };

    return () => {
      cancelled = true;
      ws.close();
      wsRef.current = null;
    };
    // Only reconnect when roomId or peerId changes — NOT when callbacks change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, peerId]);

  const endCall = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    hasStartedRef.current = false;
    setStatus("ended");
  }, []);

  const toggleMic = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  }, []);

  const [messages, setMessages] = useState<{ id: string; from: string; text: string; time: string }[]>([]);
  const [isTTSEnabled, setIsTTSEnabled] = useState(false);
  const isTTSEnabledRef = useRef(isTTSEnabled);

  const toggleTTS = useCallback(() => {
    setIsTTSEnabled((prev) => {
      const next = !prev;
      isTTSEnabledRef.current = next;
      // If turning off, cancel any ongoing speech
      if (!next) {
        window.speechSynthesis.cancel();
      }
      return next;
    });
  }, []);

  const sendMessage = useCallback((text: string) => {
    const time = new Date().toISOString();
    const id = Math.random().toString(36).slice(2, 9);
    sendRef.current({ type: "chat", text, time, id });
    setMessages((prev) => [...prev, { id, from: peerId, text, time }]);

    if (isTTSEnabledRef.current) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  }, [peerId]);

  return {
    localVideoRef,
    remoteVideoRef,
    status,
    isMuted,
    isVideoOff,
    remotePeerId,
    messages,
    sendMessage,
    isTTSEnabled,
    toggleTTS,
    startCall: doStartCall,
    endCall,
    toggleMic,
    toggleVideo,
  };
}
