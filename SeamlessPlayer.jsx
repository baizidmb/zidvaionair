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
  const [messiIndex, setMessiIndex] = useState(0);
  const [messiFade, setMessiFade] = useState(false);
  const handleSetMessiIndex = (idx) => {
    setMessiFade(true);
    setTimeout(() => {
      setMessiIndex(idx);
      setMessiFade(false);
    }, 150);
  };
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
          const KEYWORDS = [
            'fifa', 'world cup', 'worldcup', 'wc 2026', 'wc2026', 'worldcup2026',
            'fox sports', 'fs1', 'telemundo', 'universo', 'peacock', 'fox one',
            'tsn', 'ctv', 'rds', 'televisauvision', 'tudn', 'vix', 'tv azteca',
            'bein sports', 'alkass', 'entv', 'snrt', 'sports18', 'jiocinema', 'doordarshan',
            'btv', 't sports', 'somoy tv', 'toffee', 'bioscope', 'ptv sports', 'tapmad',
            'sbs', 'tvnz', 'cmg', 'migu', 'nhk', 'nippon tv', 'fuji tv', 'dazn',
            'jtbc', 'kbs', 'naver sports', 'chzzk', 'tvri', 'maxstream', 'rtm', 'unifi tv',
            'mediacorp', 'pccw', 'elta sports', 'ebc', 'ttv', 'monomax', 'bbc', 'itv', 'stv', 'rté',
            'm6', 'ard', 'zdf', 'magenta sport', 'rai', 'rtve', 'mediapro', 'rtp', 'sic', 'tvi',
            'sport tv', 'livemodetv', 'nos', 'vrt', 'rtbf', 'srg ssr', 'orf', 'servustv',
            'svt', 'tv4', 'nrk', 'tv2', 'dr', 'yle', 'mtv3', 'tvp', 'trt', 'megogo',
            'arena sport', 'hrt', 'rts', 'rtvfbih', 'telefe', 'tv pública', 'tv publica', 'tyc sports',
            'dsports', 'grupo globo', 'globo', 'cazétv', 'cazetv', 'sbt', 'n sports',
            'caracol', 'canal rcn', 'win sports', 'chilevisión', 'chilevision', 'teleamazonas',
            'américa televisión', 'america television', 'canal 5', 'antel tv', 'televen',
            'red uno', 'unitel', 'entel', 'tigo sports', 'teletica', 'rpc', 'tvn',
            'supersport', 'new world tv', 'sabc', 'sportytv', 'startimes', 'kbc', 'tbc',
            'azam tv', 'gbc', 'multimedia group', 'utv', 'tpa', 'z sports', 'fifa+', 'sport24'
          ];
          
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
                    detail: 'Global World Cup Broadcast Feed',
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
        } else if (nameLower.includes('fifa') || nameLower.includes('world cup') || nameLower.includes('worldcup')) {
          genericFifaStreams.push({ name, url, detail: `FIFA World Cup Live Broadcast`, badge: 'hd' });
        } else if (nameLower.includes('btv national') || nameLower.includes('btv-national') || (nameLower === 'btv' && ch.category_name && ch.category_name.includes('Sports'))) {
          genericFifaStreams.push({ name: 'BTV National (WC Broadcaster)', url, detail: `BTV National World Cup Live Broadcast`, badge: 'hd' });
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

      // Ensure BTV National fallback is present under FIFA World Cup Live Feeds if not loaded dynamically
      const hasBTV = genericFifaStreams.some(srv => srv.name.toLowerCase().includes('btv'));
      if (!hasBTV) {
        genericFifaStreams.push({
          name: 'BTV National (WC Broadcaster)',
          url: 'https://sm-monirul.top/toffee/play/btv_national.m3u8',
          detail: 'Bangladesh Television World Cup Broadcast',
          badge: 'hd'
        });
      }

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
      if (iptvOrgChannels.length > 0) {
        addCandidates(iptvOrgChannels, 'Global World Cup Channels');
      }

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
