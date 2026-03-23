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
  /** Auto-start the call when joining (for the initiator) */
  autoStart?: boolean;
}

export function getWsBase(): string {
  const loc = window.location;
  const proto = loc.protocol === "https:" ? "wss:" : "ws:";
  // In dev, Vite proxies /ws → backend. In prod, same origin.
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

  const send = useCallback((data: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ ...data, from: peerId }));
    }
  }, [peerId]);

  const getLocalStream = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localStreamRef.current = stream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
    return stream;
  }, []);

  const createPeerConnection = useCallback((targetPeerId: string) => {
    if (pcRef.current) {
      pcRef.current.close();
    }
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        send({ type: "ice", candidate: e.candidate, target: targetPeerId });
      }
    };

    pc.ontrack = (e) => {
      if (remoteVideoRef.current && e.streams[0]) {
        remoteVideoRef.current.srcObject = e.streams[0];
      }
      setStatus("connected");
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "disconnected" || pc.iceConnectionState === "failed") {
        setStatus("ended");
      }
    };

    pcRef.current = pc;
    return pc;
  }, [send]);

  const startCall = useCallback(async (targetPeerId: string) => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    setStatus("connecting");
    setRemotePeerId(targetPeerId);

    const stream = await getLocalStream();
    const pc = createPeerConnection(targetPeerId);
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    send({ type: "offer", sdp: pc.localDescription, target: targetPeerId });
    setStatus("waiting");
  }, [getLocalStream, createPeerConnection, send]);

  const handleOffer = useCallback(async (msg: any) => {
    const fromPeer = msg.from;
    setRemotePeerId(fromPeer);

    const stream = await getLocalStream();
    const pc = createPeerConnection(fromPeer);
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    send({ type: "answer", sdp: pc.localDescription, target: fromPeer });
    setStatus("connected");
  }, [getLocalStream, createPeerConnection, send]);

  const handleAnswer = useCallback(async (msg: any) => {
    if (pcRef.current) {
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(msg.sdp));
      setStatus("connected");
    }
  }, []);

  const handleIce = useCallback(async (msg: any) => {
    if (pcRef.current && msg.candidate) {
      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(msg.candidate));
      } catch (e) {
        console.warn("ICE candidate error:", e);
      }
    }
  }, []);

  // Connect to signaling server
  useEffect(() => {
    if (!roomId || !peerId) return;

    const wsBase = getWsBase();
    const ws = new WebSocket(`${wsBase}/ws/${roomId}/${peerId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log(`[WebRTC] Connected to signaling as ${peerId} in room ${roomId}`);
      setStatus("waiting");
    };

    ws.onmessage = async (event) => {
      const msg = JSON.parse(event.data);

      switch (msg.type) {
        case "peer-joined":
          // Another peer joined — if we should auto-start, initiate the call
          if (autoStart && !hasStartedRef.current) {
            startCall(msg.peerId);
          }
          break;

        case "offer":
          await handleOffer(msg);
          break;

        case "answer":
          await handleAnswer(msg);
          break;

        case "ice":
          await handleIce(msg);
          break;

        case "peer-left":
          setStatus("ended");
          break;
      }
    };

    ws.onclose = () => {
      console.log("[WebRTC] Signaling disconnected");
    };

    ws.onerror = (e) => {
      console.error("[WebRTC] Signaling error:", e);
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [roomId, peerId, autoStart, startCall, handleOffer, handleAnswer, handleIce]);

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

  return {
    localVideoRef,
    remoteVideoRef,
    status,
    isMuted,
    isVideoOff,
    remotePeerId,
    startCall,
    endCall,
    toggleMic,
    toggleVideo,
  };
}
