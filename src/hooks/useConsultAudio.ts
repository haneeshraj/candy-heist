'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject
} from 'react';
import {
  createConsultGraph,
  type ConsultGraph,
  type Tools
} from '@/lib/consult/audio';

// A feedback link's player: the track, through the producer's tools.
//
// The audio context is made on the first press of play, as browsers ask,
// and the track runs through it from then on: element → tools → analyser
// → speakers. The playhead is kept in a ref and read by whatever draws
// from it each frame; only the clock's whole seconds go through React,
// so playing doesn't re-render the page sixty times a second.

export interface ConsultAudio {
  /** For the page's <audio>. */
  elementRef: RefObject<HTMLAudioElement | null>;
  /** Where the playhead is, in seconds, read each frame by what draws it. */
  positionRef: RefObject<number>;
  /** The playhead's whole second, for the clock. */
  second: number;
  duration: number;
  playing: boolean;
  /** The track couldn't be played here. */
  failed: boolean;
  /** Live reading for the spectrum; null until the first play. */
  analyserRef: RefObject<AnalyserNode | null>;
  toggle: () => void;
  seek: (seconds: number) => void;
}

export function useConsultAudio(
  fallbackDuration: number,
  tools: Tools,
  bypass: boolean
): ConsultAudio {
  const elementRef = useRef<HTMLAudioElement | null>(null);
  const positionRef = useRef(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const graphRef = useRef<ConsultGraph | null>(null);
  const toolsRef = useRef(tools);
  const bypassRef = useRef(bypass);
  const [second, setSecond] = useState(0);
  const [duration, setDuration] = useState(fallbackDuration);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  // The latest tools reach the graph as they change, and are there for it
  // the moment it's made.
  useEffect(() => {
    toolsRef.current = tools;
    graphRef.current?.set(tools);
  }, [tools]);

  useEffect(() => {
    bypassRef.current = bypass;
    graphRef.current?.bypass(bypass);
  }, [bypass]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    let frame = 0;
    const tick = () => {
      positionRef.current = element.currentTime;
      setSecond(Math.floor(element.currentTime));
      if (!element.paused) frame = requestAnimationFrame(tick);
    };
    const onPlay = () => {
      setPlaying(true);
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(tick);
    };
    const onPause = () => {
      setPlaying(false);
      tick();
    };
    const onMeta = () => {
      if (Number.isFinite(element.duration)) setDuration(element.duration);
    };
    const onError = () => setFailed(true);
    element.addEventListener('play', onPlay);
    element.addEventListener('pause', onPause);
    element.addEventListener('ended', onPause);
    element.addEventListener('seeked', tick);
    element.addEventListener('loadedmetadata', onMeta);
    element.addEventListener('error', onError);
    return () => {
      cancelAnimationFrame(frame);
      element.removeEventListener('play', onPlay);
      element.removeEventListener('pause', onPause);
      element.removeEventListener('ended', onPause);
      element.removeEventListener('seeked', tick);
      element.removeEventListener('loadedmetadata', onMeta);
      element.removeEventListener('error', onError);
    };
  }, []);

  // The graph goes with the page.
  useEffect(
    () => () => {
      graphRef.current?.dispose();
      void contextRef.current?.close();
    },
    []
  );

  const connect = useCallback(() => {
    const element = elementRef.current;
    if (!element || contextRef.current) return;
    const context = new AudioContext();
    const graph = createConsultGraph(context);
    const analyser = context.createAnalyser();
    analyser.fftSize = 4096;
    analyser.smoothingTimeConstant = 0.75;
    context.createMediaElementSource(element).connect(graph.input);
    graph.output.connect(analyser);
    analyser.connect(context.destination);
    graph.set(toolsRef.current);
    graph.bypass(bypassRef.current);
    graph.follow(element);
    contextRef.current = context;
    graphRef.current = graph;
    analyserRef.current = analyser;
  }, []);

  const toggle = useCallback(() => {
    const element = elementRef.current;
    if (!element) return;
    connect();
    void contextRef.current?.resume();
    if (element.paused) element.play().catch(() => setFailed(true));
    else element.pause();
  }, [connect]);

  const seek = useCallback((seconds: number) => {
    const element = elementRef.current;
    if (!element) return;
    const end = Number.isFinite(element.duration) ? element.duration : seconds;
    element.currentTime = Math.min(Math.max(seconds, 0), end);
    positionRef.current = element.currentTime;
    setSecond(Math.floor(element.currentTime));
  }, []);

  return {
    elementRef,
    positionRef,
    second,
    duration,
    playing,
    failed,
    analyserRef,
    toggle,
    seek
  };
}
