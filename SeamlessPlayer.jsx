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

const STATIC_CHANNELS = [
  { name: "SP - SD", url: "https://rglzdwqlaqpzfoofnohk.supabase.co/functions/v1/go?url=Q09k4OukERocFRoTLpNhopWhojWRopWkQVbmFk6nI0zf&headers=3OvT47zfFAzydly_zKugdly_FOKXdly_HG_hI0oSrVwhv1P0dly_dVwhvGgTIGSh4KHmHRdJERI_4UgRHGHJIRIRFhNcE0zKLpycyCv_EU1Uq1yjin", detail: "Sportzfy SD Clean Feed", badge: "sd", status: 'online' },
  { name: "SP - HD", url: "https://rglzdwqlaqpzfoofnohk.supabase.co/functions/v1/go?url=Q09k4OuzERokijak4MYmoV9JdsHJokrJdkABFhNcE0zKLw&headers=3OvT47zfFAzydly_zKugdly_FOKXdly_HG_hI0oSrVwhv1P0dly_dVwhvGgTIGSh4KHmHRdJERI_4UgRHGHJIRIRFhNcE0zKLpycyCv_EU1Uq1yjin", detail: "Sportzfy HD Clean Feed", badge: "fhd", status: 'online' },
  { name: "FAST 1", url: "https://pullsgp.yyzb456.top/live/stream-698168_lhd.m3u8", detail: "High Speed Routing 1", badge: "hd", status: 'online' },
  { name: "FAST 2", url: "https://pul-tenm.nbs3g.com/live/hd-en-1-4459717.m3u8?txSecret=cb546b67173ce18b5d6e9c15e9ec6b4b&txTime=6A42BDE0", detail: "High Speed Routing 2", badge: "hd", status: 'online' },
  { name: "Arabic", url: "https://em.golatooa.site/Canads1.m3u8", detail: "Arabic Broadcast Feed", badge: "sd", status: 'online' },
  { name: "CCTV 5", url: "https://live.666666.zip/cctv/5.m3u8", detail: "CCTV Sports Broadcast", badge: "hd", status: 'online' },
  { name: "SP - 2", url: "https://live.666666.zip/migu/1.m3u8", detail: "Migu Live Broadcast", badge: "hd", status: 'online' },
  { name: "SP - 3", url: "https://hqlive.yarncdn.live/live/hqtv_blv_phanma/playlist.m3u8", detail: "HQTV Live Feed", badge: "hd", status: 'online' },
  { name: "FUSSBALL (Germany VPN)", url: "https://svc45.main.sl.t-online.de/bpk-tv/KID01037_FUSSBALLTV1_hd/DASH/index.mpd", detail: "Fussball TV HD (DASH/DRM)", badge: "fhd", status: 'online' },
  { name: "FUSSBALL 4K (Germany VPN)", url: "https://svc45.main.sl.t-online.de/bpk-tv/KID01037_FUSSBALLTV1_uhd/DASH/index.mpd", detail: "Fussball TV 4K (DASH/DRM)", badge: "4k", status: 'online' },
  { name: "Somoy TV", url: "https://live.thebosstv.com:30443/dwlive/Somoy-TV/chunks.m3u8", detail: "Somoy TV Live Broadcast", badge: "hd", status: 'online' },
  { name: "Win Sports", url: "https://1nyaler.streamhostingcdn.top/stream/32/index.m3u8", detail: "Win Sports Broadcast", badge: "hd", status: 'online' },
  { name: "beIN Sports 1", url: "https://ua102.online24.pm:8443/1101/video.m3u8?token=350B326FB34F4B8", detail: "beIN 1 Broadcast Feed", badge: "hd", status: 'online' },
  { name: "Fox Sports", url: "http://84.17.50.102/fox/index.m3u8", detail: "Fox Sports Live Feed", badge: "hd", status: 'online' },
  { name: "Peace TV English", url: "https://dzkyvlfyge.erbvr.com/PeaceTvEnglish/index.m3u8?sid=Z44HMm4XiUygzqBGwjL4gA", detail: "Peace TV English Broadcast", badge: "sd", status: 'online' },
  { name: "BTV", url: "https://owrcovcrpy.gpcdn.net/bpk-tv/1709/output/index.m3u8", detail: "BTV National Feed", badge: "hd", status: 'online' },
  { name: "DAZN Directo", url: "https://1nyaler.streamhostingcdn.top/stream/94/index.m3u8", detail: "DAZN Live Feed", badge: "hd", status: 'online' },
  { name: "D Sports", url: "https://1nyaler.streamhostingcdn.top/stream/106/index.m3u8", detail: "D Sports Live Feed", badge: "hd", status: 'online' },
  { name: "beIN Sports 2", url: "https://1nyaler.streamhostingcdn.top/stream/23/index.m3u8", detail: "beIN 2 Broadcast Feed", badge: "hd", status: 'online' }
];

const WC_KEYWORDS = [
  'fox', 'telemundo', 'peacock', 'tsn', 'rds', 'tudn', 'vix', 'azteca', 'bein', 'alkass', 
  'sbs', 'tvnz', 'cctv', 'migu', 'nhk', 'fuji', 'dazn', 'kbs', 'mbc', 'tvri', 'mediacorp', 
  'viutv', 'elta', 'bbc', 'itv', 'stv', 'rte', 'tf1', 'm6', 'ard', 'zdf', 'magenta', 'rai', 
  'rtve', 'sport tv', 'caze', 'globo', 'sportv', 'tyc', 'publica', 'dsports', 'caracol', 
  'rcn', 'btv', 'somoy', 'toffee', 'ptv', 'tapmad', 'sports18', 'jiocinema', 'fussball', 'arena'
];

export default function SeamlessPlayer() {
  const [dynamicChannels, setDynamicChannels] = useState(STATIC_CHANNELS);
  const [currentChannel, setCurrentChannel] = useState(STATIC_CHANNELS[1]);
  const [streamUrl, setStreamUrl] = useState(STATIC_CHANNELS[1].url);
  const [searchQuery, setSearchQuery] = useState('');
  const [hideOffline, setHideOffline] = useState(true);
  const [matches, setMatches] = useState([]);
  const [currentDateIdx, setCurrentDateIdx] = useState(0);
  const [activeFolder, setActiveFolder] = useState('fifa');
  const [activeTab, setActiveTab] = useState('feeds');
  const [funnyIndex, setFunnyIndex] = useState(0);
  const [toastMessage, setToastMessage] = useState(null);
  const [clickedIndex, setClickedIndex] = useState(null);

  useEffect(() => {
    async function loadM3u() {
      try {
        const res = await fetch('verified_channels.json');
        if (!res.ok) throw new Error('Failed to load verified channels');
        const parsed = await res.json();
        
        // Map and set status to checking initially
        const formatted = parsed.map(ch => ({
          ...ch,
          status: 'checking'
        }));
        setDynamicChannels(prev => [...prev, ...formatted]);
      } catch (e) {
        console.error('Failed to load verified playlist in React:', e);
      }
    }
    loadM3u();
  }, []);

  useEffect(() => {
    if (dynamicChannels.length <= STATIC_CHANNELS.length) return;

    let active = true;
    const queue = Array.from({ length: dynamicChannels.length }, (_, i) => i);
    const maxConcurrent = 6;
    let running = 0;

    const verifyChannelHealth = (url) => {
      return new Promise((resolve) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        fetch(url, { method: 'GET', mode: 'no-cors', signal: controller.signal, credentials: 'omit' })
          .then(() => {
            clearTimeout(timeoutId);
            resolve(true);
          })
          .catch(() => {
            clearTimeout(timeoutId);
            resolve(false);
          });
      });
    };

    const runNext = async () => {
      if (!active || queue.length === 0) return;
      const idx = queue.shift();
      
      if (idx < STATIC_CHANNELS.length) {
        runNext();
        return;
      }

      running++;
      const channel = dynamicChannels[idx];
      if (channel && channel.status !== 'checking') {
        running--;
        runNext();
        return;
      }

      const isOnline = await verifyChannelHealth(channel.url);

      if (active) {
        setDynamicChannels(prev => {
          const copy = [...prev];
          if (copy[idx]) {
            copy[idx] = { ...copy[idx], status: isOnline ? 'online' : 'offline' };
          }
          return copy;
        });
        running--;
        runNext();
      }
    };

    for (let i = 0; i < maxConcurrent; i++) {
      runNext();
    }

    return () => {
      active = false;
    };
  }, [dynamicChannels.length]);
  
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setFunnyIndex(prev => (prev + 1) % 13);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function loadMatches() {
      try {
        const res = await fetch('https://ajkerkhela.vercel.app/api/schedule');
        if (!res.ok) throw new Error('Failed to load schedule');
        const raw = await res.json();
        const mapped = raw.map(m => {
          const kickoff = new Date(m.rawDate);
          return {
            id: m.id,
            round: m.group || '',
            group: m.group || '',
            homeTeam: m.teamA,
            awayTeam: m.teamB,
            homeLogo: m.teamALogo,
            awayLogo: m.teamBLogo,
            score1: (m.scoreA !== undefined && m.scoreA !== null && m.scoreA !== "") ? parseInt(m.scoreA) : null,
            score2: (m.scoreB !== undefined && m.scoreB !== null && m.scoreB !== "") ? parseInt(m.scoreB) : null,
            status: m.state === 'live' ? 'live' : (m.state === 'post' ? 'finished' : 'upcoming'),
            statusText: m.statusText || '',
            kickoffUtc: m.rawDate
          };
        });
        setMatches(mapped);
      } catch (e) {
        console.error("Error loading React schedule:", e);
      }
    }
    loadMatches();
  }, []);

  const playRefereeWhistle = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const playBeep = (delay) => {
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(2200, audioCtx.currentTime + delay);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(2280, audioCtx.currentTime + delay);
        const modulator = audioCtx.createOscillator();
        const modGain = audioCtx.createGain();
        modulator.frequency.value = 35;
        modGain.gain.value = 30;
        modulator.connect(modGain);
        modGain.connect(osc1.frequency);
        modGain.connect(osc2.frequency);
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime + delay);
        gainNode.gain.linearRampToValueAtTime(0.25, audioCtx.currentTime + delay + 0.03);
        gainNode.gain.setValueAtTime(0.25, audioCtx.currentTime + delay + 0.12);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + delay + 0.35);
        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        modulator.start(audioCtx.currentTime + delay);
        osc1.start(audioCtx.currentTime + delay);
        osc2.start(audioCtx.currentTime + delay);
        modulator.stop(audioCtx.currentTime + delay + 0.36);
        osc1.stop(audioCtx.currentTime + delay + 0.36);
        osc2.stop(audioCtx.currentTime + delay + 0.36);
      };
      playBeep(0);
      playBeep(0.18);
      triggerToast('📣 REFEREE WHISTLE BLOWN! PLAY ON!');
    } catch (e) {
      console.warn('Web Audio Whistle failed:', e);
    }
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

  const uniqueDates = Array.from(new Set(matches.map(m => {
    const kickoff = new Date(m.kickoffUtc);
    return kickoff.toISOString().split('T')[0];
  }))).sort();

  const selectedDateStr = uniqueDates[currentDateIdx];
  const selectedMatches = matches.filter(m => {
    const kickoff = new Date(m.kickoffUtc);
    const localDate = kickoff.toISOString().split('T')[0];
    return localDate === selectedDateStr;
  });

  let formattedDate = 'Loading Date...';
  if (selectedDateStr) {
    const parts = selectedDateStr.split('-');
    const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

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

  const currentServer = currentChannel;
  const backupServer = null;

  return (
    <div className={styles.bodyWrapper}>
      {/* Ambient background glows */}
      <div className={styles.ambientGlow1} />
      <div className={styles.ambientGlow2} />

      {/* Main Header */}
      <header className={styles.header} style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Running border bottom highlight animation */}
        <div className={styles.runningBorderBar}></div>

        <div className={styles.headerLeft}>
          <a href="#" className={styles.logoGroup}>
            <div className={styles.doublePingContainer}>
              <span className={styles.pingRing}></span>
              <span className={styles.pingDot}></span>
            </div>
            <span className={`${styles.logoText} ${styles.logoTextGlow}`}>
              ZID VAI ON AIR <span className={styles.logoAccent}>X WC 2026</span>
            </span>
          </a>
          <nav className={styles.navLinks}>
            <a href="#" className={`${styles.navLink} ${styles.navLinkActive}`}>LIVE MATCHES</a>
            <a href="#" className={styles.navLink}>FIXTURES</a>
            <a href="#" className={styles.navLink}>CHANNELS</a>
          </nav>
        </div>

        <div className={styles.headerRight}>
          {/* Unified Badge Group */}
          <div className="unified-badge-wrap flex-shrink-0">
            {/* Developer Icon Link */}
            <a 
              href="https://www.facebook.com/shahidulislam.bayzid.37" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                padding: '2px 8px',
                borderRadius: '9999px',
                fontSize: '9px',
                fontWeight: 700,
                color: '#ffffff',
                textDecoration: 'none',
                transition: 'background-color 0.2s'
              }}
            >
              <i className="fa-brands fa-facebook text-blue-400" style={{ fontSize: '11px' }}></i>
              <span className="hidden sm:inline">DEVELOPER</span>
            </a>
            {/* Experimental Icon Label */}
            <span 
              className={styles.experimentalBadge}
              style={{
                background: 'linear-gradient(to right, #ff5500, #ffaa00)',
                color: '#ffffff',
                padding: '2px 8px',
                borderRadius: '9999px',
                fontSize: '8px',
                fontWeight: 700,
                fontFamily: 'monospace',
                letterSpacing: '0.1em'
              }}
            >
              <span className="inline sm:hidden">EXP</span>
              <span className="hidden sm:inline">EXPERIMENTAL</span>
            </span>
          </div>
          <div className={styles.headerStats} style={{ display: 'none' /* hidden by default, shown on desktop override in CSS */ }}>
            <span className={styles.statsIcon}><i className="fa-solid fa-users"></i></span>
            <span className={styles.statsCount}>24.5K</span> online
          </div>
          {/* Whistle Z button */}
          <button 
            onClick={playRefereeWhistle}
            className={styles.userProfile} 
            style={{ textDecoration: 'none', border: 'none', cursor: 'pointer', outline: 'none', flexShrink: 0 }}
            title="Blow Referee Whistle!"
          >
            Z
          </button>
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
            {/* Sidebar header with tab selectors */}
            <div className={styles.tabHeaderRow} style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', backgroundColor: 'rgba(0, 0, 0, 0.2)', userSelect: 'none' }}>
              <button 
                onClick={() => setActiveTab('feeds')} 
                className={`${styles.tabBtn} ${activeTab === 'feeds' ? styles.activeTabBtn : ''}`}
                style={{ flexGrow: 1, fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', padding: '0.875rem 0', textAlign: 'center', cursor: 'pointer', background: 'transparent', border: 'none', borderBottom: activeTab === 'feeds' ? '2px solid #ff7a00' : '2px solid transparent', color: activeTab === 'feeds' ? '#ff7a00' : 'rgba(255, 255, 255, 0.4)' }}
              >
                LIVE FEEDS
              </button>
              <button 
                onClick={() => {
                  setActiveTab('chat');
                  setTimeout(() => {
                    if (chatContainerRef.current) {
                      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
                    }
                  }, 50);
                }} 
                className={`${styles.tabBtn} ${activeTab === 'chat' ? styles.activeTabBtn : ''}`}
                style={{ flexGrow: 1, fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', padding: '0.875rem 0', textAlign: 'center', cursor: 'pointer', background: 'transparent', border: 'none', borderBottom: activeTab === 'chat' ? '2px solid #ff7a00' : '2px solid transparent', color: activeTab === 'chat' ? '#ff7a00' : 'rgba(255, 255, 255, 0.4)' }}
              >
                FAN CHAT
              </button>
            </div>

            {/* Tab Panels */}
            <div className={styles.tabContentPanel}>
              {/* Feeds Panel */}
              {activeTab === 'feeds' && (
                <div className={styles.feedsPanel} style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', width: '100%' }}>
                  {/* Search Bar & Hide Toggle */}
                  <div style={{ padding: '0.75rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', backgroundColor: 'rgba(0, 0, 0, 0.1)', display: 'flex', flexDirection: 'column', gap: '6px', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="fa-solid fa-magnifying-glass" style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: '11px' }}></i>
                      <input 
                        type="text" 
                        placeholder="Search channels..." 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{ background: 'transparent', border: 'none', outline: 'none', color: '#ffffff', fontSize: '11px', width: '100%', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '9px', color: 'rgba(255, 255, 255, 0.4)', userSelect: 'none' }}>
                      <span>Status Verification Queue</span>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={hideOffline} 
                          onChange={e => setHideOffline(e.target.checked)} 
                          style={{ cursor: 'pointer', accentColor: '#ff7a00' }} 
                        />
                        <span>Hide Dead Channels</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* Folders Selector */}
                  <div style={{ padding: '0 0.75rem 0.5rem 0.75rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', backgroundColor: 'rgba(0, 0, 0, 0.1)', display: 'flex', gap: '8px', boxSizing: 'border-box' }}>
                    <button 
                      onClick={() => setActiveFolder('fifa')}
                      style={{ 
                        flexGrow: 1, 
                        padding: '6px 0', 
                        borderRadius: '8px', 
                        fontSize: '10px', 
                        fontWeight: 'bold', 
                        letterSpacing: '0.05em', 
                        textAlign: 'center', 
                        cursor: 'pointer', 
                        transition: 'all 0.2s',
                        background: activeFolder === 'fifa' ? '#ff7a00' : 'rgba(255, 255, 255, 0.05)',
                        color: activeFolder === 'fifa' ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
                        border: activeFolder === 'fifa' ? '1px solid #ff7a00' : '1px solid rgba(255, 255, 255, 0.05)'
                      }}
                    >
                      🏆 FIFA LIVE
                    </button>
                    <button 
                      onClick={() => setActiveFolder('others')}
                      style={{ 
                        flexGrow: 1, 
                        padding: '6px 0', 
                        borderRadius: '8px', 
                        fontSize: '10px', 
                        fontWeight: 'bold', 
                        letterSpacing: '0.05em', 
                        textAlign: 'center', 
                        cursor: 'pointer', 
                        transition: 'all 0.2s',
                        background: activeFolder === 'others' ? '#ff7a00' : 'rgba(255, 255, 255, 0.05)',
                        color: activeFolder === 'others' ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
                        border: activeFolder === 'others' ? '1px solid #ff7a00' : '1px solid rgba(255, 255, 255, 0.05)'
                      }}
                    >
                      ⚽ OTHER SPORTS
                    </button>
                  </div>
                  
                  {/* Scrollable Container */}
                  <div className="scrollbar-style" style={{ flexGrow: 1, overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.625rem', boxSizing: 'border-box' }}>
                    {dynamicChannels.map((ch, idx) => {
                      const query = searchQuery.trim().toLowerCase();
                      if (query && !ch.name.toLowerCase().includes(query) && !(ch.detail || '').toLowerCase().includes(query)) {
                        return null;
                      }
                      const isFifa = (idx < STATIC_CHANNELS.length) || WC_KEYWORDS.some(kw => ch.name.toLowerCase().includes(kw));
                      if (activeFolder === 'fifa' && !isFifa) {
                        return null;
                      }
                      if (activeFolder === 'others' && isFifa) {
                        return null;
                      }
                      if (hideOffline && ch.status === 'offline') {
                        return null;
                      }
                      const isActive = currentChannel.url === ch.url;
                      const qualityBadge = ch.badge ? ch.badge.toUpperCase() : 'HD';

                      const isChecking = ch.status === 'checking';
                      const isOffline = ch.status === 'offline';
                      const statusLabel = ch.status || 'checking';
                      const dotColor = isOffline ? '#ef4444' : (isChecking ? '#f59e0b' : '#39ff14');
                      const dotShadow = isOffline ? '0 0 8px #ef4444' : (isChecking ? '0 0 8px #f59e0b' : '0 0 8px #39ff14');

                      return (
                        <div 
                          key={idx}
                          onClick={() => {
                            setClickedIndex(idx);
                            setTimeout(() => setClickedIndex(null), 500);
                            if (ch.url.includes('.mpd')) {
                              setErrorMessage('DASH / Widevine DRM channels require a Germany VPN and specialized player components. Please select an HLS stream.');
                            } else {
                              setErrorMessage('');
                              setStreamUrl(ch.url);
                            }
                            setCurrentChannel(ch);
                          }}
                          className={`${styles.serverCard} ${isActive ? styles.serverCardActive : ''} ${clickedIndex === idx ? styles.clickedWave : ''}`}
                        >
                          <div className={styles.serverThumb}>
                            {ch.logo && ch.logo.startsWith('http') ? (
                              <img 
                                src={ch.logo} 
                                alt=""
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                            ) : (
                              qualityBadge
                            )}
                          </div>
                          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', textAlign: 'left' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ch.name}</span>
                            <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ch.detail}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)', fontFamily: 'monospace' }}>
                            {isActive && (
                              <div style={{ display: 'flex', alignItems: 'end', gap: '2px', width: '11px', height: '10px', marginRight: '4px' }}>
                                <span className={`${styles.eqBar1}`} style={{ width: '2.5px', height: '100%', borderRadius: '99px', backgroundColor: '#ff7a00' }}></span>
                                <span className={`${styles.eqBar2}`} style={{ width: '2.5px', height: '100%', borderRadius: '99px', backgroundColor: '#ff7a00' }}></span>
                                <span className={`${styles.eqBar3}`} style={{ width: '2.5px', height: '100%', borderRadius: '99px', backgroundColor: '#ff7a00' }}></span>
                              </div>
                            )}
                            <span>{statusLabel}</span>
                            <span className={styles.statusDot} style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: dotColor, boxShadow: dotShadow }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
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

      {/* Fan Zone: Funny Portfolio Slider Section */}
      <section className={styles.trollZoneSection}>
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
          <i className="fa-solid fa-face-laugh-beam" style={{ color: '#ff7a00' }}></i> Zid Vai's Funny Troll Zone 🤪
        </h2>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          padding: '0.5rem 0',
          width: '100%',
          position: 'relative'
        }}>
          {/* Modern Slider Container */}
          <div className="modern-slider-wrap" style={{
            position: 'relative',
            width: '100%',
            maxWidth: '28rem',
            aspectRatio: '4/3',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            borderRadius: '1rem',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{
              display: 'flex',
              width: '100%',
              height: '100%',
              transform: `translateX(-${funnyIndex * 100}%)`,
              transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
              {Array.from({ length: 13 }, (_, i) => (
                <div key={i} style={{
                  width: '100%',
                  height: '100%',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.5rem',
                  boxSizing: 'border-box'
                }}>
                  <img 
                    src={`funny-images/img_${i + 1}.jpg`} 
                    alt={`Funny Slide ${i + 1}`}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      borderRadius: '0.75rem',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                    }}
                  />
                </div>
              ))}
            </div>
            
            {/* Arrows */}
            <button 
              onClick={() => setFunnyIndex(prev => (prev - 1 + 13) % 13)}
              style={{
                position: 'absolute',
                left: '12px',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 20,
                outline: 'none'
              }}
            >
              <i className="fa-solid fa-chevron-left" style={{ fontSize: '10px' }}></i>
            </button>
            <button 
              onClick={() => setFunnyIndex(prev => (prev + 1) % 13)}
              style={{
                position: 'absolute',
                right: '12px',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 20,
                outline: 'none'
              }}
            >
              <i className="fa-solid fa-chevron-right" style={{ fontSize: '10px' }}></i>
            </button>
          </div>

          {/* Dots Indicator */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '0.5rem', maxWidth: '20rem' }}>
            {Array.from({ length: 13 }, (_, i) => (
              <span 
                key={i}
                onClick={() => setFunnyIndex(i)}
                style={{
                  width: i === funnyIndex ? '16px' : '8px',
                  height: '8px',
                  borderRadius: '9999px',
                  backgroundColor: i === funnyIndex ? '#ff7a00' : 'rgba(255, 255, 255, 0.2)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>
        </div>

        {/* Big Stylish Bangla Font text */}
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <div 
            className="bangla-stylish-text"
            style={{
              fontSize: '2.5rem',
              fontWeight: 800,
              userSelect: 'none'
            }}
          >
            রাগ করলা?
          </div>
        </div>
      </section>

      {/* Live Matches & Upcoming Schedule Section */}
      <section className={styles.trollZoneSection}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '0.75rem' }}>
            <h2 style={{
              fontSize: '0.875rem',
              fontWeight: 800,
              letterSpacing: '0.05em',
              color: 'rgba(255, 255, 255, 0.8)',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontFamily: "'Space Grotesk', sans-serif",
              margin: 0
            }}>
              <i className="fa-solid fa-calendar-days" style={{ color: '#ff7a00' }}></i> Live Matches & Schedule
            </h2>
            
            {uniqueDates.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '4px 12px', borderRadius: '12px', fontSize: '11px', userSelect: 'none' }}>
                <button 
                  onClick={() => currentDateIdx > 0 && setCurrentDateIdx(prev => prev - 1)}
                  style={{ border: 'none', background: 'transparent', color: 'rgba(255, 255, 255, 0.6)', cursor: 'pointer', outline: 'none', padding: 0 }}
                >
                  <i className="fa-solid fa-chevron-left"></i>
                </button>
                <span style={{ fontWeight: 750, color: '#ffffff', minWidth: '110px', textAlign: 'center' }}>
                  {formattedDate}
                </span>
                <button 
                  onClick={() => currentDateIdx < uniqueDates.length - 1 && setCurrentDateIdx(prev => prev + 1)}
                  style={{ border: 'none', background: 'transparent', color: 'rgba(255, 255, 255, 0.6)', cursor: 'pointer', outline: 'none', padding: 0 }}
                >
                  <i className="fa-solid fa-chevron-right"></i>
                </button>
              </div>
            )}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
            {selectedMatches.map((match) => {
              const isLive = match.status === 'live';
              const kickoff = new Date(match.kickoffUtc);
              const timeStr = kickoff.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
              
              let tzAbbr = 'UTC';
              try {
                const parts = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' }).formatToParts(kickoff);
                const tzPart = parts.find(p => p.type === 'timeZoneName');
                if (tzPart) tzAbbr = tzPart.value;
              } catch (e) {}

              return (
                <div 
                  key={match.id} 
                  className={styles.serverCard}
                  style={{
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    gap: '12px',
                    borderColor: isLive ? '#ff7a00' : 'rgba(255, 255, 255, 0.05)',
                    background: isLive ? 'linear-gradient(135deg, rgba(255, 122, 0, 0.08) 0%, rgba(255, 60, 0, 0.02) 100%)' : 'rgba(255, 255, 255, 0.02)',
                    animation: isLive ? 'playingGlow 2.5s infinite ease-in-out' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* Team A Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {match.homeLogo ? (
                          <img src={match.homeLogo} alt={match.homeTeam} style={{ width: '18px', height: '18px', objectFit: 'contain' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        ) : (
                          <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.3)' }}><i className="fa-solid fa-users"></i></span>
                        )}
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>{match.homeTeam}</span>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: match.score1 !== null ? '#ffffff' : 'rgba(255, 255, 255, 0.2)' }}>
                        {match.score1 !== null ? match.score1 : '-'}
                      </span>
                    </div>

                    {/* Team B Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {match.awayLogo ? (
                          <img src={match.awayLogo} alt={match.awayTeam} style={{ width: '18px', height: '18px', objectFit: 'contain' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        ) : (
                          <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.3)' }}><i className="fa-solid fa-users"></i></span>
                        )}
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>{match.awayTeam}</span>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: match.score2 !== null ? '#ffffff' : 'rgba(255, 255, 255, 0.2)' }}>
                        {match.score2 !== null ? match.score2 : '-'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.03)' }}>
                    <span style={{
                      fontSize: '9px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: isLive ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                      color: isLive ? '#ef4444' : 'rgba(255, 255, 255, 0.4)'
                    }}>
                      {isLive ? 'LIVE' : (match.status === 'finished' ? 'FT' : 'SCHED')}
                    </span>

                    {isLive ? (
                      <button 
                        onClick={() => handleSelectChannel(STATIC_CHANNELS[1], 1)}
                        style={{
                          backgroundColor: '#ff7a00',
                          border: 'none',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '9px',
                          padding: '3px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        Tune In
                      </button>
                    ) : (
                      <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.4)', fontFamily: 'monospace' }}>
                        {timeStr} {tzAbbr}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div>© 2026 ZID VAI ON AIR X WC 2026. ALL FEEDS PRIVATELY ENCODED.</div>
        <div>
          DEVELOPED BY <span className={styles.footerAuthor}>SHAHIDUL ISLAM BAIZID</span>
        </div>
      </footer>

      {/* Toast banner overlay */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: 'rgba(15, 15, 19, 0.95)',
          border: '1px solid #ff7a00',
          borderRadius: '12px',
          padding: '12px 18px',
          color: '#ffffff',
          fontSize: '12px',
          fontWeight: 700,
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 15px rgba(255, 122, 0, 0.2)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <i className="fa-solid fa-bell" style={{ color: '#ff7a00' }}></i>
          {toastMessage}
        </div>
      )}
    </div>
  );
}
