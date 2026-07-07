import { useRef, useEffect, useCallback } from "react";
import { useStore } from "../store/useStore";

const MUSIC_SRC = "/夜曲-周杰伦.mp3";

// 全局音频引用，供 MusicControl 使用
export let audioEl: HTMLAudioElement | null = null;

export default function BGMusic() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const bgMuted = useStore((s) => s.bgMuted);
  const bgVolume = useStore((s) => s.bgVolume);
  const bgPlaying = useStore((s) => s.bgPlaying);
  const setBgPlaying = useStore((s) => s.setBgPlaying);

  // 同步全局引用
  useEffect(() => {
    audioEl = audioRef.current;
    return () => { audioEl = null; };
  }, []);

  // 同步音量
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = bgMuted ? 0 : bgVolume;
    audio.muted = bgMuted;
  }, [bgVolume, bgMuted]);

  // 同步播放/暂停
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (bgPlaying) {
      audio.play().then(() => setBgPlaying(true)).catch(() => {
        // 自动播放被阻止，等用户交互
      });
    } else {
      audio.pause();
    }
  }, [bgPlaying]);

  // 尝试自动播放
  const tryPlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || bgMuted) return;
    audio.volume = bgVolume;
    audio.play().then(() => setBgPlaying(true)).catch(() => {});
  }, [bgMuted, bgVolume, setBgPlaying]);

  // 页面加载后尝试播放
  useEffect(() => {
    const timer = setTimeout(tryPlay, 500);
    return () => clearTimeout(timer);
  }, [tryPlay]);

  // 如果自动播放被阻止，监听首次用户交互后播放
  useEffect(() => {
    const handleInteraction = () => {
      tryPlay();
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
    };
    window.addEventListener("click", handleInteraction);
    window.addEventListener("touchstart", handleInteraction);
    return () => {
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
    };
  }, [tryPlay]);

  // 监听播放/暂停事件同步 store
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onPlay = () => setBgPlaying(true);
    const onPause = () => setBgPlaying(false);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, [setBgPlaying]);

  return <audio ref={audioRef} loop preload="auto" src={MUSIC_SRC} />;
}
