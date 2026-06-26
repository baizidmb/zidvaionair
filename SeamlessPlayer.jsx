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

const MOCK_CHAT_USERNAMES = ['GamerPro2026', 'CopaViewer', 'FifaFanatic', 'MonirulFan', 'ZidLiveStream', 'GoalGetter', 'FootyBuff', 'MessiGOAT', 'Cr7Legacy', 'SambaMagic'];
const MOCK_CHAT_MESSAGES = [
  "LET'S GOOOO! WHAT A MATCH!",
  "STREAM IS RUNNING AT 1080P, SO CLEAN!",
  "THE DUAL ENGINE IS INSANE, SWAPPED INSTANTLY FOR ME!",
  "ZID LIVE IS MY GO-TO PORTAL ALWAYS",
  "IS BTV NATIONAL ONLINE?",
  "SOMOY TV FEED IS STABLE TOO",
  "AMAZING QUALITY ON SERVER 1!",
  "GOAL!! WHAT A FINISH!",
  "UNBELIEVABLE SAVE!",
  "PROXY ROUTING TRULY SAVED THE FEED",
  "ZERO LAG DETECTED SO FAR",
  "ANYONE ELSE WATCHING FROM MOBILE?"
];
const MOCK_CHAT_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#a855f7', '#ec4899', '#06b6d4'];

const MOCK_SCHEDULE = [
  { id: 1, homeTeam: 'Brazil', awayTeam: 'Scotland', homeInit: 'BR', awayInit: 'SC', score1: 3, score2: 1, status: 'live', timeLabel: 'Live Now' },
  { id: 2, homeTeam: 'Morocco', awayTeam: 'Haiti', homeInit: 'MA', awayInit: 'HT', score1: 0, score2: 0, status: 'live', timeLabel: 'Live Now' },
  { id: 3, homeTeam: 'Ecuador', awayTeam: 'Germany', homeInit: 'EC', awayInit: 'DE', score1: null, score2: null, status: 'upcoming', timeLabel: '20:00 UTC' },
  { id: 4, homeTeam: 'Japan', awayTeam: 'Sweden', homeInit: 'JP', awayInit: 'SE', score1: null, score2: null, status: 'upcoming', timeLabel: '23:00 UTC' },
  { id: 5, homeTeam: 'Norway', awayTeam: 'France', homeInit: 'NO', awayInit: 'FR', score1: null, score2: null, status: 'upcoming', timeLabel: 'Tomorrow' },
];

export default function SeamlessPlayer({ initialServers = DEFAULT_SERVERS }) {
  const [servers, setServers] = useState(initialServers);
  const [currentIdx, setCurrentIdx] = useState(-1); // -1 means no server selected yet (placeholder active)
  const [activePlayer, setActivePlayer] = useState('A'); // 'A' or 'B'
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState('00:00');
  const [progress, setProgress] = useState(0);
  const [buffer, setBuffer] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState('feeds'); // 'feeds' or 'chat'
  const [chatMessages, setChatMessages] = useState([]);
  const [systemTime, setSystemTime] = useState('00:00:00');
  const [showControls, setShowControls] = useState(true);

  const videoRefA = useRef(null);
  const videoRefB = useRef(null);
  const hlsRefA = useRef(null);
  const hlsRefB = useRef(null);
  const stallTimerRef = useRef(null);
  const fadeTimeoutRef = useRef(null);
  const failoverCountRef = useRef(0);
  const chatContainerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  // System time clock hook
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setSystemTime(now.toLocaleTimeString('en-US', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

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
      const currentActiveUrl = currentIdx >= 0 ? servers[currentIdx]?.url : null;

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

    // Run health check initially after a delay, and then every 30 seconds
    const timeout = setTimeout(runHealthCheck, 3000);
    const interval = setInterval(runHealthCheck, 30000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [servers, currentIdx]);

  // Live Chat Simulator Engine
  useEffect(() => {
    // Generate initial messages
    const initialMsgs = [];
    for (let i = 0; i < 6; i++) {
      initialMsgs.push({
        id: Math.random().toString(36).substr(2, 9),
        user: MOCK_CHAT_USERNAMES[Math.floor(Math.random() * MOCK_CHAT_USERNAMES.length)],
        text: MOCK_CHAT_MESSAGES[Math.floor(Math.random() * MOCK_CHAT_MESSAGES.length)],
        color: MOCK_CHAT_COLORS[Math.floor(Math.random() * MOCK_CHAT_COLORS.length)]
      });
    }
    setChatMessages(initialMsgs);

    const interval = setInterval(() => {
      setChatMessages((prev) => {
        const next = [
          ...prev,
          {
            id: Math.random().toString(36).substr(2, 9),
            user: MOCK_CHAT_USERNAMES[Math.floor(Math.random() * MOCK_CHAT_USERNAMES.length)],
            text: MOCK_CHAT_MESSAGES[Math.floor(Math.random() * MOCK_CHAT_MESSAGES.length)],
            color: MOCK_CHAT_COLORS[Math.floor(Math.random() * MOCK_CHAT_COLORS.length)]
          }
        ];
        if (next.length > 50) {
          next.shift();
        }
        return next;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, activeTab]);

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
    const startIndex = currIdx === -1 ? 0 : currIdx;
    for (let i = 1; i < servers.length; i++) {
      const nextIdx = (startIndex + i) % servers.length;
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

      // Cleanup old player after cross-fade delay
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = setTimeout(() => {
        currentVideo.pause();
        cleanupPlayer(isTargetA ? 'B' : 'A');
        
        // Background load next backup stream on newly freed idle player
        preloadBackup(backupIndex);
      }, 350);
    } else {
      setErrorMessage('ALL BROADCAST FEEDS ARE CURRENTLY OFFLINE. ROUTING ENGINE SUSPENDED.');
      setIsLoading(false);
      failoverCountRef.current = 0;
    }
  };

  // Primary stream loader
  useEffect(() => {
    if (currentIdx === -1) return;
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

  const handleTriggerControls = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  const currentServer = currentIdx >= 0 ? servers[currentIdx] : null;
  const backupIdx = getBackupIndex(currentIdx);
  const backupServer = backupIdx !== null ? servers[backupIdx] : null;

  return (
    <div className={styles.bodyWrapper}>
      {/* Ambient background glows */}
      <div className={styles.ambientGlow1} />
      <div className={styles.ambientGlow2} />

      {/* Main Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <a href="#" className={styles.logoGroup}>
            <span className={styles.liveIndicatorDot} />
            <span className={styles.logoText}>ZID<span className={styles.logoAccent}>LIVE</span></span>
          </a>
          <nav className={styles.navLinks}>
            <a href="#" className={`${styles.navLink} ${styles.navLinkActive}`}>LIVE MATCHES</a>
            <a href="#" className={styles.navLink}>FIXTURES</a>
            <a href="#" className={styles.navLink}>CHANNELS</a>
          </nav>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.headerStats}>
            <span className={styles.statsIcon}><i className="fa-solid fa-users"></i></span>
            <span className={styles.statsCount}>24.5K</span> online
          </div>
          <div className={styles.clockDisplay}>{systemTime}</div>
          <div className={styles.userProfile}>Z</div>
        </div>
      </header>

      {/* Main Suite Layout Container */}
      <div className={styles.mainGrid}>
        
        {/* Left Column: Player, Metadata, and Telemetry */}
        <div className={styles.playerColumn}>
          
          {/* Aspect-Video Player Box */}
          <div 
            id="react-video-wrapper" 
            className={styles.videoPlayerBox}
            onMouseMove={handleTriggerControls}
            onMouseLeave={() => isPlaying && setShowControls(false)}
          >
            {/* Dual Player Engines */}
            <video
              ref={videoRefA}
              className={styles.videoElement}
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
              className={styles.videoElement}
              style={{ opacity: activePlayer === 'B' ? 1 : 0, zIndex: activePlayer === 'B' ? 20 : 10 }}
              onPlay={handlePlay}
              onPause={handlePause}
              onTimeUpdate={handleTimeUpdate}
              onWaiting={startStallTimer}
              onPlaying={clearStallTimer}
              playsInline
              autoPlay
            />

            {/* Unmute Overlay */}
            {isMuted && isPlaying && (
              <div className={styles.unmuteOverlay} onClick={toggleMute}>
                <i className={`fa-solid fa-volume-high ${styles.unmuteIcon}`}></i>
                <span className={styles.unmuteText}>TAP PLAYER TO UNMUTE AUDIO</span>
              </div>
            )}

            {/* Buffer Loader */}
            {isLoading && (
              <div className={styles.loaderOverlay}>
                <div className={styles.spinner} />
                <span className={styles.loaderText}>BUFFERING STREAM...</span>
              </div>
            )}

            {/* Error Overlay */}
            {errorMessage && (
              <div className={styles.errorOverlay}>
                <i className={`fa-solid fa-circle-exclamation ${styles.errorIcon}`}></i>
                <h4 className={styles.errorTitle}>Broadcast Disrupted</h4>
                <p className={styles.errorText}>{errorMessage}</p>
                <button onClick={() => setCurrentIdx(currentIdx === -1 ? 0 : currentIdx)} className={styles.retryBtn}>Retry Feed</button>
              </div>
            )}

            {/* Placeholder Screen */}
            {currentIdx === -1 && (
              <div className={styles.placeholderOverlay}>
                <div className={styles.placeholderPlayBtn} onClick={() => setCurrentIdx(0)}>
                  <i className="fa-solid fa-play"></i>
                </div>
                <h3 className={styles.placeholderTitle}>SELECT MATCH FEED</h3>
                <p className={styles.placeholderText}>Pick one of the live broadcast servers in the sidebar console to begin streaming the Copa matches.</p>
              </div>
            )}

            {/* Custom Video Controls overlay */}
            <div className={`${styles.customControls} ${(!showControls && isPlaying) ? styles.controlsHidden : ''}`}>
              <div className={styles.timelineContainer} onClick={handleSeek}>
                <div className={styles.timelineBuffer} style={{ width: `${buffer}%` }} />
                <div className={styles.timelineProgress} style={{ width: `${progress}%` }} />
              </div>
              <div className={styles.controlsRow}>
                <div className={styles.controlsLeft}>
                  <button onClick={togglePlay} className={styles.controlBtn}>
                    {isPlaying ? <i className="fa-solid fa-pause"></i> : <i className="fa-solid fa-play"></i>}
                  </button>
                  <div className={styles.volumeGroup}>
                    <button onClick={toggleMute} className={styles.controlBtn}>
                      {isMuted ? <i className="fa-solid fa-volume-xmark"></i> : <i className="fa-solid fa-volume-high"></i>}
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
                  </div>
                  <div className={styles.timeBadgeGroup}>
                    <span className={styles.liveBadge}>
                      <span className={styles.livePulseDot} /> LIVE
                    </span>
                    <span className={styles.elapsedTime}>{playbackTime}</span>
                  </div>
                </div>
                <div className={styles.controlsRight}>
                  <button onClick={handleFullscreen} className={styles.controlBtn}>
                    <i className="fa-solid fa-expand"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Details & diagnostics panel */}
          <div className={styles.detailsCard}>
            <div className={styles.detailsHeader}>
              <div className={styles.detailsChannelInfo}>
                <div className={styles.channelIconBox}>
                  <i className="fa-solid fa-satellite-dish"></i>
                </div>
                <div>
                  <h1 className={styles.streamTitle}>{currentServer ? currentServer.name : 'NO BROADCAST LOADED'}</h1>
                  <p className={styles.streamDesc}>{currentServer ? currentServer.detail : 'Please select an active broadcast feed in the right sidebar.'}</p>
                </div>
              </div>
              <div className={styles.detailsActions}>
                <button className={styles.followBtn}><i className="fa-solid fa-heart"></i> Follow</button>
                <button className={styles.shareBtn}><i className="fa-solid fa-share"></i> Share</button>
              </div>
            </div>

            {/* Diagnostic collapsible dropdown */}
            <details className={styles.diagnosticsAccordion}>
              <summary className={styles.diagnosticsSummary}>
                <span>STREAM DIAGNOSTICS & TELEMETRY</span>
                <i className={`fa-solid fa-chevron-down ${styles.accordionChevron}`}></i>
              </summary>
              <div className={styles.diagnosticsContent}>
                <div className={styles.diagCell}>
                  <span className={styles.diagLabel}>DECK CONTROLLER</span>
                  <span className={styles.diagValue}>{currentIdx >= 0 ? `PRIMARY ENGINE ${activePlayer}` : 'STANDBY'}</span>
                </div>
                <div className={styles.diagCell}>
                  <span className={styles.diagLabel}>STANDBY ENGINE</span>
                  <span className={`${styles.diagValue} ${styles.textGreen}`}>{backupServer ? 'PRE-BUFFERED' : 'NONE'}</span>
                </div>
                <div className={styles.diagCell}>
                  <span className={styles.diagLabel}>FEED SPEC</span>
                  <span className={styles.diagValue}>
                    {currentServer?.latency ? `LATENCY: ${Math.round(currentServer.latency)}ms` : 'LATENCY TESTING...'}
                  </span>
                </div>
                <div className={styles.diagCell}>
                  <span className={styles.diagLabel}>PRELOAD QUEUE</span>
                  <span className={`${styles.diagValue} ${styles.textCyan}`}>{backupServer ? backupServer.name : 'NONE PRELOADED'}</span>
                </div>
              </div>
            </details>
          </div>
        </div>

        {/* Right Column: Tabbed Sidebar */}
        <div className={styles.sidebarColumn}>
          <div className={styles.sidebarConsole}>
            {/* Tabs */}
            <div className={styles.tabHeaders}>
              <button 
                className={`${styles.tabBtn} ${activeTab === 'feeds' ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab('feeds')}
              >
                Live Feeds
              </button>
              <button 
                className={`${styles.tabBtn} ${activeTab === 'chat' ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab('chat')}
              >
                Live Chat
              </button>
            </div>

            {/* Tab Panels */}
            <div className={styles.tabContentPanel}>
              
              {/* Feeds Panel */}
              {activeTab === 'feeds' && (
                <div className={styles.feedsPanel}>
                  {servers.map((srv, idx) => {
                    const isActive = currentIdx === idx;
                    const isDead = srv.status === 'offline';
                    let statusColor = styles.statusGreen;
                    if (srv.status === 'amber') statusColor = styles.statusAmber;
                    else if (srv.status === 'offline') statusColor = styles.statusRed;

                    return (
                      <div
                        key={srv.url}
                        className={`${styles.serverCard} ${isActive ? styles.serverCardActive : ''} ${isDead ? styles.serverCardDead : ''}`}
                        onClick={() => !isDead && setCurrentIdx(idx)}
                      >
                        <div className={styles.serverThumb}>
                          {srv.badge || 'HD'}
                        </div>
                        <div className={styles.serverCardDetails}>
                          <span className={styles.serverCardName}>{srv.name}</span>
                          <span className={styles.serverCardDesc}>{srv.detail}</span>
                        </div>
                        <div className={styles.serverCardStatus}>
                          <span className={styles.latencyValue}>
                            {srv.latency && srv.latency < 9999 ? `${Math.round(srv.latency)}ms` : 'offline'}
                          </span>
                          <span className={`${styles.statusDot} ${statusColor}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Chat Panel */}
              {activeTab === 'chat' && (
                <div className={styles.chatPanel}>
                  <div ref={chatContainerRef} className={styles.chatMessagesContainer}>
                    {chatMessages.map((msg) => (
                      <div key={msg.id} className={styles.chatBubble}>
                        <span className={styles.chatUsername} style={{ color: msg.color }}>{msg.user}:</span>
                        <span className={styles.chatMessageText}>{msg.text}</span>
                      </div>
                    ))}
                  </div>
                  <div className={styles.chatInputBar}>
                    <input 
                      type="text" 
                      placeholder="Send a message..." 
                      className={styles.chatInputField} 
                      disabled 
                    />
                    <button className={styles.chatSendBtn} disabled>
                      <i className="fa-solid fa-paper-plane"></i>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Live Matches & Upcoming Schedule Section */}
      <section className={styles.scheduleSection}>
        <h2 className={styles.sectionTitle}>
          <i className="fa-solid fa-calendar-days"></i> Live matches & schedule
        </h2>
        <div className={styles.scheduleGrid}>
          {MOCK_SCHEDULE.map((match) => {
            const isLive = match.status === 'live';
            return (
              <div 
                key={match.id} 
                className={`${styles.scheduleCard} ${isLive ? styles.scheduleCardLive : ''}`}
              >
                <div className={styles.scheduleCardTeams}>
                  <div className={styles.teamRow}>
                    <div className={styles.teamInfo}>
                      <span className={styles.teamInitialsBadge}>{match.homeInit}</span>
                      <span className={styles.teamName} title={match.homeTeam}>{match.homeTeam}</span>
                    </div>
                    {match.score1 !== null ? (
                      <span className={styles.teamScore}>{match.score1}</span>
                    ) : (
                      <span className={styles.teamScorePlaceholder}>-</span>
                    )}
                  </div>
                  <div className={styles.teamRow}>
                    <div className={styles.teamInfo}>
                      <span className={styles.teamInitialsBadge}>{match.awayInit}</span>
                      <span className={styles.teamName} title={match.awayTeam}>{match.awayTeam}</span>
                    </div>
                    {match.score2 !== null ? (
                      <span className={styles.teamScore}>{match.score2}</span>
                    ) : (
                      <span className={styles.teamScorePlaceholder}>-</span>
                    )}
                  </div>
                </div>
                <div className={styles.scheduleCardFooter}>
                  <span className={`${styles.statusBadge} ${isLive ? styles.statusBadgeLive : styles.statusBadgeUpcoming}`}>
                    {match.status.toUpperCase()}
                  </span>
                  {isLive ? (
                    <button 
                      onClick={() => setCurrentIdx(0)} 
                      className={styles.tuneInBtn}
                    >
                      Tune In
                    </button>
                  ) : (
                    <span className={styles.upcomingTime}>{match.timeLabel}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div>© 2026 COPASTREAM. ALL FEEDS PRIVATELY ENCODED.</div>
        <div>
          DEVELOPED BY <span className={styles.footerAuthor}>SHAHIDUL ISLAM BAIZID</span>
        </div>
      </footer>
    </div>
  );
}
