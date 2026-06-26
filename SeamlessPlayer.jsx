import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import styles from './SeamlessPlayer.module.css';

// Default mock server stream links for reference
const DEFAULT_SERVERS = [
  { name: 'Server 1 (World Cup Live)', url: 'https://sm-monirul.top/tof/live/toffee6/index.m3u8' },
  { name: 'Server 2 (Sports Network)', url: 'https://sm-monirul.top/tof/live/toffee5/index.m3u8' },
  { name: 'Server 3 (Alternate HD)', url: 'https://sm-monirul.top/tof/live/toffee1/index.m3u8' },
];

export default function SeamlessPlayer({ servers = DEFAULT_SERVERS }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [activePlayer, setActivePlayer] = useState('A'); // 'A' or 'B'
  const [healthStatus, setHealthStatus] = useState({}); // { url: boolean }
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState('00:00');
  const [progress, setProgress] = useState(0);
  const [buffer, setBuffer] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const videoRefA = useRef(null);
  const videoRefB = useRef(null);
  const hlsRefA = useRef(null);
  const hlsRefB = useRef(null);
  const stallTimerRef = useRef(null);
  const fadeTimeoutRef = useRef(null);

  // Background health check
  useEffect(() => {
    async function checkHealth(url) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      try {
        await fetch(url, { method: 'GET', mode: 'no-cors', signal: controller.signal });
        clearTimeout(timeoutId);
        return true;
      } catch {
        clearTimeout(timeoutId);
        return false;
      }
    }

    async function runHealthCheck() {
      const newStatus = {};
      for (const server of servers) {
        newStatus[server.url] = await checkHealth(server.url);
      }
      setHealthStatus(newStatus);
    }

    runHealthCheck();
    const interval = setInterval(runHealthCheck, 60000);
    return () => clearInterval(interval);
  }, [servers]);

  // Stall detector
  const startStallTimer = () => {
    clearStallTimer();
    stallTimerRef.current = setTimeout(() => {
      console.warn('[Stall Monitor] Stream stalled. Skipping to next...');
      handleFailover();
    }, 4000);
  };

  const clearStallTimer = () => {
    if (stallTimerRef.current) {
      clearTimeout(stallTimerRef.current);
      stallTimerRef.current = null;
    }
  };

  const handleFailover = () => {
    if (servers.length <= 1) {
      setErrorMessage('Stream failed to load and no failover server is available.');
      return;
    }
    const nextIdx = (currentIdx + 1) % servers.length;
    console.log(`[Failover] Switching from server ${currentIdx} to ${nextIdx}`);
    setCurrentIdx(nextIdx);
  };

  // Load stream
  useEffect(() => {
    const url = servers[currentIdx]?.url;
    if (!url) return;

    setIsLoading(true);
    setErrorMessage('');
    startStallTimer();

    // Determine target (idle) player
    const isTargetA = activePlayer === 'B';
    const targetVideo = isTargetA ? videoRefA.current : videoRefB.current;
    const currentVideo = isTargetA ? videoRefB.current : videoRefA.current;

    // Cleanup previous load on target player
    cleanupPlayer(isTargetA ? 'A' : 'B');

    let hlsInstance = null;
    let isReady = false;

    function onReady() {
      if (isReady) return;
      isReady = true;
      clearStallTimer();
      setIsLoading(false);

      // Match volumes
      targetVideo.volume = volume;
      targetVideo.muted = isMuted;

      targetVideo.play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          // Autoplay protection
          targetVideo.muted = true;
          setIsMuted(true);
          setVolume(0);
          targetVideo.play().then(() => setIsPlaying(true));
        });

      // Swap cross-fade
      targetVideo.style.opacity = '1';
      targetVideo.style.zIndex = '20';

      currentVideo.style.opacity = '0';
      currentVideo.style.zIndex = '10';

      setActivePlayer(isTargetA ? 'A' : 'B');

      // Cleanup previous player after transition delay
      fadeTimeoutRef.current = setTimeout(() => {
        currentVideo.pause();
        cleanupPlayer(isTargetA ? 'B' : 'A');
      }, 350);
    }

    if (Hls.isSupported() && url.includes('.m3u8')) {
      hlsInstance = new Hls({
        maxMaxBufferLength: 10,
        enableWorker: true,
        lowLatencyMode: true,
      });

      if (isTargetA) {
        hlsRefA.current = hlsInstance;
      } else {
        hlsRefB.current = hlsInstance;
      }

      hlsInstance.loadSource(url);
      hlsInstance.attachMedia(targetVideo);

      hlsInstance.on(Hls.Events.MANIFEST_PARSED, onReady);
      hlsInstance.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hlsInstance.startLoad();
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hlsInstance.recoverMediaError();
          } else {
            handleFailover();
          }
        }
      });
    } else if (targetVideo.canPlayType('application/vnd.apple.mpegurl') || !url.includes('.m3u8')) {
      targetVideo.src = url;
      const metadataHandler = () => {
        onReady();
        targetVideo.removeEventListener('loadedmetadata', metadataHandler);
      };
      const errorHandler = () => {
        handleFailover();
        targetVideo.removeEventListener('error', errorHandler);
      };
      targetVideo.addEventListener('loadedmetadata', metadataHandler);
      targetVideo.addEventListener('error', errorHandler);
    } else {
      setErrorMessage('Browser does not support HLS streaming.');
      setIsLoading(false);
    }

    return () => {
      clearStallTimer();
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    };
  }, [currentIdx, servers]);

  const cleanupPlayer = (player) => {
    if (player === 'A') {
      if (hlsRefA.current) {
        hlsRefA.current.destroy();
        hlsRefA.current = null;
      }
      if (videoRefA.current) {
        videoRefA.current.removeAttribute('src');
        videoRefA.current.load();
      }
    } else {
      if (hlsRefB.current) {
        hlsRefB.current.destroy();
        hlsRefB.current = null;
      }
      if (videoRefB.current) {
        videoRefB.current.removeAttribute('src');
        videoRefB.current.load();
      }
    }
  };

  // Sync controls to active player events
  const handlePlay = () => {
    setIsPlaying(true);
    clearStallTimer();
  };

  const handlePause = () => {
    setIsPlaying(false);
    clearStallTimer();
  };

  const handleTimeUpdate = (e) => {
    const video = e.currentTarget;
    if (activePlayer === 'A' && video !== videoRefA.current) return;
    if (activePlayer === 'B' && video !== videoRefB.current) return;

    clearStallTimer();
    
    if (video.duration && video.duration !== Infinity) {
      setProgress((video.currentTime / video.duration) * 100);
      const mins = Math.floor(video.currentTime / 60).toString().padStart(2, '0');
      const secs = Math.floor(video.currentTime % 60).toString().padStart(2, '0');
      const durMins = Math.floor(video.duration / 60).toString().padStart(2, '0');
      const durSecs = Math.floor(video.duration % 60).toString().padStart(2, '0');
      setPlaybackTime(`${mins}:${secs} / ${durMins}:${durSecs}`);
    } else {
      setProgress(0);
      const mins = Math.floor(video.currentTime / 60).toString().padStart(2, '0');
      const secs = Math.floor(video.currentTime % 60).toString().padStart(2, '0');
      setPlaybackTime(`${mins}:${secs}`);
    }

    if (video.buffered.length > 0 && video.duration) {
      const bufferedEnd = video.buffered.end(video.buffered.length - 1);
      setBuffer((bufferedEnd / video.duration) * 100);
    } else {
      setBuffer(0);
    }
  };

  const togglePlay = () => {
    const active = activePlayer === 'A' ? videoRefA.current : videoRefB.current;
    if (!active) return;
    if (isPlaying) {
      active.pause();
    } else {
      active.play().catch(() => {});
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (videoRefA.current) {
      videoRefA.current.volume = val;
      videoRefA.current.muted = val === 0;
    }
    if (videoRefB.current) {
      videoRefB.current.volume = val;
      videoRefB.current.muted = val === 0;
    }
  };

  const toggleMute = () => {
    const targetMuted = !isMuted;
    setIsMuted(targetMuted);
    if (videoRefA.current) videoRefA.current.muted = targetMuted;
    if (videoRefB.current) videoRefB.current.muted = targetMuted;
  };

  const handleSeek = (e) => {
    const active = activePlayer === 'A' ? videoRefA.current : videoRefB.current;
    if (!active || !active.duration || active.duration === Infinity) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const seekTime = (clickX / rect.width) * active.duration;
    active.currentTime = seekTime;
  };

  const handleFullscreen = () => {
    const wrapper = document.getElementById('react-video-wrapper');
    if (!wrapper) return;
    if (!document.fullscreenElement) {
      wrapper.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  };

  const currentServer = servers[currentIdx];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.branding}>
          <span className={styles.trophy}>🏆</span>
          <h1>ZID VAI ON AIR X WC 2026</h1>
        </div>
        <div className={styles.matchStatus}>
          <span className={styles.livePulse}></span>
          <span>{currentServer ? `LIVE Feed: ${currentServer.name}` : 'Ready'}</span>
        </div>
      </header>

      <div id="react-video-wrapper" className={styles.videoWrapper}>
        <video
          ref={videoRefA}
          className={`${styles.videoPlayer} ${activePlayer === 'A' ? styles.visible : styles.hidden}`}
          onPlay={handlePlay}
          onPause={handlePause}
          onTimeUpdate={handleTimeUpdate}
          onWaiting={startStallTimer}
          onPlaying={clearStallTimer}
          playsInline
          autoPlay
        />
        <video
          ref={videoRefB}
          className={`${styles.videoPlayer} ${activePlayer === 'B' ? styles.visible : styles.hidden}`}
          onPlay={handlePlay}
          onPause={handlePause}
          onTimeUpdate={handleTimeUpdate}
          onWaiting={startStallTimer}
          onPlaying={clearStallTimer}
          playsInline
          autoPlay
        />

        {isLoading && (
          <div className={styles.overlay}>
            <div className={styles.spinner}></div>
            <p>Buffering Zero-Lag Stream...</p>
          </div>
        )}

        {errorMessage && (
          <div className={styles.errorOverlay}>
            <span>⚠️</span>
            <p>{errorMessage}</p>
            <button onClick={() => setCurrentIdx(currentIdx)}>Retry</button>
          </div>
        )}

        <div className={styles.controls}>
          <div className={styles.timeline} onClick={handleSeek}>
            <div className={styles.bufferBar} style={{ width: `${buffer}%` }} />
            <div className={styles.progressBar} style={{ width: `${progress}%` }} />
          </div>
          <div className={styles.buttonsRow}>
            <div className={styles.leftButtons}>
              <button onClick={togglePlay} className={styles.iconBtn}>
                {isPlaying ? '⏸' : '▶'}
              </button>
              <button onClick={toggleMute} className={styles.iconBtn}>
                {isMuted ? '🔇' : '🔊'}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className={styles.volumeSlider}
              />
              <span className={styles.timeText}>{playbackTime}</span>
            </div>
            <button onClick={handleFullscreen} className={styles.iconBtn}>
              📺
            </button>
          </div>
        </div>
      </div>

      <div className={styles.serverDock}>
        <div className={styles.dockInner}>
          {servers.map((server, idx) => {
            const isDead = healthStatus[server.url] === false;
            const isActive = currentIdx === idx;
            return (
              <button
                key={server.url}
                className={`${styles.dotBtn} ${isActive ? styles.activeDot : ''} ${isDead ? styles.deadDot : ''}`}
                onClick={() => !isDead && setCurrentIdx(idx)}
                title={isDead ? `${server.name} (OFFLINE)` : server.name}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
