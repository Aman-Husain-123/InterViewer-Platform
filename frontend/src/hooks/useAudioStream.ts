"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export const useAudioStream = (interviewId: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef(0);
  
  const connect = useCallback(() => {
    const ws = new WebSocket(`ws://localhost:8000/ws/v1/interview/${interviewId}`);
    ws.binaryType = "arraybuffer";
    socketRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      startMicCapture();
    };

    ws.onmessage = async (event) => {
      if (typeof event.data !== "string") {
        await playAudio(event.data);
      }
    };

    ws.onclose = () => setIsConnected(false);
    ws.onerror = (e) => setError("WebSocket connection error.");

  }, [interviewId]);

  const startMicCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1
        } 
      });

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          const input = e.inputBuffer.getChannelData(0);
          
          // Downsample to 24k for efficiency (Optional, but kept for STT compatibility)
          const ratio = ctx.sampleRate / 24000;
          const newLength = Math.round(input.length / ratio);
          const pcm16 = new Int16Array(newLength);
          
          for (let i = 0; i < newLength; i++) {
            const index = Math.round(i * ratio);
            pcm16[i] = Math.max(-1, Math.min(1, input[index])) * 0x7fff;
          }
          
          socketRef.current.send(pcm16.buffer);
        }
      };

      source.connect(processor);
      processor.connect(ctx.destination);
    } catch (e) {
      console.error("Mic Error:", e);
      setError("Microphone permission denied.");
    }
  };

  const playAudio = async (data: ArrayBuffer) => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    
    try {
        // EURI sends MP3 via REST bridge. Decode it natively.
        const audioBuffer = await ctx.decodeAudioData(data);
        
        const currentTime = ctx.currentTime;
        if (nextStartTimeRef.current < currentTime) {
            nextStartTimeRef.current = currentTime + 0.1;
        }

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.start(nextStartTimeRef.current);
        
        nextStartTimeRef.current += audioBuffer.duration;
    } catch (e) {
        console.error("Audio Decode Error:", e);
    }
  };

  const disconnect = useCallback(() => {
    socketRef.current?.close();
    audioContextRef.current?.close();
    processorRef.current?.disconnect();
    nextStartTimeRef.current = 0;
  }, []);

  return { isConnected, error, connect, disconnect, socket: socketRef.current };
};
