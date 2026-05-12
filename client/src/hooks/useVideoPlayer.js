import { useState, useCallback, useRef } from 'react';

const useVideoPlayer = () => {
  const playerRef = useRef(null);
  const [playing, setPlaying] = useState(true);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [played, setPlayed] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [duration, setDuration] = useState(0);

  const handlePlayPause = useCallback(() => {
    setPlaying((prev) => !prev);
  }, []);

  const handleVolumeChange = useCallback((value) => {
    setVolume(value);
    setMuted(value === 0);
  }, []);

  const handleToggleMute = useCallback(() => {
    setMuted((prev) => !prev);
  }, []);

  const handleProgress = useCallback((state) => {
    if (!seeking) {
      setPlayed(state.played);
    }
  }, [seeking]);

  const handleSeekChange = useCallback((value) => {
    setPlayed(value);
  }, []);

  const handleSeekMouseDown = useCallback(() => {
    setSeeking(true);
  }, []);

  const handleSeekMouseUp = useCallback((value) => {
    setSeeking(false);
    playerRef.current?.seekTo(value);
  }, []);

  const handleDuration = useCallback((dur) => {
    setDuration(dur);
  }, []);

  const handlePlaybackRate = useCallback((rate) => {
    setPlaybackRate(rate);
  }, []);

  const handleFullscreen = useCallback(() => {
    setFullscreen((prev) => !prev);
  }, []);

  const handleRewind = useCallback((seconds = 10) => {
    const currentTime = playerRef.current?.getCurrentTime() || 0;
    playerRef.current?.seekTo(Math.max(0, currentTime - seconds));
  }, []);

  const handleForward = useCallback((seconds = 10) => {
    const currentTime = playerRef.current?.getCurrentTime() || 0;
    playerRef.current?.seekTo(Math.min(duration, currentTime + seconds));
  }, [duration]);

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    playerRef,
    playing,
    volume,
    muted,
    played,
    seeking,
    playbackRate,
    fullscreen,
    duration,
    handlePlayPause,
    handleVolumeChange,
    handleToggleMute,
    handleProgress,
    handleSeekChange,
    handleSeekMouseDown,
    handleSeekMouseUp,
    handleDuration,
    handlePlaybackRate,
    handleFullscreen,
    handleRewind,
    handleForward,
    formatTime,
    setPlaying,
  };
};

export default useVideoPlayer;
