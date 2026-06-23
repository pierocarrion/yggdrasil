"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { auth } from "@/lib/firebase/client";
import { uploadVoiceNote, transcribeVoiceNote } from "@/lib/voiceNotes";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────

interface VoiceRecorderProps {
  onTranscriptReady: (transcript: string, storagePath: string) => void;
  onCancel: () => void;
}

type RecordingState =
  | "idle"
  | "requesting-permission"
  | "recording"
  | "paused"
  | "processing"
  | "error";

// ─── Constants ────────────────────────────────────────────────────────

const MAX_DURATION_SECONDS = 5 * 60; // 5 minutes
const COUNTDOWN_WARNING_SECONDS = 30;

// Brand palette
const SAGE = "#7BAE8A";
const SAGE_DIM = "rgba(123, 174, 138, 0.3)";
const GOLD = "#C9A84C";

// ─── Speech Recognition type shim ────────────────────────────────────

type SpeechRecognitionType = typeof window extends { SpeechRecognition: infer T }
  ? T
  : any;

function getSpeechRecognition(): SpeechRecognitionType | null {
  if (typeof window === "undefined") return null;
  return (
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition ||
    null
  );
}

// ─── Component ────────────────────────────────────────────────────────

export function VoiceRecorder({ onTranscriptReady, onCancel }: VoiceRecorderProps) {
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // State
  const [state, setState] = useState<RecordingState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [interimCaption, setInterimCaption] = useState("");
  const [finalCaption, setFinalCaption] = useState("");
  const [hasSpeechApi, setHasSpeechApi] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // ─── Format elapsed time ────────────────────────────────────────────

  const formatTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, []);

  const remainingSeconds = MAX_DURATION_SECONDS - elapsed;
  const showCountdown = remainingSeconds <= COUNTDOWN_WARNING_SECONDS && state === "recording";

  // ─── Check for Speech API on mount ──────────────────────────────────

  useEffect(() => {
    setHasSpeechApi(!!getSpeechRecognition());
  }, []);

  // ─── Cleanup on unmount ─────────────────────────────────────────────

  useEffect(() => {
    return () => {
      stopAllStreams();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Auto-stop at max duration ──────────────────────────────────────

  useEffect(() => {
    if (elapsed >= MAX_DURATION_SECONDS && state === "recording") {
      handleStop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed, state]);

  // ─── Stream / resource cleanup ──────────────────────────────────────

  const stopAllStreams = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try { mediaRecorderRef.current.stop(); } catch { /* ignore */ }
    }
    mediaRecorderRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  // ─── Canvas waveform visualization ──────────────────────────────────

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      // Draw frequency bars from center outward
      const barCount = 64;
      const barWidth = width / barCount - 1;
      const centerY = height / 2;

      for (let i = 0; i < barCount; i++) {
        // Sample from the data array
        const dataIndex = Math.floor((i / barCount) * bufferLength);
        const value = dataArray[dataIndex] / 255;
        const barHeight = Math.max(2, value * centerY * 0.9);

        // Peak bars get gold, rest get sage
        const isPeak = value > 0.7;
        ctx.fillStyle = isPeak ? GOLD : SAGE;
        ctx.globalAlpha = Math.max(0.3, value);

        const x = i * (barWidth + 1);

        // Draw mirrored bars (up and down from center)
        ctx.fillRect(x, centerY - barHeight, barWidth, barHeight);
        ctx.fillRect(x, centerY, barWidth, barHeight);
      }

      ctx.globalAlpha = 1;
    };

    draw();
  }, []);

  // ─── Start recording ────────────────────────────────────────────────

  const handleStart = useCallback(async () => {
    setState("requesting-permission");
    setPermissionDenied(false);
    setErrorMessage("");
    setElapsed(0);
    setInterimCaption("");
    setFinalCaption("");
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Set up audio analysis for waveform
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Negotiate MIME type (Safari needs mp4)
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.start(1000); // Collect data every second
      setState("recording");

      // Start elapsed timer
      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);

      // Start waveform visualization
      drawWaveform();

      // Start Web Speech API for live captions (if available)
      const SpeechRecognitionClass = getSpeechRecognition();
      if (SpeechRecognitionClass) {
        const recognition = new SpeechRecognitionClass();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          let interim = "";
          let newFinal = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              newFinal += transcript + " ";
            } else {
              interim += transcript;
            }
          }
          if (newFinal) setFinalCaption((prev) => prev + newFinal);
          setInterimCaption(interim);
        };

        recognition.onerror = (event: any) => {
          // Non-fatal — Web Speech can fail without breaking recording
          console.warn("SpeechRecognition error:", event.error);
        };

        recognition.onend = () => {
          // Restart if still recording (Web Speech auto-stops periodically)
          if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state === "recording" &&
            recognitionRef.current
          ) {
            try {
              recognitionRef.current.start();
            } catch {
              /* ignore duplicate start */
            }
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      }
    } catch (error: any) {
      console.error("Microphone access error:", error);
      if (
        error.name === "NotAllowedError" ||
        error.name === "PermissionDeniedError"
      ) {
        setPermissionDenied(true);
      } else {
        setErrorMessage(
          `Could not access your microphone: ${error.message || String(error)} (${error.name}). Please check your device settings and browser permissions.`
        );
      }
      setState("error");
    }
  }, [drawWaveform]);

  // ─── Pause / Resume ─────────────────────────────────────────────────

  const handlePause = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch { /* ignore */ }
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      setState("paused");
    }
  }, []);

  const handleResume = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
      if (recognitionRef.current) {
        try { recognitionRef.current.start(); } catch { /* ignore */ }
      }
      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
      drawWaveform();
      setState("recording");
    }
  }, [drawWaveform]);

  // ─── Stop & process ─────────────────────────────────────────────────

  const handleStop = useCallback(async () => {
    setState("processing");

    // Stop recognition and timer first
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Stop MediaRecorder and wait for final data
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      setState("error");
      setErrorMessage("Recording was empty. Please try again.");
      return;
    }

    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      recorder.stop();
    });

    // Stop mic stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Assemble blob
    const mimeType = recorder.mimeType || "audio/webm";
    const audioBlob = new Blob(chunksRef.current, { type: mimeType });

    if (audioBlob.size === 0) {
      setState("error");
      setErrorMessage("Recording was empty. Please try again.");
      return;
    }

    const userId = auth.currentUser?.uid;
    if (!userId) {
      setState("error");
      setErrorMessage("You must be signed in to record a voice note.");
      return;
    }

    try {
      // Generate a unique draft ID
      const draftId = `voice_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      // Upload audio
      const storagePath = await uploadVoiceNote(userId, audioBlob, draftId);

      // Transcribe with Gemini
      const transcript = await transcribeVoiceNote(userId, storagePath);

      if (!transcript || !transcript.trim()) {
        setState("error");
        setErrorMessage(
          "Transcription returned empty. The audio may have been too quiet."
        );
        return;
      }

      onTranscriptReady(transcript, storagePath);
    } catch (error) {
      console.error("Voice note processing failed:", error);
      setState("error");
      const errMessage = error instanceof Error ? error.message : String(error);
      setErrorMessage(`Transcription failed: ${errMessage}. Please try again.`);
      toast.error(`Voice note transcription failed: ${errMessage}`);
    }
  }, [onTranscriptReady]);

  // ─── Cancel ─────────────────────────────────────────────────────────

  const handleCancel = useCallback(() => {
    stopAllStreams();
    chunksRef.current = [];
    setState("idle");
    onCancel();
  }, [stopAllStreams, onCancel]);

  // ─── Render ─────────────────────────────────────────────────────────

  // Idle state (waiting to start)
  if (state === "idle") {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16 px-8">
        <button
          onClick={handleStart}
          className="w-20 h-20 rounded-full bg-sage/10 text-sage flex items-center justify-center hover:bg-sage/20 transition-colors cursor-pointer border border-sage/30 group"
          title="Start recording"
        >
          <MicIcon className="w-8 h-8 group-hover:scale-110 transition-transform" />
        </button>
        <div className="text-center">
          <p className="text-foreground/80 text-sm font-medium">Ready to record</p>
          <p className="text-foreground/40 text-xs mt-1">Click the microphone to start</p>
        </div>
        <button
          onClick={handleCancel}
          className="px-5 py-2 text-xs uppercase tracking-wider text-foreground/70 hover:text-foreground border border-border/50 rounded-sm transition-colors cursor-pointer mt-4"
        >
          Cancel
        </button>
      </div>
    );
  }

  // Permission denied state
  if (permissionDenied) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16 px-8">
        <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center">
          <MicOffIcon />
        </div>
        <div className="text-center max-w-sm">
          <p className="text-foreground/80 text-sm leading-relaxed">
            Microphone access is needed to record a voice note. You can enable
            it in your browser settings.
          </p>
        </div>
        <button
          onClick={onCancel}
          className="px-5 py-2 text-xs uppercase tracking-wider text-foreground/70 hover:text-foreground border border-border/50 rounded-sm transition-colors cursor-pointer"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Error state
  if (state === "error" && errorMessage) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16 px-8">
        <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
          <MicOffIcon />
        </div>
        <p className="text-foreground/70 text-sm text-center max-w-sm">
          {errorMessage}
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleStart}
            className="px-5 py-2 text-xs uppercase tracking-wider text-sage border border-sage/40 rounded-sm hover:bg-sage/10 transition-colors cursor-pointer"
          >
            Try Again
          </button>
          <button
            onClick={onCancel}
            className="px-5 py-2 text-xs uppercase tracking-wider text-foreground/70 hover:text-foreground border border-border/50 rounded-sm transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Processing state
  if (state === "processing") {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16 px-8">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-sage/30 border-t-sage animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <MicIcon className="w-6 h-6 text-sage/60" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-foreground/80 text-sm font-medium">
            Transcribing your note...
          </p>
          <p className="text-foreground/40 text-xs mt-1">
            Gemini is converting your voice to text
          </p>
        </div>
      </div>
    );
  }

  // Recording / paused state
  return (
    <div className="flex flex-col items-center gap-6 py-8 px-8">
      {/* Recording indicator + timer */}
      <div className="flex items-center gap-3">
        {state === "recording" && (
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </span>
        )}
        {state === "paused" && (
          <span className="flex h-3 w-3">
            <span className="inline-flex rounded-full h-3 w-3 bg-gold/60" />
          </span>
        )}
        <span className="text-foreground font-mono text-lg tracking-wider">
          {formatTime(elapsed)}
        </span>
        {showCountdown && (
          <span className="text-xs text-gold/80 font-mono">
            {remainingSeconds}s left
          </span>
        )}
      </div>

      {/* Waveform canvas */}
      <canvas
        ref={canvasRef}
        width={400}
        height={120}
        className="w-full max-w-md h-[120px] rounded-sm bg-surface/50"
      />

      {/* Live captions */}
      {hasSpeechApi && (finalCaption || interimCaption) && (
        <div className="w-full max-w-md max-h-24 overflow-y-auto px-2">
          <p className="text-sm text-foreground/60 leading-relaxed">
            {finalCaption}
            {interimCaption && (
              <span className="italic text-foreground/30">{interimCaption}</span>
            )}
          </p>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-4">
        {/* Cancel */}
        <button
          onClick={handleCancel}
          className="px-4 py-2 text-xs uppercase tracking-wider text-foreground/50 hover:text-foreground/80 border border-border/40 rounded-sm transition-colors cursor-pointer"
          title="Discard recording"
        >
          Cancel
        </button>

        {/* Pause / Resume */}
        {state === "recording" ? (
          <button
            onClick={handlePause}
            className="px-5 py-2.5 text-xs uppercase tracking-wider text-gold border border-gold/40 rounded-sm hover:bg-gold/10 transition-colors cursor-pointer flex items-center gap-2"
            title="Pause recording"
          >
            <PauseIcon />
            Pause
          </button>
        ) : state === "paused" ? (
          <button
            onClick={handleResume}
            className="px-5 py-2.5 text-xs uppercase tracking-wider text-sage border border-sage/40 rounded-sm hover:bg-sage/10 transition-colors cursor-pointer flex items-center gap-2"
            title="Resume recording"
          >
            <PlayIcon />
            Resume
          </button>
        ) : null}

        {/* Stop */}
        {(state === "recording" || state === "paused") && (
          <button
            onClick={handleStop}
            className="px-5 py-2.5 text-xs uppercase tracking-wider text-foreground bg-primary border border-sage/40 rounded-sm hover:bg-primary/80 transition-colors cursor-pointer flex items-center gap-2"
            title="Stop and transcribe"
          >
            <StopIcon />
            Done
          </button>
        )}
      </div>

      {state === "paused" && (
        <p className="text-xs text-foreground/30 italic">Recording paused</p>
      )}
    </div>
  );
}

// ─── Inline SVG Icons ─────────────────────────────────────────────────

function MicIcon({ className = "w-5 h-5 text-sage" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="1" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <line x1="12" y1="17" x2="12" y2="21" />
      <line x1="8" y1="21" x2="16" y2="21" />
    </svg>
  );
}

function MicOffIcon() {
  return (
    <svg
      className="w-7 h-7 text-foreground/40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
      <path d="M17 16.95A7 7 0 0 1 5 12" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5,3 19,12 5,21" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  );
}
