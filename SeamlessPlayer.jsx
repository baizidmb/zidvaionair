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
  const [servers, setServers] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(-1); // -1 means placeholder/sweeping active
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
  const [isSweeping, setIsSweeping] = useState(true);

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

  // Fetch and parse streams dynamically
  useEffect(() => {
    async function checkHealth(url) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
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

    async function loadStreams() {
      setIsSweeping(true);
      
      // 1. Fetch Toffee JSON
      let toffeeChannels = [];
      try {
        const res = await fetch('https://raw.githubusercontent.com/sm-monirulislam/Toffee-Auto-Update-Playlist/main/toffee_data.json?t=' + Date.now());
        if (res.ok) {
          const data = await res.json();
          toffeeChannels = data.response || [];
        }
      } catch (e) {
        console.warn('Failed to load Toffee streams:', e);
      }

      // 2. Fetch Sportzfy JSON
      let sportzfyStreams = [];
      try {
        const res = await fetch('./sportzfy_streams.json?t=' + Date.now());
        if (res.ok) {
          const data = await res.json();
          sportzfyStreams = data.streams || [];
        }
      } catch (e) {
        console.warn('Failed to load Sportzfy streams:', e);
      }

      // 3. Fetch iptv-org sports
      let iptvOrgChannels = [];
      try {
        const res = await fetch('https://iptv-org.github.io/iptv/categories/sports.m3u');
        if (res.ok) {
          const text = await res.text();
          const lines = text.split('\n');
          let currentName = null;
          const KEYWORDS = ['fifa', 'world cup', 'worldcup', 'sony', 'ten', 'espn', 'fox', 'sky', 'bein', 'tsport', 'gtv', 'gazi', 'btv', 'fussball', 'football', 'soccer', 'supersport', 'arena', 'dazn', 'star sports', 'premier', 'cctv'];
          
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith('#EXTINF:')) {
              const parts = line.split(',');
              if (parts.length > 1) {
                currentName = parts.slice(1).join(',');
              }
            } else if (line && !line.startsWith('#')) {
              if (currentName) {
                const nameLower = currentName.toLowerCase();
                if (KEYWORDS.some(k => nameLower.includes(k))) {
                  iptvOrgChannels.push({
                    name: currentName,
                    url: line,
                    detail: 'Global Live Sports Broadcast Feed',
                    badge: nameLower.includes('1080p') ? 'fhd' : 'hd'
                  });
                }
                currentName = null;
              }
            }
          }
        }
      } catch (e) {
        console.warn('Failed to load iptv-org sports streams:', e);
      }

      const matchStreams = [];
      const genericFifaStreams = [];
      const sportsNetworkStreams = [];
      const sportzfyMatchStreams = [];

      // Parse Toffee
      toffeeChannels.forEach(ch => {
        const name = ch.name || '';
        const rawUrl = ch.link || ch.url || '';
        if (!rawUrl) return;

        let url = rawUrl;
        if (rawUrl.includes('bldcmprod-cdn.toffeelive.com/cdn/live/')) {
          url = rawUrl.replace('https://bldcmprod-cdn.toffeelive.com/cdn/live/', 'https://sm-monirul.top/toffee/play/')
                      .replace('/playlist.m3u8', '.m3u8');
        } else if (rawUrl.includes('prod-cdn01-live.toffeelive.com/live/')) {
          const parts = rawUrl.split('/live/');
          if (parts.length > 1) {
            const id = parts[1].split('/')[0];
            url = `https://sm-monirul.top/toffee/play/${id}.m3u8`;
          }
        }

        const nameLower = name.toLowerCase();
        if (nameLower.includes('vs') && !nameLower.includes('highlight') && !nameLower.includes('show')) {
          matchStreams.push({ name, url, detail: `Live Match Broadcast: ${name}`, badge: 'live' });
        } else if (nameLower.includes('fifa')) {
          genericFifaStreams.push({ name, url, detail: `FIFA World Cup Live Broadcast`, badge: 'hd' });
        } else if (nameLower.includes('sport') || nameLower.includes('ten') || nameLower.includes('cricket') || nameLower.includes('btv') || nameLower.includes('somoy')) {
          sportsNetworkStreams.push({ name, url, detail: `Live Sports Network Feed`, badge: nameLower.includes('vip') ? 'fhd' : 'hd' });
        }
      });

      // Parse Sportzfy
      sportzfyStreams.forEach(ch => {
        if (!ch.stream_url || ch.stream_type !== 'hls' || ch.drm_kid) return;
        sportzfyMatchStreams.push({
          name: ch.label || `Sportzfy Server ${ch.id}`,
          url: ch.stream_url,
          detail: `Sportzfy Premium Broadcast Feed`,
          badge: (ch.label && ch.label.toLowerCase().includes('hd')) ? 'fhd' : 'hd'
        });
      });

      // Merge
      const allCandidates = [];
      const addCandidates = (list, category) => {
        list.forEach(s => {
          allCandidates.push({
            name: s.name,
            url: s.url,
            detail: s.detail || 'Live Sports Broadcast Feed',
            badge: s.badge || 'hd',
            category
          });
        });
      };

      addCandidates(matchStreams, 'World Cup Live Match Servers');
      addCandidates(sportzfyMatchStreams, 'Sportzfy Premium Broadcasts');
      addCandidates(genericFifaStreams, 'FIFA World Cup Live Feeds');
      addCandidates(iptvOrgChannels, 'Global IPTV Sports Feeds');
      addCandidates(sportsNetworkStreams, 'Premium Sports Networks');

      console.log(`Checking health of ${allCandidates.length} parsed candidate feeds...`);

      // Parallel health pinger
      const checkedServers = await Promise.all(
        allCandidates.map(async (server) => {
          const res = await checkHealth(server.url);
          return {
            ...server,
            latency: res.latency,
            status: res.online ? (res.latency < 1000 ? 'online' : 'amber') : 'offline'
          };
        })
      );

      // Filter out offline servers completely & sort online ones
      const onlineServers = checkedServers.filter(s => s.status !== 'offline');
      setServers(onlineServers);
      setIsSweeping(false);

      if (onlineServers.length > 0) {
        setCurrentIdx(0);
      } else {
        setErrorMessage("No active broadcast feeds detected. All servers are currently offline.");
      }
    }

    loadStreams();
  }, []);

  // Periodic health checking
  useEffect(() => {
    if (servers.length === 0 || isSweeping) return;

    async function checkHealth(url) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
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
      console.log('🔄 Telemetry Sweep: Performing background check...');
      const activeUrl = currentIdx >= 0 ? servers[currentIdx]?.url : null;

      const checked = await Promise.all(
        servers.map(async (s) => {
          const online = await checkHealth(s.url);
          return {
            ...s,
            status: online ? 'online' : 'offline'
          };
        })
      );

      // Keep only online ones
      const onlineFiltered = checked.filter(s => s.status !== 'offline');
      setServers(onlineFiltered);

      if (activeUrl) {
        const newIdx = onlineFiltered.findIndex(s => s.url === activeUrl);
        if (newIdx !== -1) {
          setCurrentIdx(newIdx);
        } else if (onlineFiltered.length > 0) {
          setCurrentIdx(0);
        } else {
          setCurrentIdx(-1);
          setErrorMessage("Stream failed. No other working server found.");
        }
      }
    }

    const interval = setInterval(runHealthCheck, 35000);
    return () => clearInterval(interval);
  }, [servers, currentIdx, isSweeping]);

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

      targetVideo.volume = volume;
      targetVideo.muted = isMuted;
      targetVideo.play().catch(() => {});

      targetVideo.style.opacity = '1';
      targetVideo.style.zIndex = '20';
      currentVideo.style.opacity = '0';
      currentVideo.style.zIndex = '10';

      setActivePlayer(isTargetA ? 'A' : 'B');
      setCurrentIdx(backupIndex);

      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = setTimeout(() => {
        currentVideo.pause();
        cleanupPlayer(isTargetA ? 'B' : 'A');
        preloadBackup(backupIndex);
      }, 350);
    } else {
      setErrorMessage('ALL BROADCAST FEEDS ARE CURRENTLY OFFLINE.');
      setIsLoading(false);
      failoverCountRef.current = 0;
    }
  };

  // Primary stream loader
  useEffect(() => {
    if (currentIdx === -1 || servers.length === 0) return;
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
        enableWorker: false, // Turn off web workers to fix mobile video decoding black screens
        lowLatencyMode: true,
        capLevelToPlayerSize: true, // Auto-scale resolution to player dimensions to prevent GPU stalls
        maxBufferHole: 2 // Automatically skip small gaps in segment streams to avoid freezes
      });

      if (isTargetA) {
        hlsRefA.current = hlsInstance;
      } else {
        hlsRefB.current = hlsInstance;
      }

      hlsInstance.loadSource(url);
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

  // Preload secondary backup
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
        enableWorker: false, // Turn off web workers to fix mobile video decoding black screens
        lowLatencyMode: true,
        autoStartLoad: true,
        capLevelToPlayerSize: true,
        maxBufferHole: 2
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
            <span className={styles.logoText}>ZID VAI ON AIR <span className={styles.logoAccent}>X WC 2026</span></span>
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

            {/* Placeholder Screen / Sweeping Loader */}
            {isSweeping && (
              <div className={styles.placeholderOverlay}>
                <div className={styles.spinner} />
                <h3 className={styles.placeholderTitle}>SWEEPING BROADCAST FEEDS</h3>
                <p className={styles.placeholderText}>Testing latencies and auto-finding active channels. Please hold...</p>
              </div>
            )}

            {/* Select Match Placeholder */}
            {!isSweeping && currentIdx === -1 && !errorMessage && (
              <div className={styles.placeholderOverlay}>
                <div className={styles.placeholderPlayBtn} onClick={() => setCurrentIdx(0)}>
                  <i className="fa-solid fa-play"></i>
                </div>
                <h3 className={styles.placeholderTitle}>SELECT MATCH FEED</h3>
                <p className={styles.placeholderText}>Pick one of the live broadcast servers in the sidebar console to begin streaming.</p>
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
                  {isSweeping && (
                    <div className="flex flex-col items-center justify-center p-8 text-center text-xs text-white/50 h-full">
                      <div className={styles.spinner} />
                      <span className="mt-2">Sweeping active feeds...</span>
                    </div>
                  )}

                  {!isSweeping && servers.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-8 text-center text-xs text-white/50 h-full gap-2">
                      <i className="fa-solid fa-triangle-exclamation text-[#ff7a00] text-xl" />
                      <span>No active streams found.</span>
                    </div>
                  )}

                  {!isSweeping && servers.map((srv, idx) => {
                    const isActive = currentIdx === idx;
                    let statusColor = styles.statusGreen;
                    if (srv.status === 'amber') statusColor = styles.statusAmber;

                    return (
                      <div
                        key={srv.url + '-' + idx}
                        className={`${styles.serverCard} ${isActive ? styles.serverCardActive : ''} ${styles.glossyShine}`}
                        onClick={() => setCurrentIdx(idx)}
                      >
                        <div className={styles.serverThumb}>
                          {srv.badge.toUpperCase()}
                        </div>
                        <div className={styles.serverCardDetails}>
                          <span className={styles.serverCardName}>{srv.name}</span>
                          <span className={styles.serverCardDesc}>{srv.detail}</span>
                        </div>
                        <div className={styles.serverCardStatus}>
                          <span className={styles.latencyValue}>
                            {srv.latency ? `${Math.round(srv.latency)}ms` : 'online'}
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
                      onClick={() => servers.length > 0 && setCurrentIdx(0)} 
                      className={styles.tuneInBtn}
                    >
                      Tune In
                    </button>
                  ) : (
                    <span className={styles.upcomingTime}>
                      {(() => {
                        const kickoff = new Date(match.kickoffUtc);
                        try {
                          const timeStr = kickoff.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                          const tzPart = kickoff.toLocaleDateString('en-US', { day: 'numeric', timeZoneName: 'short' }).split(', ')[1] || 'UTC';
                          return `${timeStr} ${tzPart}`;
                        } catch (e) {
                          return kickoff.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                        }
                      })()}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
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
