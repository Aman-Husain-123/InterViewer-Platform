"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export const useWebRTC = (signalingSocket: WebSocket | null) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>("new");

  const pcRef = useRef<RTCPeerConnection | null>(null);

  const startCall = useCallback(async () => {
    try {
      // 1. Get User Media (Task 1)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      setLocalStream(stream);

      // 2. Init RTCPeerConnection (Task 1: STUN)
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
      });
      pcRef.current = pc;

      // Track PC state
      pc.onconnectionstatechange = () => setConnectionState(pc.connectionState);
      
      pc.onicecandidate = (event) => {
        if (event.candidate && signalingSocket?.readyState === WebSocket.OPEN) {
          signalingSocket.send(JSON.stringify({ type: "candidate", candidate: event.candidate }));
        }
      };

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        }
      };

      // Add local tracks
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // 3. Create Offer (Task 1)
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (signalingSocket?.readyState === WebSocket.OPEN) {
        signalingSocket.send(JSON.stringify({ type: "offer", sdp: offer.sdp }));
      }

    } catch (err) {
      console.error("WebRTC Setup Error:", err);
    }
  }, [signalingSocket]);

  const endCall = useCallback(() => {
    if (pcRef.current) pcRef.current.close();
    if (localStream) localStream.getTracks().forEach((t) => t.stop());
    setLocalStream(null);
    setRemoteStream(null);
    pcRef.current = null;
  }, [localStream]);

  // Handle Answer/Candidate from signaling
  useEffect(() => {
    if (!signalingSocket) return;

    const handleMessage = async (msg: MessageEvent) => {
      try {
        const data = JSON.parse(msg.data);
        if (data.type === "answer") {
          await pcRef.current?.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: data.sdp }));
        } else if (data.type === "candidate") {
          await pcRef.current?.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      } catch (e) {}
    };

    signalingSocket.addEventListener("message", handleMessage);
    return () => signalingSocket.removeEventListener("message", handleMessage);
  }, [signalingSocket]);

  return { localStream, remoteStream, connectionState, startCall, endCall };
};
