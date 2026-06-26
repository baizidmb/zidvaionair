import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import styles from './SeamlessPlayer.module.css';

// Default mock server stream links for reference
const DEFAULT_SERVERS = [
  { name: 'Server 1 (World Cup Live)', url: 'https://sm-monirul.top/tof/live/toffee6/index.m3u8', detail: 'Primary Match Broadcast', badge: '1080p' },
  { name: 'Server 2 (Sports Network)', url: 'https://sm-monirul.top/tof/live/toffee5/index.m3u8', detail: 'Secondary Match Broadcast', badge: '1080p' },
  { name: 'Server 3 (Alternate HD)', url: 'https://sm-monirul.top/tof/live/toffee1/index.m3u8', detail: 'Alternate Sports Feed', badge: '720p' },
  { name: 'Server 4 (BTV National)', url: 'https://sm-monirul.top/toffee/play/btv_national.m3u8', detail: 'BTV National Live Broadcast', badge: '720p' },
  { name: 'Server 5 (Somoy TV)', url: 'https://sm-monirul.top/toffee/play/somoy_tv.m3u8', detail: 'Somoy TV News Feed', badge: '720p' },
];

export default function SeamlessPlayer({ initialServers = DEFAULT_SERVERS }) {
  const [servers, setServers] = useState(initialServers);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [activePlayer, setActivePlayer] = useState('A'); // 'A' or 'B'
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState('00:00');
  const [progress, setProgress] = useState(0);
  const [buffer, setBuffer] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [sentimentVal, setSentimentVal] = useState(78);

  const videoRefA = useRef(null);
  const videoRefB = useRef(null);
  const hlsRefA = useRef(null);
  const hlsRefB = useRef(null);
  const stallTimerRef = useRef(null);
  const fadeTimeoutRef = useRef(null);
  const failoverCountRef = useRef(0);

  // Background health check & sorting
  useEffect(() => {
    async function checkHealth(url) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const start = performance.now();
      try {
        await fetch(url, { method: 'GET', mode: 'no-cors', signal: controller.signal });
        const latency = performance.now() - start;
        clearTimeout(timeoutId);
        return { online: true, latency };
      } catch {
        clearTimeout(timeoutId);
        return { online: false, latency: 9999 };
      }
    }

    async function runHealthCheck() {
      console.log('🔄 Telemetry Sweep: Performing background ping check...');
      
      const currentActiveUrl = servers[currentIdx]?.url;

      const checkedServers = await Promise.all(
        servers.map(async (server) => {
          const res = await checkHealth(server.url);
          return {
            ...server,
            latency: res.latency,
            status: res.online ? (res.latency < 1000 ? 'online' : 'amber') : 'offline',
            isDead: !res.online
          };
        })
      );

      // Sort: Online/Amber first, Offline at bottom
      const activeGroup = checkedServers.filter(s => s.status !== 'offline');
      const offlineGroup = checkedServers.filter(s => s.status === 'offline');
      const sorted = [...activeGroup, ...offlineGroup];

      setServers(sorted);

      // Restore current active index based on URL
      if (currentActiveUrl) {
        const newIdx = sorted.findIndex(s => s.url === currentActiveUrl);
        if (newIdx !== -1) {
          setCurrentIdx(newIdx);
        }
      }
    }

    // Run health check initially and then every 30 seconds
    const timeout = setTimeout(runHealthCheck, 3000);
    const interval = setInterval(runHealthCheck, 30000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [servers, currentIdx]);

  // Stall detector
  const startStallTimer = () => {
    clearStallTimer();
    stallTimerRef.current = setTimeout(() => {
      console.warn('[Stall Monitor] Stream stalled. Swapping to preloaded backup...');
      handleFailover();
    }, 4000);
  };

  const clearStallTimer = () => {
    if (stallTimerRef.current) {
      clearTimeout(stallTimerRef.current);
      stallTimerRef.current = null;
    }
  };

  const getBackupIndex = (currIdx) => {
    if (servers.length <= 1) return null;
    for (let i = 1; i < servers.length; i++) {
      const nextIdx = (currIdx + i) % servers.length;
      if (servers[nextIdx] && servers[nextIdx].status !== 'offline') {
        return nextIdx;
      }
    }
    return null;
  };

  const handleFailover = () => {
    failoverCountRef.current++;
    const backupIndex = getBackupIndex(currentIdx);

    if (backupIndex !== null && failoverCountRef.current < servers.length) {
      const backupServer = servers[backupIndex];
      const isTargetA = activePlayer === 'B';
      const targetVideo = isTargetA ? videoRefA.current : videoRefB.current;
      const currentVideo = isTargetA ? videoRefB.current : videoRefA.current;

      console.warn(`[Failover] Routing hot-switch to backup: ${backupServer.name}`);

      // Sync settings
      targetVideo.volume = volume;
      targetVideo.muted = isMuted;

      // Play backup
      targetVideo.play().catch(() => {});

      // Cross-fade
      targetVideo.style.opacity = '1';
      targetVideo.style.zIndex = '20';
      currentVideo.style.opacity = '0';
      currentVideo.style.zIndex = '10';

      setActivePlayer(isTargetA ? 'A' : 'B');
      setCurrentIdx(backupIndex);

      // Randomize sentiment values for industrial realism
      setSentimentVal(Math.round(70 + Math.random() * 20));

      // Cleanup old player after cross-fade delay
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = setTimeout(() => {
        currentVideo.pause();
        cleanupPlayer(isTargetA ? 'B' : 'A');
        
        // Background load next backup stream on newly freed idle player
        preloadBackup(backupIndex);
      }, 350);
    } else {
      setErrorMessage('ALL BROADCAST TERMINAL FEEDS OFFLINE.');
      setIsLoading(false);
      failoverCountRef.current = 0;
    }
  };

  // Primary stream loader
  useEffect(() => {
    const url = servers[currentIdx]?.url;
    if (!url) return;

    setIsLoading(true);
    setErrorMessage('');
    startStallTimer();

    const isTargetA = activePlayer === 'A';
    const targetVideo = isTargetA ? videoRefA.current : videoRefB.current;
    const currentVideo = isTargetA ? videoRefB.current : videoRefA.current;

    cleanupPlayer(activePlayer);

    let hlsInstance = null;
    let isReady = false;

    function onReady() {
      if (isReady) return;
      isReady = true;
      clearStallTimer();
      setIsLoading(false);

      targetVideo.volume = volume;
      targetVideo.muted = isMuted;

      targetVideo.play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          targetVideo.muted = true;
          setIsMuted(true);
          setVolume(0);
          targetVideo.play().then(() => setIsPlaying(true));
        });

      targetVideo.style.opacity = '1';
      targetVideo.style.zIndex = '20';

      currentVideo.style.opacity = '0';
      currentVideo.style.zIndex = '10';

      preloadBackup(currentIdx);
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
    };
  }, [currentIdx]);

  // Preload secondary backup on idle player
  const preloadBackup = (activeIdx) => {
    const backupIndex = getBackupIndex(activeIdx);
    if (backupIndex === null) return;

    const backupServer = servers[backupIndex];
    const isIdleA = activePlayer === 'B';
    const idleVideo = isIdleA ? videoRefA.current : videoRefB.current;

    cleanupPlayer(isIdleA ? 'A' : 'B');

    idleVideo.muted = true;
    idleVideo.style.opacity = '0';
    idleVideo.style.zIndex = '10';

    if (Hls.isSupported() && backupServer.url.includes('.m3u8')) {
      const tempHls = new Hls({
        maxMaxBufferLength: 5,
        enableWorker: true,
        lowLatencyMode: true,
        autoStartLoad: true
      });

      if (isIdleA) {
        hlsRefA.current = tempHls;
      } else {
        hlsRefB.current = tempHls;
      }

      tempHls.loadSource(backupServer.url);
      tempHls.attachMedia(idleVideo);
    } else if (idleVideo.canPlayType('application/vnd.apple.mpegurl') || !backupServer.url.includes('.m3u8')) {
      idleVideo.src = backupServer.url;
      idleVideo.load();
    }
  };

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

  // Player handlers
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
      setPlaybackTime(`${mins}:${secs}`);
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
  const backupIdx = getBackupIndex(currentIdx);
  const backupServer = backupIdx !== null ? servers[backupIdx] : null;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.branding}>
          <span className={styles.ledIndicator} style={{ backgroundColor: '#39ff14', boxShadow: '0 0 6px #39ff14' }} />
          <h1>ZID VAI ON AIR X WC 2026</h1>
          <span className={styles.badge}>BROADCAST DECK v2.4</span>
        </div>
        <div className={styles.matchStatus}>
          <span className={styles.pulseDot} />
          <span>{currentServer ? `FEED: ${currentServer.name}` : 'ESTABLISHING...'}</span>
        </div>
      </header>

      <div className={styles.mainGrid}>
        {/* Left Column: Player & Info */}
        <div className={styles.playerColumn}>
          <div className={styles.controlRoomFrame}>
            <div className={styles.topStatusStrip}>
              <div>DECK SELECTOR: <strong>PRIMARY ENGINE {activePlayer}</strong></div>
              <div>BACKUP STATUS: <strong style={{ color: '#39ff14' }}>{backupServer ? 'STANDBY READY' : 'N/A'}</strong></div>
            </div>

            <div id="react-video-wrapper" className={styles.videoWrapper}>
              <video
                ref={videoRefA}
                className={`${styles.videoPlayer}`}
                style={{ opacity: activePlayer === 'A' ? 1 : 0, zIndex: activePlayer === 'A' ? 20 : 10 }}
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
                className={`${styles.videoPlayer}`}
                style={{ opacity: activePlayer === 'B' ? 1 : 0, zIndex: activePlayer === 'B' ? 20 : 10 }}
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
                  <div className={styles.spinner} />
                  <p>ESTABLISHING CONCURRENT FEED...</p>
                </div>
              )}

              {errorMessage && (
                <div className={styles.errorOverlay}>
                  <span>⚠️</span>
                  <p>{errorMessage}</p>
                  <button onClick={() => setCurrentIdx(currentIdx)} className={styles.rebootBtn}>FORCE FEED REBOOT</button>
                </div>
              )}
            </div>

            <div className={styles.controlsPanel}>
              <div className={styles.timeline} onClick={handleSeek}>
                <div className={styles.bufferBar} style={{ width: `${buffer}%` }} />
                <div className={styles.progressBar} style={{ width: `${progress}%` }} />
              </div>
              <div className={styles.buttonsStrip}>
                <div className={styles.leftButtons}>
                  <button onClick={togglePlay} className={styles.actionBtn}>
                    {isPlaying ? '⏸ PAUSE' : '▶ PLAY'}
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
                <div className={styles.rightButtons}>
                  <button onClick={handleFullscreen} className={styles.iconBtn}>📺 FULLSCREEN</button>
                </div>
              </div>
            </div>
          </div>

          {/* Metadata Card */}
          <div className={styles.metadataCard}>
            <div className={styles.metadataHeader}>MATCH METADATA & TELEMETRY</div>
            <div className={styles.metadataGrid}>
              <div className={styles.metaCell}>
                <span className={styles.cellLabel}>MATCH EVENT</span>
                <strong className={styles.cellValue}>{currentServer ? currentServer.name : 'NO MATCH SELECTED'}</strong>
                <span className={styles.cellSub}>{currentServer ? currentServer.detail : 'SELECT CONSOLE ROW'}</span>
              </div>
              <div className={styles.metaCell}>
                <span className={styles.cellLabel}>AUDIENCE SENTIMENT</span>
                <div className={styles.sentimentRow}>
                  <span className={styles.sentimentPercent} style={{ color: '#39ff14' }}>{sentimentVal}% POSITIVE</span>
                  <div className={styles.sentimentTrack}>
                    <div className={styles.sentimentBar} style={{ width: `${sentimentVal}%` }} />
                  </div>
                </div>
              </div>
              <div className={styles.metaCell}>
                <span className={styles.cellLabel}>SYSTEM ROUTING</span>
                <strong className={styles.cellValue} style={{ color: '#00e5ff' }}>
                  {currentServer?.latency ? `LATENCY: ${Math.round(currentServer.latency)}ms` : 'LATENCY: DIRECT / STABLE'}
                </strong>
                <span className={styles.cellSub}>
                  {backupServer ? `PRELOAD: ${backupServer.name}` : 'PRELOAD: EMPTY'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Server Dashboard */}
        <div className={styles.serverColumn}>
          <div className={styles.serverDashboardConsole}>
            <div className={styles.consoleTitleBar}>
              <span className={styles.ledIndicator} style={{ backgroundColor: '#00e5ff', boxShadow: '0 0 6px #00e5ff' }} />
              <h2>SERVER CONTROL CONSOLE</h2>
            </div>
            
            <div className={styles.consoleHeaders}>
              <span className={styles.colName}>SERVER FEED NAME</span>
              <span className={styles.colQuality}>QUALITY</span>
              <span className={styles.colStatus}>STATUS/PING</span>
            </div>

            <div className={styles.serverStack}>
              {servers.map((srv, idx) => {
                const isActive = currentIdx === idx;
                const isDead = srv.status === 'offline';
                
                let ledStyle = { backgroundColor: '#39ff14', boxShadow: '0 0 6px #39ff14' };
                let pingText = srv.latency ? `${Math.round(srv.latency)}ms` : 'online';
                if (srv.status === 'amber') {
                  ledStyle = { backgroundColor: '#ff9f0a', boxShadow: '0 0 6px #ff9f0a' };
                } else if (srv.status === 'offline') {
                  ledStyle = { backgroundColor: '#ff2d55', boxShadow: '0 0 6px #ff2d55' };
                  pingText = 'OFFLINE';
                }

                return (
                  <div
                    key={srv.url}
                    className={`${styles.serverRow} ${isActive ? styles.activeRow : ''} ${isDead ? styles.deadRow : ''}`}
                    onClick={() => !isDead && setCurrentIdx(idx)}
                  >
                    <span className={styles.rowName}>{srv.name}</span>
                    <span className={styles.rowQuality}>{srv.badge ? srv.badge.toUpperCase() : 'HD'}</span>
                    <span className={styles.rowStatus}>
                      {pingText}
                      <span className={styles.rowLed} style={ledStyle} />
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <footer className={styles.footer}>
        <div>© 2026 COPASTREAM TERMINAL. ALL FEEDS INTENDED FOR PRIVATE MONITORING.</div>
        <div>DEVELOPED BY <strong>SHAHIDUL ISLAM BAIZID</strong></div>
      </footer>
    </div>
  );
}
