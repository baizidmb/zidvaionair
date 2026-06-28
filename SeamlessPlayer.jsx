import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import styles from './SeamlessPlayer.module.css';

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
const MOCK_CHAT_COLORS = ['#ff7a00', '#3b82f6', '#10b981', '#ff9f0a', '#a855f7', '#ec4899', '#ef4444'];

const MOCK_SCHEDULE = [
  { id: 1, homeTeam: 'Brazil', awayTeam: 'Scotland', homeInit: 'BR', awayInit: 'SC', score1: 3, score2: 1, status: 'live', kickoffUtc: new Date(Date.now() - 3600000).toISOString() },
  { id: 2, homeTeam: 'Morocco', awayTeam: 'Haiti', homeInit: 'MA', awayInit: 'HT', score1: 0, score2: 0, status: 'live', kickoffUtc: new Date(Date.now() - 1800000).toISOString() },
  { id: 3, homeTeam: 'Ecuador', awayTeam: 'Germany', homeInit: 'EC', awayInit: 'DE', score1: null, score2: null, status: 'upcoming', kickoffUtc: new Date(Date.now() + 7200000).toISOString() },
  { id: 4, homeTeam: 'Japan', awayTeam: 'Sweden', homeInit: 'JP', awayInit: 'SE', score1: null, score2: null, status: 'upcoming', kickoffUtc: new Date(Date.now() + 18000000).toISOString() },
  { id: 5, homeTeam: 'Norway', awayTeam: 'France', homeInit: 'NO', awayInit: 'FR', score1: null, score2: null, status: 'upcoming', kickoffUtc: new Date(Date.now() + 86400000).toISOString() },
];

export default function SeamlessPlayer() {
  const [streamUrl, setStreamUrl] = useState('https://sm-monirul.top/toffee/play/FIFA-2026-1.m3u8');
  const [messiIndex, setMessiIndex] = useState(0);
  const [messiFade, setMessiFade] = useState(false);
  const handleSetMessiIndex = (idx) => {
    setMessiFade(true);
    setTimeout(() => {
      setMessiIndex(idx);
      setMessiFade(false);
    }, 150);
  };
  const [activePlayer, setActivePlayer] = useState('A'); // 'A' or 'B'
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState('00:00');
  const [progress, setProgress] = useState(0);
  const [buffer, setBuffer] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [localUsername, setLocalUsername] = useState(() => {
    return localStorage.getItem('zid_chat_username') || 'Viewer_' + Math.floor(1000 + Math.random() * 9000);
  });
  const [localUserColor, setLocalUserColor] = useState(() => {
    return localStorage.getItem('zid_chat_color') || MOCK_CHAT_COLORS[Math.floor(Math.random() * MOCK_CHAT_COLORS.length)];
  });
  const [inputText, setInputText] = useState('');
  const [systemTime, setSystemTime] = useState('00:00:00');
  const [timezoneLabel, setTimezoneLabel] = useState('UTC');
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
  const displayedMessageIdsRef = useRef(new Set());

  useEffect(() => {
    localStorage.setItem('zid_chat_username', localUsername);
    localStorage.setItem('zid_chat_color', localUserColor);
  }, [localUsername, localUserColor]);

  // Region-aware Clock sync
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setSystemTime(now.toLocaleTimeString('en-US', { hour12: false }));
      
      try {
        const parts = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' }).formatToParts(now);
        const tzPart = parts.find(p => p.type === 'timeZoneName');
        if (tzPart) {
          setTimezoneLabel(tzPart.value);
        }
      } catch (e) {
        const offset = -now.getTimezoneOffset() / 60;
        const sign = offset >= 0 ? '+' : '';
        setTimezoneLabel(`GMT${sign}${offset}`);
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Empty hook since feeds load loop is deleted
  useEffect(() => {}, []);

  // Live Chat Subscription & Simulator
  useEffect(() => {
    const initialMsgs = [];
    for (let i = 0; i < 5; i++) {
      initialMsgs.push({
        id: Math.random().toString(36).substr(2, 9),
        user: MOCK_CHAT_USERNAMES[Math.floor(Math.random() * MOCK_CHAT_USERNAMES.length)],
        text: MOCK_CHAT_MESSAGES[Math.floor(Math.random() * MOCK_CHAT_MESSAGES.length)],
        color: MOCK_CHAT_COLORS[Math.floor(Math.random() * MOCK_CHAT_COLORS.length)]
      });
    }
    setChatMessages(initialMsgs);

    const simInterval = setInterval(() => {
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
        if (next.length > 80) next.shift();
        return next;
      });
    }, 18000);

    let eventSource;
    try {
      eventSource = new EventSource('https://ntfy.sh/zidvaionair_chat_2026/sse');
      
      const handleMessageEvent = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event === 'message' && data.message) {
            const payload = JSON.parse(data.message);
            if (payload.id && displayedMessageIdsRef.current.has(payload.id)) {
              return;
            }
            if (payload.id) {
              displayedMessageIdsRef.current.add(payload.id);
            }
            if (payload.system) {
              setChatMessages((prev) => {
                const next = [...prev, { id: payload.id || data.id || Math.random().toString(), system: true, text: payload.text }];
                if (next.length > 80) next.shift();
                return next;
              });
            } else {
              setChatMessages((prev) => {
                const next = [
                  ...prev,
                  {
                    id: payload.id || data.id || Math.random().toString(),
                    user: payload.user,
                    text: payload.text,
                    color: payload.color
                  }
                ];
                if (next.length > 80) next.shift();
                return next;
              });
            }
          }
        } catch (e) {
          try {
            const data = JSON.parse(event.data);
            if (data.event === 'message' && data.message) {
              setChatMessages((prev) => {
                const next = [
                  ...prev,
                  {
                    id: data.id || Math.random().toString(),
                    user: 'Viewer',
                    text: data.message,
                    color: '#ff7a00'
                  }
                ];
                if (next.length > 80) next.shift();
                return next;
              });
            }
          } catch(err) {}
        }
      };

      eventSource.onmessage = handleMessageEvent;
      eventSource.addEventListener('message', handleMessageEvent);
    } catch (err) {
      console.error(err);
    }

    return () => {
      clearInterval(simInterval);
      if (eventSource) eventSource.close();
    };
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, activeTab]);

  // Stall detector & failover switcher
  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    const msgId = 'user_' + Math.random().toString(36).substr(2, 9);
    
    // Add to displayed Set and render locally immediately for instant feedback
    displayedMessageIdsRef.current.add(msgId);
    setChatMessages((prev) => {
      const next = [
        ...prev,
        {
          id: msgId,
          user: localUsername,
          text: inputText.trim(),
          color: localUserColor
        }
      ];
      if (next.length > 80) next.shift();
      return next;
    });

    const payload = {
      id: msgId,
      user: localUsername,
      text: inputText.trim(),
      color: localUserColor
    };

    fetch('https://ntfy.sh/zidvaionair_chat_2026', {
      method: 'POST',
      body: JSON.stringify(payload)
    }).catch(e => {
      console.warn('React Chat Send Failed, relying on local view:', e);
      // Trigger a simulated reply after 1.5 seconds to keep chat alive
      setTimeout(() => {
        setChatMessages((prev) => {
          const next = [
            ...prev,
            {
              id: 'sim_reply_' + Math.random().toString(36).substr(2, 9),
              user: MOCK_CHAT_USERNAMES[Math.floor(Math.random() * MOCK_CHAT_USERNAMES.length)],
              text: "Smooth stream! Zero buffering for me.",
              color: MOCK_CHAT_COLORS[Math.floor(Math.random() * MOCK_CHAT_COLORS.length)]
            }
          ];
          if (next.length > 80) next.shift();
          return next;
        });
      }, 1500);
    });

    setInputText('');
  };

  const changeUsername = () => {
    const newName = prompt('Enter your new username (max 15 chars):', localUsername);
    if (newName && newName.trim()) {
      const cleaned = newName.trim().substring(0, 15);
      fetch('https://ntfy.sh/zidvaionair_chat_2026', {
        method: 'POST',
        body: JSON.stringify({
          system: true,
          text: `${localUsername} changed their name to ${cleaned}`
        })
      }).catch(() => {});
      setLocalUsername(cleaned);
    }
  };

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

  const handleFailover = () => {
    setErrorMessage('ALL BROADCAST FEEDS ARE CURRENTLY OFFLINE.');
    setIsLoading(false);
  };

  // Primary stream loader
  useEffect(() => {
    if (!streamUrl) return;

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
    }

    if (Hls.isSupported() && streamUrl.includes('.m3u8')) {
      hlsInstance = new Hls({
        maxMaxBufferLength: 10,
        enableWorker: false,
        lowLatencyMode: true,
        capLevelToPlayerSize: true,
        maxBufferHole: 2
      });

      if (isTargetA) {
        hlsRefA.current = hlsInstance;
      } else {
        hlsRefB.current = hlsInstance;
      }

      hlsInstance.loadSource(streamUrl);
      hlsInstance.attachMedia(targetVideo);

      const handleNativeReady = () => {
        onReady();
        targetVideo.removeEventListener('loadedmetadata', handleNativeReady);
        targetVideo.removeEventListener('canplay', handleNativeReady);
      };
      targetVideo.addEventListener('loadedmetadata', handleNativeReady);
      targetVideo.addEventListener('canplay', handleNativeReady);

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
    } else if (targetVideo.canPlayType('application/vnd.apple.mpegurl') || !streamUrl.includes('.m3u8')) {
      targetVideo.src = streamUrl;
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
  }, [streamUrl]);

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
    
    if (video.duration && video.duration !== Infinity) {
      setProgress((video.currentTime / video.duration) * 100);
      const mins = Math.floor(video.currentTime / 60).toString().padStart(2, '0');
      const secs = Math.floor(video.currentTime % 60).toString().padStart(2, '0');
      setPlaybackTime(`${mins}:${secs}`);
    }

    if (video.buffered.length > 0 && video.duration) {
      const bufferedEnd = video.buffered.end(video.buffered.length - 1);
      setBuffer((bufferedEnd / video.duration) * 100);
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

  const handleSeek = (clientX) => {
    const active = activePlayer === 'A' ? videoRefA.current : videoRefB.current;
    if (!active || !active.duration || active.duration === Infinity) return;
    const timeline = document.getElementById('react-timeline');
    if (!timeline) return;
    const rect = timeline.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const seekTime = Math.max(0, Math.min(active.duration, (clickX / rect.width) * active.duration));
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
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const currentServer = { name: "World Cup Live Feed", detail: "Primary Broadcast Server", url: streamUrl };
  const backupServer = null;

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
            <span className={styles.logoText}>ZID VAI ON AIR <span className={styles.logoAccent}>X WC 2026</span></span>
            <span style={{
              fontSize: '8px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              background: 'linear-gradient(to right, #ff5500, #ffaa00)',
              color: '#ffffff',
              padding: '0.1rem 0.5rem',
              borderRadius: '9999px',
              boxShadow: '0 0 8px rgba(255,85,0,0.4)',
              textTransform: 'uppercase',
              userSelect: 'none',
              fontFamily: 'monospace',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }}>
              Experimental
            </span>
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
          <div className={styles.clockContainer}>
            <span className={styles.clockText}>{systemTime}</span>
            <span className={styles.timezoneLabel}>{timezoneLabel}</span>
          </div>
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
            onTouchStart={handleTriggerControls}
            onClick={(e) => {
              if (e.target.closest('#react-timeline') || e.target.closest('button') || e.target.closest('input')) {
                return;
              }
              setShowControls(prev => !prev);
            }}
          >
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



            {/* Buffer Loader */}
            {isLoading && (
              <div className={styles.loaderOverlay}>
                <div className={styles.spinner} />
                <span className={styles.loaderText}>BUFFERING STREAM...</span>
              </div>
            )}             {/* Error Overlay */}
            {errorMessage && (
              <div className={styles.errorOverlay}>
                <i className={`fa-solid fa-circle-exclamation ${styles.errorIcon}`}></i>
                <h4 className={styles.errorTitle}>Broadcast Disrupted</h4>
                <p className={styles.errorText}>{errorMessage}</p>
                <button onClick={() => setStreamUrl('https://sm-monirul.top/toffee/play/FIFA-2026-1.m3u8')} className={styles.retryBtn}>Retry Feed</button>
              </div>
            )}
            {/* Connecting Placeholder Overlay */}
            {!isPlaying && !errorMessage && (
              <div className={styles.placeholderOverlay}>
                <div className={styles.placeholderPlayBtn} onClick={() => setIsPlaying(true)}>
                  <i className="fa-solid fa-circle-notch animate-spin text-[#ff7a00]"></i>
                </div>
                <h3 className={styles.placeholderTitle}>CONNECTING TO LIVE FEED...</h3>
                <p className={styles.placeholderText}>Tuning in to the live broadcast matches. Please wait.</p>
              </div>
            )}

            {/* Custom Video Controls */}
            <div className={`${styles.customControls} ${(!showControls && isPlaying) ? styles.controlsHidden : ''}`}>
              <div 
                id="react-timeline" 
                className={styles.timelineContainer} 
                onClick={(e) => handleSeek(e.clientX)}
                onTouchStart={(e) => e.touches && e.touches[0] && handleSeek(e.touches[0].clientX)}
              >
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
        </div>

        {/* Right Column: Tabbed Sidebar */}
        <div className={styles.sidebarColumn}>
          <div className={styles.sidebarConsole}>
            {/* Tab Panels */}
            <div className={styles.tabContentPanel}>
              {/* Chat Panel */}
              <div className={styles.chatPanel}>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '0.5rem 0.75rem 0 0.75rem', boxSizing: 'border-box' }}>
                  <span>Global Chat Room</span>
                  <span>Your Name: <span style={{ fontWeight: 700, color: '#ff7a00', cursor: 'pointer', textDecoration: 'underline' }} onClick={changeUsername}>{localUsername}</span></span>
                </div>
                <div ref={chatContainerRef} className={styles.chatMessagesContainer}>
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className={styles.chatBubble}>
                      {msg.system ? (
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', fontSize: '10px' }}>{msg.text}</span>
                      ) : (
                        <>
                          <span className={styles.chatUsername} style={{ color: msg.color }}>{msg.user}:</span>
                          <span className={styles.chatMessageText}>{msg.text}</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                <div className={styles.chatInputBar}>
                  <input 
                    type="text" 
                    placeholder="Send a message..." 
                    className={styles.chatInputField} 
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                  />
                  <button className={styles.chatSendBtn} style={{ opacity: 1, cursor: 'pointer' }} onClick={handleSendMessage}>
                    <i className="fa-solid fa-paper-plane"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messi Funny Memes Slider Section */}
      <section style={{
        backgroundColor: 'rgba(15, 15, 19, 0.85)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        borderRadius: '1rem',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        marginTop: '1.5rem'
      }}>
        <h2 style={{
          fontSize: '0.875rem',
          fontWeight: 800,
          letterSpacing: '0.05em',
          color: 'rgba(255, 255, 255, 0.8)',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontFamily: "'Space Grotesk', sans-serif"
        }}>
          <i className="fa-solid fa-face-laugh-beam" style={{ color: '#ff7a00' }}></i> Fan Zone: Messi Reactions
        </h2>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          padding: '0.5rem 0'
        }}>
          {/* Meme Display Box */}
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '28rem',
            aspectRatio: '16/9',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            borderRadius: '0.75rem',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img 
              src={
                messiIndex === 0 
                  ? 'https://api.memegen.link/images/custom/WHEN_YOU_SWAP_SERVERS/AND_IT_TAKES_0.01_SECONDS.png?background=https://www.pngmart.com/files/22/Lionel-Messi-PNG-Isolated-HD-Transparent.png'
                  : messiIndex === 1
                  ? 'https://api.memegen.link/images/custom/CLOCK_FREEZES_AT_00~00/ANTIGRAVITY_FIXES_IT_INSTANTLY.png?background=https://www.pngmart.com/files/22/Lionel-Messi-PNG-Isolated-HD-Transparent.png'
                  : 'https://api.memegen.link/images/custom/CHAT_SIMULATION_ACTIVE/24K_BOTS_TALKING_TO_THEMSELVES.png?background=https://www.pngmart.com/files/22/Lionel-Messi-PNG-Isolated-HD-Transparent.png'
              } 
              alt="Messi Funny Meme" 
              style={{
                height: '100%',
                objectFit: 'contain',
                transition: 'all 0.3s ease'
              }}
            />
          </div>
          {/* Interactive Segmented Selector */}
          <div style={{
            width: '100%',
            maxWidth: '24rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            alignItems: 'center',
            marginTop: '0.5rem'
          }}>
            <span style={{
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.5)',
              fontWeight: 500,
              fontFamily: "'Space Grotesk', sans-serif"
            }}>
              {
                messiIndex === 0 
                  ? 'Reaction #1: Fast Server Swapping' 
                  : messiIndex === 1 
                  ? 'Reaction #2: Freeze-Proof Clock' 
                  : 'Reaction #3: Simulating 24K Viewer Bots'
              }
            </span>
            <div style={{
              display: 'flex',
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '0.75rem',
              padding: '0.25rem',
              width: '100%',
              position: 'relative',
              userSelect: 'none'
            }}>
              <button 
                onClick={() => handleSetMessiIndex(0)} 
                style={{
                  flexGrow: 1,
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  padding: '0.5rem 0',
                  textAlign: 'center',
                  color: messiIndex === 0 ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.4)',
                  borderRadius: '0.5rem',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  zIndex: 10,
                  border: 0,
                  backgroundColor: 'transparent'
                }}
              >
                Fast Swap
              </button>
              <button 
                onClick={() => handleSetMessiIndex(1)} 
                style={{
                  flexGrow: 1,
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  padding: '0.5rem 0',
                  textAlign: 'center',
                  color: messiIndex === 1 ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.4)',
                  borderRadius: '0.5rem',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  zIndex: 10,
                  border: 0,
                  backgroundColor: 'transparent'
                }}
              >
                Time Fix
              </button>
              <button 
                onClick={() => handleSetMessiIndex(2)} 
                style={{
                  flexGrow: 1,
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  padding: '0.5rem 0',
                  textAlign: 'center',
                  color: messiIndex === 2 ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.4)',
                  borderRadius: '0.5rem',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  zIndex: 10,
                  border: 0,
                  backgroundColor: 'transparent'
                }}
              >
                Bot Army
              </button>
              {/* Slide highlight background */}
              <div style={{
                position: 'absolute',
                top: '0.25rem',
                bottom: '0.25rem',
                left: '0.25rem',
                backgroundColor: 'rgba(255, 85, 0, 0.2)',
                border: '1px solid rgba(255, 122, 0, 0.3)',
                borderRadius: '0.5rem',
                transition: 'all 0.3s ease',
                width: 'calc(33.333% - 0.333rem)',
                transform: `translateX(${messiIndex * 100}%)`,
                pointerEvents: 'none'
              }} />
            </div>
          </div>
        </div>
        {/* Bengali fun label */}
        <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
          <span style={{
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.25em',
            color: 'rgba(255, 255, 255, 0.15)',
            textTransform: 'uppercase',
            fontFamily: "'Space Grotesk', sans-serif",
            transition: 'color 0.3s ease',
            cursor: 'default',
            userSelect: 'none'
          }}
          onMouseEnter={(e) => e.target.style.color = '#ff7a00'}
          onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.15)'}
          >
            RAG KORLA?
          </span>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div>© 2026 ZID VAI ON AIR X WC 2026. ALL FEEDS PRIVATELY ENCODED.</div>
        <div>
          DEVELOPED BY <span className={styles.footerAuthor}>SHAHIDUL ISLAM BAIZID</span>
        </div>
      </footer>
    </div>
  );
}
