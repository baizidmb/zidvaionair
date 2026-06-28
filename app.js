/* =========================================================
   COPASTREAM 2026 - MAIN BROADCAST SCRIPT (REBUILT)
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

    // 1. Dynamic Server Loading and Parsing Logic
    const SERVERS = [];
    let hls = null;
    let currentServerIndex = null;

    function getFallbackChannels() {
        return [
            { name: "Norway vs France", link: "https://sm-monirul.top/tof/live/toffee6/index.m3u8", category_name: "Sports Channels" },
            { name: "Cabo Verde vs South Africa", link: "https://sm-monirul.top/tof/live/toffee5/index.m3u8", category_name: "Sports Channels" },
            { name: "Egypt vs Iran", link: "https://sm-monirul.top/tof/live/toffee1/index.m3u8", category_name: "Sports Channels" },
            { name: "New Zealand vs Belgium", link: "https://sm-monirul.top/toffee/play/FIFA-2026-5.m3u8", category_name: "Sports Channels" },
            { name: "Senegal vs Iraq", link: "https://sm-monirul.top/tof/live/toffee3/index.m3u8", category_name: "Sports Channels" },
            { name: "Uruguay vs Spain", link: "https://sm-monirul.top/tof/live/toffee4/index.m3u8", category_name: "Sports Channels" },
            
            { name: "Toffee FIFA 1", link: "https://sm-monirul.top/toffee/play/FIFA-2026-1.m3u8", category_name: "Sports Channels" },
            { name: "Toffee FIFA 2", link: "https://sm-monirul.top/toffee/play/FIFA-2026-2.m3u8", category_name: "Sports Channels" },
            { name: "Toffee FIFA 3", link: "https://sm-monirul.top/toffee/play/FIFA-2026-3.m3u8", category_name: "Sports Channels" },
            { name: "Toffee FIFA 4", link: "https://sm-monirul.top/toffee/play/FIFA-2026-4.m3u8", category_name: "Sports Channels" },
            { name: "Toffee FIFA 5", link: "https://sm-monirul.top/toffee/play/FIFA-2026-5.m3u8", category_name: "Sports Channels" },
            { name: "Toffee FIFA 6", link: "https://sm-monirul.top/toffee/play/FIFA-2026-6.m3u8", category_name: "Sports Channels" },
            
            { name: "SONY SPORTS TEN 1 HD", link: "https://sm-monirul.top/toffee/play/sony_sports_1_hd.m3u8", category_name: "LIVE" },
            { name: "SONY SPORTS TEN 2 HD", link: "https://sm-monirul.top/toffee/play/sony_sports_2_hd.m3u8", category_name: "LIVE" },
            { name: "SONY SPORTS TEN 5 HD", link: "https://sm-monirul.top/toffee/play/sony_sports_5_hd.m3u8", category_name: "LIVE" },
            { name: "SONY TEN Cricket", link: "https://sm-monirul.top/toffee/play/ten_cricket.m3u8", category_name: "LIVE" },
            { name: "TOFFEE Sports VIP", link: "https://sm-monirul.top/toffee/play/sports_highlights.m3u8", category_name: "LIVE" },
            { name: "Euro Sport HD", link: "https://sm-monirul.top/toffee/play/euro_sports_hd.m3u8", category_name: "LIVE" },
            { name: "BTV National", link: "https://sm-monirul.top/toffee/play/btv_national.m3u8", category_name: "LIVE" },
            { name: "Somoy TV", link: "https://sm-monirul.top/toffee/play/somoy_tv.m3u8", category_name: "LIVE" }
        ];
    }

    async function loadDynamicStreams() {
        let channels = [];
        
        // Show sweeping loader in serversContainer immediately
        if (serversContainer) {
            serversContainer.innerHTML = `
                <div class="flex flex-col items-center justify-center p-8 text-center text-xs text-white/50">
                    <div class="spinner-modern mb-2"></div>
                    <span>SWEEPING FEEDS FOR ACTIVE CHANNELS...</span>
                </div>
            `;
        }

        try {
            const res = await fetch('https://raw.githubusercontent.com/sm-monirulislam/Toffee-Auto-Update-Playlist/main/toffee_data.json?t=' + Date.now());
            if (!res.ok) throw new Error('Network error fetching stream JSON');
            const data = await res.json();
            channels = data.response || [];
        } catch (e) {
            console.warn('Failed to load dynamic streams from GitHub, loading fallback channels:', e);
            channels = getFallbackChannels();
        }

        // Load Sportzfy streams from local decrypted JSON
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

        // Fetch iptv-org sports channels dynamically
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

        // Parse Toffee channels
        channels.forEach(ch => {
            const name = ch.name || '';
            const rawUrl = ch.link || ch.url || '';
            const category = ch.category_name || '';
            
            if (!rawUrl) return;

            // Rewrite URL using proxy rules to bypass CORS/cookie restrictions
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
            } else if (rawUrl.startsWith('http://sm-monirul.top/')) {
                url = rawUrl.replace('http://', 'https://');
            }

            const nameLower = name.toLowerCase();

            // 1. Live Match streams
            if (nameLower.includes('vs') && !nameLower.includes('highlight') && !nameLower.includes('show')) {
                matchStreams.push({
                    name: name,
                    url: url,
                    detail: `Live Match Broadcast: ${name}`,
                    badge: 'live'
                });
            }
            // 2. Generic FIFA channels
            else if (nameLower.includes('fifa')) {
                genericFifaStreams.push({
                    name: name,
                    url: url,
                    detail: `FIFA World Cup Live Broadcast`,
                    badge: 'hd'
                });
            }
            // 3. Premium Sports channels / Channels broadcasting World Cup
            else if (nameLower.includes('sport') || nameLower.includes('ten') || nameLower.includes('cricket') || nameLower.includes('highlights') || nameLower.includes('btv') || nameLower.includes('somoy')) {
                sportsNetworkStreams.push({
                    name: name,
                    url: url,
                    detail: `Live Sports Network Feed`,
                    badge: nameLower.includes('vip') ? 'fhd' : 'hd'
                });
            }
        });

        // Parse Sportzfy channels (filter out DRM and non-HLS streams)
        sportzfyStreams.forEach(ch => {
            if (!ch.stream_url || ch.stream_type !== 'hls' || ch.drm_kid) return;
            sportzfyMatchStreams.push({
                name: ch.label || `Sportzfy Server ${ch.id}`,
                url: ch.stream_url,
                detail: `Sportzfy Premium Broadcast Feed`,
                badge: (ch.label && ch.label.toLowerCase().includes('hd')) ? 'fhd' : 'hd'
            });
        });

        // Ensure BTV National is always present in the sports network streams
        const hasBTV = sportsNetworkStreams.some(srv => srv.name.toLowerCase().includes('btv'));
        if (!hasBTV) {
            sportsNetworkStreams.push({
                name: 'BTV National',
                url: 'https://sm-monirul.top/toffee/play/btv_national.m3u8',
                detail: 'Bangladesh Television Live Broadcast',
                badge: 'hd'
            });
        }

        // Add working BTV Chattogram Bozztv alternative stream
        sportsNetworkStreams.push({
            name: 'BTV Chattogram',
            url: 'https://bozztv.com/rongo/rongo-BTVChattagram/index.m3u8',
            detail: 'BTV Chattogram Live Broadcast (Bozztv CDN)',
            badge: 'hd'
        });
        
        // Ensure Somoy TV is always present in the sports network streams
        const hasSomoy = sportsNetworkStreams.some(srv => srv.name.toLowerCase().includes('somoy'));
        if (!hasSomoy) {
            sportsNetworkStreams.push({
                name: 'Somoy TV',
                url: 'https://sm-monirul.top/toffee/play/somoy_tv.m3u8',
                detail: 'Somoy TV Live Broadcast',
                badge: 'hd'
            });
        }

        // If no active matches are playing, show a default broadcast banner placeholder
        if (matchStreams.length === 0) {
            matchStreams.push({
                name: 'No Live Matches Currently',
                url: genericFifaStreams.length > 0 ? genericFifaStreams[0].url : 'https://sm-monirul.top/toffee/play/FIFA-2026-1.m3u8',
                detail: 'No match is live right now. Showing default FIFA feed.',
                badge: 'hd'
            });
        }

        const categories = [];
        if (matchStreams.length > 0) {
            categories.push({
                category: 'World Cup Live Match Servers',
                servers: matchStreams
            });
        }
        if (sportzfyMatchStreams.length > 0) {
            categories.push({
                category: 'Sportzfy Premium Broadcasts',
                servers: sportzfyMatchStreams
            });
        }
        if (genericFifaStreams.length > 0) {
            categories.push({
                category: 'FIFA World Cup Live Feeds',
                servers: genericFifaStreams
            });
        }
        if (iptvOrgChannels.length > 0) {
            categories.push({
                category: 'Global IPTV Sports Feeds',
                servers: iptvOrgChannels
            });
        }
        if (sportsNetworkStreams.length > 0) {
            categories.push({
                category: 'Premium Sports Networks',
                servers: sportsNetworkStreams
            });
        }

        // Re-populate SERVERS in-place
        SERVERS.length = 0;
        categories.forEach(cat => {
            cat.servers.forEach(srv => {
                SERVERS.push({
                    name: srv.name,
                    url: srv.url,
                    detail: srv.detail,
                    category: cat.category,
                    badge: srv.badge,
                    status: 'online',
                    latency: 0,
                    isDead: false
                });
            });
        });

        // Run health check immediately to filter out dead servers before rendering and play
        await runHealthCheck();

        // Update server count badge to reflect only active servers
        const activeCount = SERVERS.filter(s => s.status !== 'offline').length;
        const serverCountBadge = document.getElementById('server-count-badge');
        if (serverCountBadge) {
            serverCountBadge.textContent = `${activeCount} ACTIVE SERVERS`;
        }

        // Select the default server from the working ones (index 0 is the best sorted active one)
        if (SERVERS.length > 0 && SERVERS[0].status !== 'offline') {
            console.log(`🚀 Dynamically defaulting to ${SERVERS[0].name} (Index 0)`);
            window.changeServer(SERVERS[0].url, 0);
        } else {
            handlePlayerError("No active broadcast feeds detected. Please try reloading or check network.");
        }

        // Start background health checking interval (every 30s)
        setInterval(runHealthCheck, 30000);
    }

    function renderServersGrid(serversList) {
        if (!serversContainer) return;
        serversContainer.innerHTML = '';
        
        let renderedCount = 0;
        serversList.forEach((srv, index) => {
            if (srv.status === 'offline') return; // Skip dead servers completely!
            
            renderedCount++;
            const card = document.createElement('div');
            const isActive = currentServerIndex !== null && SERVERS[currentServerIndex]?.url === srv.url;
            card.className = `server-card ${isActive ? 'active' : ''} glossy-shine`;
            card.dataset.index = index;
            
            let statusDotClass = 'status-green';
            let statusText = srv.latency ? `${Math.round(srv.latency)}ms` : 'online';
            if (srv.status === 'amber') {
                statusDotClass = 'status-amber';
            }
            
            const qualityBadge = srv.badge ? srv.badge.toUpperCase() : 'HD';

            card.innerHTML = `
                <div class="server-thumb">${qualityBadge}</div>
                <div class="flex-grow flex flex-col overflow-hidden text-left">
                    <span class="server-card-name font-bold text-xs truncate text-white" title="${srv.name}">${srv.name}</span>
                    <span class="text-[10px] text-white/40 truncate">${srv.detail || 'Live Broadcast Feed'}</span>
                </div>
                <div class="flex items-center gap-1.5 text-[10px] font-mono text-white/50">
                    <span>${statusText}</span>
                    <span class="status-dot ${statusDotClass}"></span>
                </div>
            `;
            
            card.addEventListener('click', () => {
                window.changeServer(srv.url, index);
            });
            
            serversContainer.appendChild(card);
        });

        if (renderedCount === 0) {
            serversContainer.innerHTML = `
                <div class="flex flex-col items-center justify-center p-8 text-center gap-2">
                    <i class="fa-solid fa-triangle-exclamation text-[#ff7a00] text-xl animate-bounce"></i>
                    <span class="text-xs text-white/60">No active feeds found.</span>
                    <button id="btn-force-scan" class="mt-2 bg-[#ff7a00] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg border-0 cursor-pointer">
                        Force Scan
                    </button>
                </div>
            `;
            const btnForceScan = document.getElementById('btn-force-scan');
            if (btnForceScan) {
                btnForceScan.addEventListener('click', () => {
                    loadDynamicStreams();
                });
            }
        }

        const serverCountBadge = document.getElementById('server-count-badge');
        if (serverCountBadge) {
            serverCountBadge.textContent = `${renderedCount} ACTIVE SERVERS`;
        }
    }

    async function checkServerHealth(url) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const start = performance.now();
        try {
            await fetch(url, { method: 'GET', mode: 'no-cors', signal: controller.signal });
            const latency = performance.now() - start;
            clearTimeout(timeoutId);
            return { online: true, latency: latency };
        } catch (e) {
            clearTimeout(timeoutId);
            return { online: false, latency: 9999 };
        }
    }

    async function runHealthCheck() {
        console.log('🔄 Telemetry Sweep: Performing background ping check on all server terminals...');
        
        // Save current active server URL to maintain selection highlight after sorting
        const currentActiveUrl = currentServerIndex !== null ? SERVERS[currentServerIndex]?.url : null;

        const healthPromises = SERVERS.map(async (server) => {
            const result = await checkServerHealth(server.url);
            if (result.online) {
                server.latency = result.latency;
                server.status = result.latency < 1000 ? 'online' : 'amber';
                server.isDead = false;
            } else {
                server.latency = 9999;
                server.status = 'offline';
                server.isDead = true;
            }
        });

        await Promise.all(healthPromises);

        // Sort: Active/Amber at top, Offline at bottom. Keep relative order.
        const activeGroup = SERVERS.filter(s => s.status !== 'offline');
        const offlineGroup = SERVERS.filter(s => s.status === 'offline');
        
        const sortedServers = [...activeGroup, ...offlineGroup];
        
        // Update SERVERS in-place
        SERVERS.length = 0;
        sortedServers.forEach(s => SERVERS.push(s));

        // Restore active index pointer
        if (currentActiveUrl) {
            const newActiveIndex = SERVERS.findIndex(s => s.url === currentActiveUrl);
            if (newActiveIndex !== -1) {
                currentServerIndex = newActiveIndex;
            }
        }

        // Re-render dashboard console
        renderServersGrid(SERVERS);
        updateTelemetry();
        console.log('✅ Telemetry Sweep completed. Server stack updated.');
    }

    // Player State



    // DOM Elements (Dual-Player Architecture)
    const videoA = document.getElementById('video-player-a');
    const videoB = document.getElementById('video-player-b');
    let activePlayer = videoA;
    let idlePlayer = videoB;
    let hlsA = null;
    let hlsB = null;

    const playerPlaceholder = document.getElementById('player-placeholder');
    const playerLoader = document.getElementById('player-loader');
    const playerError = document.getElementById('player-error');
    const errorMessage = document.getElementById('error-message');
    const btnRetry = document.getElementById('btn-error-retry');
    
    const currentServerTitle = document.getElementById('current-server-title');
    const currentServerDesc = document.getElementById('current-server-desc');
    const playerSourceUrl = document.getElementById('player-source-url');
    const btnCopyUrl = document.getElementById('btn-copy-url');
    const clock = document.getElementById('clock');
    const serversContainer = document.getElementById('servers-container');

    // Custom Accessible Player DOM Elements
    const videoWrapper = document.getElementById('video-wrapper');
    const customControls = document.getElementById('custom-controls');
    const ctrlPlayPause = document.getElementById('ctrl-play-pause');
    const ctrlMute = document.getElementById('ctrl-mute');
    const ctrlVolume = document.getElementById('ctrl-volume');
    const ctrlPip = document.getElementById('ctrl-pip');
    const ctrlFullscreen = document.getElementById('ctrl-fullscreen');
    
    const timelineContainer = document.getElementById('timeline-container');
    const timelineProgress = document.getElementById('timeline-progress');
    const timelineBuffer = document.getElementById('timeline-buffer');
    const timeElapsed = document.getElementById('time-elapsed');

    // Match Schedule DOM Elements
    const headerMatchText = document.getElementById('header-match-text');
    const headerMatchDot = document.getElementById('header-match-dot');
    const scheduleContainer = document.getElementById('schedule-container');
    const toastContainer = document.getElementById('toast-container');

    // Mobile Drawer (Bottom-sheet) DOM Elements & Event Handlers
    const mobileDrawer = document.getElementById('mobile-drawer');
    const mobileDrawerHeader = document.getElementById('mobile-drawer-header');
    const fabDotsToggle = document.getElementById('fab-dots-toggle');

    let drawerExpanded = false;
    let drawerStartY = 0;
    let drawerCurrentY = 0;
    let drawerHeight = 0;
    let drawerDragging = false;

    if (mobileDrawer && fabDotsToggle) {
        fabDotsToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            drawerExpanded = !drawerExpanded;
            toggleMobileDrawer(drawerExpanded);
        });
    }

    if (mobileDrawer && mobileDrawerHeader) {
        // Toggle drawer on header click
        mobileDrawerHeader.addEventListener('click', () => {
            if (!drawerDragging) {
                drawerExpanded = !drawerExpanded;
                toggleMobileDrawer(drawerExpanded);
            }
        });

        // Swipe up/down gesture touch handlers
        mobileDrawerHeader.addEventListener('touchstart', (e) => {
            drawerStartY = e.touches[0].clientY;
            drawerCurrentY = drawerStartY;
            drawerHeight = mobileDrawer.getBoundingClientRect().height;
            mobileDrawer.classList.add('bottom-sheet-dragging');
            drawerDragging = false;
        }, { passive: true });

        mobileDrawerHeader.addEventListener('touchmove', (e) => {
            drawerCurrentY = e.touches[0].clientY;
            let deltaY = drawerCurrentY - drawerStartY;
            if (Math.abs(deltaY) > 5) {
                drawerDragging = true;
            }

            if (drawerExpanded) {
                if (deltaY > 0) {
                    mobileDrawer.style.transform = `translateY(${deltaY}px)`;
                }
            } else {
                if (deltaY < 0) {
                    let targetTranslate = drawerHeight + deltaY;
                    if (targetTranslate > 0) {
                        mobileDrawer.style.transform = `translateY(${targetTranslate}px)`;
                    }
                }
            }
        }, { passive: true });

        mobileDrawerHeader.addEventListener('touchend', () => {
            mobileDrawer.classList.remove('bottom-sheet-dragging');
            mobileDrawer.style.transform = '';
            
            if (drawerDragging) {
                let deltaY = drawerCurrentY - drawerStartY;
                if (drawerExpanded) {
                    if (deltaY > 60) {
                        drawerExpanded = false;
                    }
                } else {
                    if (deltaY < -60) {
                        drawerExpanded = true;
                    }
                }
                toggleMobileDrawer(drawerExpanded);
            }
        }, { passive: true });
    }

    function toggleMobileDrawer(expand) {
        if (!mobileDrawer) return;
        if (expand) {
            mobileDrawer.classList.remove('translate-y-full');
            mobileDrawer.classList.add('translate-y-0');
            const headerSpan = mobileDrawerHeader.querySelector('span');
            if (headerSpan) headerSpan.textContent = 'Swipe down to close';
        } else {
            mobileDrawer.classList.remove('translate-y-0');
            mobileDrawer.classList.add('translate-y-full');
            const headerSpan = mobileDrawerHeader.querySelector('span');
            if (headerSpan) headerSpan.textContent = 'Swipe up for servers';
        }
    }

    // Failover & Auto-switching State
    let failoverCount = 0;
    let stallTimer = null;

    function startStallTimer() {
        clearStallTimer();
        stallTimer = setTimeout(() => {
            console.warn('[Stall Monitor] Stream stalled/waiting for more than 4 seconds, auto-skipping...');
            handleStreamError('Stream stalled.');
        }, 4000);
    }

    function clearStallTimer() {
        if (stallTimer) {
            clearTimeout(stallTimer);
            stallTimer = null;
        }
    }

    // ---------------------------------------------------------
    // 2. STREAM PLAYER FUNCTION
    // ---------------------------------------------------------
    // ---------------------------------------------------------
    // 2. STREAM PLAYER FUNCTION (DUAL-PLAYER ENGINE)
    // ---------------------------------------------------------
    function cleanupPlayer(player) {
        if (player === videoA) {
            if (hlsA) {
                hlsA.destroy();
                hlsA = null;
            }
        } else if (player === videoB) {
            if (hlsB) {
                hlsB.destroy();
                hlsB = null;
            }
        }
        player.removeAttribute('src');
        player.load();
    }

    function playStream(index) {
        const server = SERVERS[index];
        if (!server) return;

        const url = server.url;

        // If placeholder is not hidden, show full loader. Otherwise, load silently in background.
        const isInitialLoad = !playerPlaceholder.classList.contains('hidden') || !playerError.classList.contains('hidden');
        if (isInitialLoad) {
            playerLoader.classList.remove('hidden');
        }
        
        playerError.classList.add('hidden');
        playerPlaceholder.classList.add('hidden');

        // Start stall timer to auto-skip if initial load hangs for > 4s
        startStallTimer();

        // Update titles and info
        if (currentServerTitle) currentServerTitle.textContent = server.name;
        if (currentServerDesc) currentServerDesc.textContent = server.detail || 'Live Stream Feed';
        playerSourceUrl.textContent = url;

        // Clean up any stale load on the active player
        cleanupPlayer(activePlayer);

        let networkRetryCount = 0;
        const maxNetworkRetries = 3;
        let isReady = false;

        const targetPlayer = activePlayer;

        function onReady() {
            if (isReady) return;
            isReady = true;
            
            clearStallTimer();

            // Hide loader and show controls
            playerLoader.classList.add('hidden');
            customControls.classList.remove('hidden');
            playerError.classList.add('hidden');
            playerPlaceholder.classList.add('hidden');

            // Play the target player
            const playPromise = targetPlayer.play();
            if (playPromise !== undefined) {
                playPromise.catch(e => {
                    console.log('Autoplay blocked. Starting muted.');
                    targetPlayer.muted = true;
                    ctrlMute.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
                    ctrlVolume.value = 0;
                    targetPlayer.play().catch(err => console.error('Play retry failed:', err));
                });
            }

            // Bring active player to front
            targetPlayer.style.opacity = '1';
            targetPlayer.style.zIndex = '20';

            // Ensure other player is hidden
            const backupPlayer = targetPlayer === videoA ? videoB : videoA;
            backupPlayer.style.opacity = '0';
            backupPlayer.style.zIndex = '10';

            updateTelemetry();

            // Trigger background preloading of backup stream
            preloadBackupStream();
        }

        // Initialize HLS.js
        if (Hls.isSupported() && url.includes('.m3u8')) {
            const tempHls = new Hls({
                maxMaxBufferLength: 10,
                enableWorker: false, // Turn off web workers to fix mobile video decoding black screens
                lowLatencyMode: true,
                capLevelToPlayerSize: true, // Auto-scale resolution to player dimensions to prevent GPU stalls
                maxBufferHole: 2 // Automatically skip small gaps in segment streams to avoid freezes
            });
            
            if (targetPlayer === videoA) {
                hlsA = tempHls;
            } else {
                hlsB = tempHls;
            }

            tempHls.loadSource(url);
            tempHls.attachMedia(targetPlayer);

            const handleNativeReady = () => {
                onReady();
                targetPlayer.removeEventListener('loadedmetadata', handleNativeReady);
                targetPlayer.removeEventListener('canplay', handleNativeReady);
            };
            targetPlayer.addEventListener('loadedmetadata', handleNativeReady);
            targetPlayer.addEventListener('canplay', handleNativeReady);
            
            tempHls.on(Hls.Events.MANIFEST_PARSED, () => {
                onReady();
            });

            tempHls.on(Hls.Events.ERROR, (event, data) => {
                console.error('HLS error on active player:', data);
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            if (networkRetryCount < maxNetworkRetries) {
                                networkRetryCount++;
                                console.log(`Fatal network error on active player, retrying (${networkRetryCount}/${maxNetworkRetries})...`);
                                tempHls.startLoad();
                            } else {
                                handleStreamError('HLS Network Error.');
                            }
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            console.log('Fatal media error on active player, trying to recover...');
                            tempHls.recoverMediaError();
                            break;
                        default:
                            handleStreamError('HLS Fatal Error.');
                            break;
                    }
                }
            });
        } 
        // Native HLS Fallback
        else if (targetPlayer.canPlayType('application/vnd.apple.mpegurl') || !url.includes('.m3u8')) {
            targetPlayer.src = url;
            
            const handleMetadata = () => {
                onReady();
                targetPlayer.removeEventListener('loadedmetadata', handleMetadata);
                targetPlayer.removeEventListener('error', handleError);
            };

            const handleError = (e) => {
                console.error('Native video error on active player:', e);
                handleStreamError('Native Video Playback Error.');
                targetPlayer.removeEventListener('loadedmetadata', handleMetadata);
                targetPlayer.removeEventListener('error', handleError);
            };

            targetPlayer.addEventListener('loadedmetadata', handleMetadata);
            targetPlayer.addEventListener('error', handleError);
        } else {
            handlePlayerError('Your browser does not support HLS streaming natively or via Hls.js.');
        }
    }

    function preloadBackupStream() {
        const backupIndex = getBackupIndex(currentServerIndex);
        if (backupIndex === null) {
            console.log('[Preload] No backup stream available.');
            return;
        }

        const backupServer = SERVERS[backupIndex];
        const backupUrl = backupServer.url;
        console.log(`[Preload] Loading secondary backup stream in background: ${backupServer.name} (${backupUrl})`);

        // Clean up any stale loading on the idle player
        cleanupPlayer(idlePlayer);

        // Preload settings: muted, preloading manifest
        idlePlayer.muted = true;
        idlePlayer.style.opacity = '0';
        idlePlayer.style.zIndex = '10';

        if (Hls.isSupported() && backupUrl.includes('.m3u8')) {
            const tempHls = new Hls({
                maxMaxBufferLength: 5, // only pre-buffer 5 seconds to conserve bandwidth
                enableWorker: false, // Turn off web workers to fix mobile video decoding black screens
                lowLatencyMode: true,
                autoStartLoad: true,
                capLevelToPlayerSize: true,
                maxBufferHole: 2
            });

            if (idlePlayer === videoA) {
                hlsA = tempHls;
            } else {
                hlsB = tempHls;
            }

            tempHls.loadSource(backupUrl);
            tempHls.attachMedia(idlePlayer);
            
            tempHls.on(Hls.Events.MANIFEST_PARSED, () => {
                console.log(`[Preload] Backup stream ${backupServer.name} pre-buffered and standby.`);
            });
            tempHls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    console.warn('[Preload] Secondary backup stream failed during background load:', data);
                }
            });
        } else if (idlePlayer.canPlayType('application/vnd.apple.mpegurl') || !backupUrl.includes('.m3u8')) {
            idlePlayer.src = backupUrl;
            idlePlayer.load();
        }
    }

    function getBackupIndex(currentIndex) {
        if (SERVERS.length <= 1) return null;
        for (let i = 1; i < SERVERS.length; i++) {
            const nextIdx = (currentIndex + i) % SERVERS.length;
            if (SERVERS[nextIdx] && SERVERS[nextIdx].status !== 'offline') {
                return nextIdx;
            }
        }
        return null;
    }

    function updateTelemetry() {
        const sentimentVal = Math.round(70 + Math.random() * 20);
        const sentimentPercent = document.getElementById('sentiment-percent');
        const sentimentBar = document.getElementById('sentiment-bar');
        if (sentimentPercent && sentimentBar) {
            sentimentPercent.textContent = `${sentimentVal}% POSITIVE`;
            sentimentBar.style.width = `${sentimentVal}%`;
        }

        const activeDeckLabel = document.getElementById('active-deck-label');
        if (activeDeckLabel) {
            activeDeckLabel.textContent = activePlayer === videoA ? 'PRIMARY ENGINE A' : 'PRIMARY ENGINE B';
        }

        const telemetryLatency = document.getElementById('telemetry-latency');
        if (telemetryLatency && currentServerIndex !== null) {
            const srv = SERVERS[currentServerIndex];
            const lat = srv?.latency ? `${Math.round(srv.latency)}ms` : 'direct';
            telemetryLatency.textContent = `PRIMARY LATENCY: ${lat} / STABLE`;
        }

        const telemetryPreloaded = document.getElementById('telemetry-preloaded');
        const backupEngineStatus = document.getElementById('backup-engine-status');
        if (telemetryPreloaded && backupEngineStatus) {
            const backupIndex = getBackupIndex(currentServerIndex);
            if (backupIndex !== null && SERVERS[backupIndex]) {
                const bSrv = SERVERS[backupIndex];
                telemetryPreloaded.textContent = `PRELOAD QUEUE: ${bSrv.name}`;
                backupEngineStatus.textContent = 'STANDBY READY';
                backupEngineStatus.className = 'text-[#39ff14] font-bold';
            } else {
                telemetryPreloaded.textContent = 'PRELOAD QUEUE: EMPTY';
                backupEngineStatus.textContent = 'UNAVAILABLE';
                backupEngineStatus.className = 'text-[#ff2d55] font-bold';
            }
        }
    }

    function handlePlayerError(msg) {
        playerLoader.classList.add('hidden');
        playerError.classList.remove('hidden');
        errorMessage.textContent = msg;
        cleanupPlayer(activePlayer);
        cleanupPlayer(idlePlayer);
    }

    window.changeServer = function(url, index, isAutoSwitch = false) {
        currentServerIndex = index;

        if (!isAutoSwitch) {
            failoverCount = 0;
        }

        // Re-render server grid
        renderServersGrid(SERVERS);

        // Play the stream
        playStream(index);

        toggleMobileDrawer(false);
        drawerExpanded = false;
    };

    // Initialize the servers list in the DOM dynamically
    loadDynamicStreams();


    // ---------------------------------------------------------
    // 4. CUSTOM ACCESSIBLE PLAYER CONTROLLER LOGIC
    // ---------------------------------------------------------
    function togglePlay() {
        if (activePlayer.paused) {
            activePlayer.play().catch(e => console.log('Play request interrupted:', e));
            ctrlPlayPause.innerHTML = '<i class="fa-solid fa-pause"></i>';
        } else {
            activePlayer.pause();
            ctrlPlayPause.innerHTML = '<i class="fa-solid fa-play"></i>';
        }
    }

    ctrlPlayPause.addEventListener('click', togglePlay);

    // Setup Video Event Listeners for both player elements dynamically
    function setupVideoListeners(videoEl) {
        videoEl.addEventListener('play', () => {
            if (videoEl !== activePlayer) return;
            ctrlPlayPause.innerHTML = '<i class="fa-solid fa-pause"></i>';
            customControls.classList.remove('hidden');
            showControlsTemporarily();
            clearStallTimer();
        });

        videoEl.addEventListener('pause', () => {
            if (videoEl !== activePlayer) return;
            ctrlPlayPause.innerHTML = '<i class="fa-solid fa-play"></i>';
            clearTimeout(controlsTimeout);
            customControls.classList.remove('hide-controls');
            videoWrapper.classList.remove('hide-cursor');
            clearStallTimer();
        });

        videoEl.addEventListener('waiting', () => {
            if (videoEl !== activePlayer) return;
            startStallTimer();
        });

        videoEl.addEventListener('stalled', () => {
            if (videoEl !== activePlayer) return;
            startStallTimer();
        });

        videoEl.addEventListener('playing', () => {
            if (videoEl !== activePlayer) return;
            clearStallTimer();
        });

        // Click on video playing area toggles controls temporarily (does not pause stream)
        videoEl.addEventListener('click', (e) => {
            if (videoEl !== activePlayer) return;
            e.stopPropagation();
            showControlsTemporarily();
        });

        // Progress updates & timeline buffering
        videoEl.addEventListener('timeupdate', () => {
            if (videoEl !== activePlayer) return;
            clearStallTimer();
            if (videoEl.duration && videoEl.duration !== Infinity) {
                const percent = (videoEl.currentTime / videoEl.duration) * 100;
                timelineProgress.style.width = `${percent}%`;
                timeElapsed.textContent = `${formatTime(videoEl.currentTime)} / ${formatTime(videoEl.duration)}`;
            } else {
                timelineProgress.style.width = '0%';
                timeElapsed.textContent = formatTime(videoEl.currentTime);
            }

            // Buffer bar calculations
            if (videoEl.buffered.length > 0 && videoEl.duration) {
                const bufferedEnd = videoEl.buffered.end(videoEl.buffered.length - 1);
                const percent = (bufferedEnd / videoEl.duration) * 100;
                timelineBuffer.style.width = `${percent}%`;
            } else {
                timelineBuffer.style.width = '0%';
            }
        });
    }

    setupVideoListeners(videoA);
    setupVideoListeners(videoB);

    // Volume & Mute logic (applied to both players to prevent cross-fade volume jumps)
    function setVolume(val) {
        videoA.volume = val;
        videoB.volume = val;
        const isMuted = (val === 0);
        videoA.muted = isMuted;
        videoB.muted = isMuted;
        
        if (isMuted) {
            ctrlMute.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
        } else if (val < 0.5) {
            ctrlMute.innerHTML = '<i class="fa-solid fa-volume-low"></i>';
        } else {
            ctrlMute.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
        }
        ctrlVolume.value = val;
    }

    function toggleMute() {
        const newMuted = !activePlayer.muted;
        videoA.muted = newMuted;
        videoB.muted = newMuted;
        if (newMuted) {
            ctrlMute.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
            ctrlVolume.value = 0;
        } else {
            ctrlMute.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
            ctrlVolume.value = activePlayer.volume;
        }
    }

    ctrlMute.addEventListener('click', toggleMute);

    ctrlVolume.addEventListener('input', (e) => {
        setVolume(parseFloat(e.target.value));
    });

    // Format time display
    function formatTime(time) {
        if (isNaN(time) || time === Infinity) return '00:00';
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    function handleSeekEvent(clientX) {
        if (activePlayer.duration && activePlayer.duration !== Infinity) {
            const rect = timelineContainer.getBoundingClientRect();
            const clickX = clientX - rect.left;
            const width = rect.width;
            const newTime = Math.max(0, Math.min(activePlayer.duration, (clickX / width) * activePlayer.duration));
            activePlayer.currentTime = newTime;
        }
    }

    timelineContainer.addEventListener('click', (e) => {
        handleSeekEvent(e.clientX);
    });

    timelineContainer.addEventListener('touchstart', (e) => {
        if (e.touches && e.touches[0]) {
            handleSeekEvent(e.touches[0].clientX);
        }
    }, { passive: true });

    // Picture in Picture
    if (!document.pictureInPictureEnabled) {
        ctrlPip.style.display = 'none';
    }
    ctrlPip.addEventListener('click', async () => {
        try {
            if (activePlayer !== document.pictureInPictureElement) {
                await activePlayer.requestPictureInPicture();
            } else {
                await document.exitPictureInPicture();
            }
        } catch (error) {
            console.error(error);
        }
    });

    // Fullscreen Toggle
    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            videoWrapper.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    }
    ctrlFullscreen.addEventListener('click', toggleFullscreen);

    document.addEventListener('fullscreenchange', () => {
        if (document.fullscreenElement) {
            ctrlFullscreen.innerHTML = '<i class="fa-solid fa-compress"></i>';
        } else {
            ctrlFullscreen.innerHTML = '<i class="fa-solid fa-expand"></i>';
        }
    });


    // Auto-hide Control Bar logic for desktop mouse movements
    let controlsTimeout = null;
    function showControlsTemporarily() {
        customControls.classList.remove('hide-controls');
        videoWrapper.classList.remove('hide-cursor');
        
        clearTimeout(controlsTimeout);
        
        if (!activePlayer.paused) {
            controlsTimeout = setTimeout(() => {
                customControls.classList.add('hide-controls');
                videoWrapper.classList.add('hide-cursor');
            }, 2500);
        }
    }

    videoWrapper.addEventListener('mousemove', showControlsTemporarily);
    videoWrapper.addEventListener('mouseleave', () => {
        if (!activePlayer.paused) {
            customControls.classList.add('hide-controls');
            videoWrapper.classList.add('hide-cursor');
        }
    });

    // Ghost UI Mobile touch trigger class toggling (for controls overlay)
    let mobileControlsTimeout = null;
    function showMobileControls() {
        if (!customControls) return;
        customControls.classList.remove('hide-controls');
        if (videoWrapper) videoWrapper.classList.remove('hide-cursor');
        
        clearTimeout(mobileControlsTimeout);
        mobileControlsTimeout = setTimeout(() => {
            if (activePlayer && !activePlayer.paused) {
                customControls.classList.add('hide-controls');
                if (videoWrapper) videoWrapper.classList.add('hide-cursor');
            }
        }, 4000);
    }
    
    if (videoWrapper) {
        videoWrapper.addEventListener('touchstart', (e) => {
            if (e.target.closest('#custom-controls')) {
                return;
            }
            showMobileControls();
        }, { passive: true });
        
        videoWrapper.addEventListener('click', (e) => {
            if (e.target.closest('#custom-controls')) {
                return;
            }
            // Toggle controls overlay visibility on click/tap
            const isHidden = customControls.classList.contains('hide-controls');
            if (isHidden) {
                showControlsTemporarily();
            } else {
                customControls.classList.add('hide-controls');
                videoWrapper.classList.add('hide-cursor');
            }
        });
    }

    // Global Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
        if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
            return;
        }

        const key = e.key.toLowerCase();
        if (currentServerIndex === null) return;

        switch (key) {
            case ' ':
            case 'k':
                e.preventDefault();
                togglePlay();
                showControlsTemporarily();
                break;
            case 'm':
                e.preventDefault();
                toggleMute();
                showControlsTemporarily();
                break;
            case 'f':
                e.preventDefault();
                toggleFullscreen();
                break;
            case 'p':
                e.preventDefault();
                ctrlPip.click();
                break;
            case 'arrowleft':
                e.preventDefault();
                if (activePlayer.duration && activePlayer.duration !== Infinity) {
                    activePlayer.currentTime = Math.max(0, activePlayer.currentTime - 5);
                    showControlsTemporarily();
                }
                break;
            case 'arrowright':
                e.preventDefault();
                if (activePlayer.duration && activePlayer.duration !== Infinity) {
                    activePlayer.currentTime = Math.min(activePlayer.duration, activePlayer.currentTime + 5);
                    showControlsTemporarily();
                }
                break;
            case 'arrowup':
                e.preventDefault();
                setVolume(Math.min(1, activePlayer.volume + 0.05));
                showControlsTemporarily();
                break;
            case 'arrowdown':
                e.preventDefault();
                setVolume(Math.max(0, activePlayer.volume - 0.05));
                showControlsTemporarily();
                break;
        }
    });

    // Retry button on error overlay
    if (btnRetry) {
        btnRetry.addEventListener('click', () => {
            if (currentServerIndex !== null) {
                const server = SERVERS[currentServerIndex];
                window.changeServer(server.url, currentServerIndex);
            }
        });
    }

    // Copy stream link button
    if (btnCopyUrl) {
        btnCopyUrl.addEventListener('click', () => {
            const url = playerSourceUrl.textContent;
            if (url && url !== 'None Loaded') {
                navigator.clipboard.writeText(url).then(() => {
                    const icon = btnCopyUrl.querySelector('i');
                    if (icon) {
                        icon.className = 'fa-solid fa-check text-accent';
                        setTimeout(() => {
                            icon.className = 'fa-regular fa-copy';
                        }, 2000);
                    }
                }).catch(err => {
                    alert('Failed to copy: ' + err);
                });
            }
        });
    }

    // Placeholder click triggers Server 1 (index 0)
    if (playerPlaceholder) {
        playerPlaceholder.addEventListener('click', () => {
            if (SERVERS.length > 0) {
                window.changeServer(SERVERS[0].url, 0);
            }
        });
    }

    // ---------------------------------------------------------
    // 5. TOAST NOTIFICATIONS & AUTO-FAILOVER RECOVERY
    // ---------------------------------------------------------
    function showToast(message) {
        if (!toastContainer) return;
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.innerHTML = `
            <i class="fa-solid fa-arrows-spin toast-icon"></i>
            <span>${message}</span>
        `;
        toastContainer.appendChild(toast);
        
        // Trigger show animation
        setTimeout(() => toast.classList.add('show'), 50);
        
        // Remove after timeout
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }

    function handleStreamError(errorMsg) {
        failoverCount++;
        
        const backupIndex = getBackupIndex(currentServerIndex);
        if (backupIndex !== null && failoverCount < SERVERS.length) {
            const backupServer = SERVERS[backupIndex];
            
            console.warn(`[Failover] Primary feed disruption. Hot-switching to preloaded backup server: ${backupServer.name}...`);
            showToast(`FEED DISRUPTION. AUTO-SWITCHING TO ${backupServer.name}...`);
            
            // Execute the zero-lag cross-fade swap
            // 1. Match volume/mute state on the idle player
            idlePlayer.volume = activePlayer.volume;
            idlePlayer.muted = activePlayer.muted;

            // 2. Play the idle player
            idlePlayer.play().catch(e => console.log('Failover play block:', e));

            // 3. Swap opacity and z-index (cross-fade transition)
            idlePlayer.style.opacity = '1';
            idlePlayer.style.zIndex = '20';

            activePlayer.style.opacity = '0';
            activePlayer.style.zIndex = '10';

            // 4. Swap variables
            const tempPlayer = activePlayer;
            activePlayer = idlePlayer;
            idlePlayer = tempPlayer;

            // 5. Update index pointer
            currentServerIndex = backupIndex;

            // 6. Highlight new active row in dashboard
            renderServersGrid(SERVERS);

            // 7. Cleanup the previous active player (now idle) after transition (350ms)
            setTimeout(() => {
                tempPlayer.pause();
                cleanupPlayer(tempPlayer);
                
                // 8. Preload the NEXT backup stream on the newly freed idle player
                preloadBackupStream();
            }, 350);

            updateTelemetry();
        } else {
            handlePlayerError('ALL INCOMING BROADCAST FEEDS DISRUPTED. PLEASE MONITOR CONSOLE FOR REBOOT CORRECTION.');
            failoverCount = 0; // Reset loop
        }
    }

    // ---------------------------------------------------------
    // 6. DYNAMIC MATCHES SCHEDULE (REALTIME API & SIMULATION)
    // ---------------------------------------------------------
    const TEAM_FLAGS = {
        'Algeria': 'dz',
        'Argentina': 'ar',
        'Australia': 'au',
        'Austria': 'at',
        'Belgium': 'be',
        'Bosnia and Herzegovina': 'ba',
        'Brazil': 'br',
        'Cabo Verde': 'cv',
        'Canada': 'ca',
        'Colombia': 'co',
        'Congo DR': 'cd',
        "Cote d'Ivoire": 'ci',
        'Croatia': 'hr',
        'Curacao': 'cw',
        'Czechia': 'cz',
        'Ecuador': 'ec',
        'Egypt': 'eg',
        'England': 'gb-eng',
        'France': 'fr',
        'Germany': 'de',
        'Ghana': 'gh',
        'Haiti': 'ht',
        'IR Iran': 'ir',
        'Iraq': 'iq',
        'Japan': 'jp',
        'Jordan': 'jo',
        'Korea Republic': 'kr',
        'Mexico': 'mx',
        'Morocco': 'ma',
        'Netherlands': 'nl',
        'New Zealand': 'nz',
        'Norway': 'no',
        'Panama': 'pa',
        'Paraguay': 'py',
        'Portugal': 'pt',
        'Qatar': 'qa',
        'Saudi Arabia': 'sa',
        'Scotland': 'gb-sct',
        'Senegal': 'sn',
        'South Africa': 'za',
        'Spain': 'es',
        'Sweden': 'se',
        'Switzerland': 'ch',
        'Tunisia': 'tn',
        'Turkiye': 'tr',
        'United States': 'us',
        'Uruguay': 'uy',
        'Uzbekistan': 'uz'
    };

    function getTeamFlagUrl(teamName) {
        const code = TEAM_FLAGS[teamName];
        if (code) return `https://flagcdn.com/w80/${code}.png`;
        return '';
    }

    let allMatches = [];
    let uniqueDates = [];
    let currentDateIndex = 0;

    function getDeterministicScore(matchNumber) {
        const x = Math.sin(matchNumber) * 10000;
        const r1 = Math.floor((x - Math.floor(x)) * 5); // 0 to 4 goals
        const y = Math.cos(matchNumber) * 10000;
        const r2 = Math.floor((y - Math.floor(y)) * 4); // 0 to 3 goals
        return { score1: r1, score2: r2 };
    }

    function getLiveScore(matchNumber, elapsedMin) {
        const final = getDeterministicScore(matchNumber);
        const goalTimes1 = [];
        const goalTimes2 = [];
        
        for (let i = 0; i < final.score1; i++) {
            const seed = Math.sin(matchNumber + i * 7) * 10000;
            const time = 1 + Math.floor((seed - Math.floor(seed)) * 90);
            goalTimes1.push(time);
        }
        
        for (let i = 0; i < final.score2; i++) {
            const seed = Math.cos(matchNumber + i * 13) * 10000;
            const time = 1 + Math.floor((seed - Math.floor(seed)) * 90);
            goalTimes2.push(time);
        }
        
        const currentScore1 = goalTimes1.filter(t => t <= elapsedMin).length;
        const currentScore2 = goalTimes2.filter(t => t <= elapsedMin).length;
        
        return {
            score1: currentScore1,
            score2: currentScore2
        };
    }

    function getLocalDateString(dateObj) {
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function getLocalFallbackMatches() {
        return [
            { matchNumber: 49, date: "2026-06-24", kickoffUtc: "2026-06-24T22:00:00Z", stage: "group-stage", group: "Group C", homeTeam: "Scotland", awayTeam: "Brazil", stadium: "Hard Rock Stadium", hostCity: "miami" },
            { matchNumber: 50, date: "2026-06-24", kickoffUtc: "2026-06-24T22:00:00Z", stage: "group-stage", group: "Group C", homeTeam: "Morocco", awayTeam: "Haiti", stadium: "Mercedes-Benz Stadium", hostCity: "atlanta" },
            { matchNumber: 51, date: "2026-06-24", kickoffUtc: "2026-06-24T19:00:00Z", stage: "group-stage", group: "Group B", homeTeam: "Switzerland", awayTeam: "Canada", stadium: "BC Place", hostCity: "vancouver" },
            { matchNumber: 52, date: "2026-06-24", kickoffUtc: "2026-06-24T19:00:00Z", stage: "group-stage", group: "Group B", homeTeam: "Bosnia and Herzegovina", awayTeam: "Qatar", stadium: "Lumen Field", hostCity: "seattle" },
            { matchNumber: 53, date: "2026-06-24", kickoffUtc: "2026-06-25T01:00:00Z", stage: "group-stage", group: "Group A", homeTeam: "Czechia", awayTeam: "Mexico", stadium: "Estadio Azteca", hostCity: "mexico-city" },
            { matchNumber: 54, date: "2026-06-24", kickoffUtc: "2026-06-25T01:00:00Z", stage: "group-stage", group: "Group A", homeTeam: "South Africa", awayTeam: "Korea Republic", stadium: "Estadio BBVA", hostCity: "monterrey" },
            { matchNumber: 55, date: "2026-06-25", kickoffUtc: "2026-06-25T20:00:00Z", stage: "group-stage", group: "Group E", homeTeam: "Curacao", awayTeam: "Cote d'Ivoire", stadium: "Lincoln Financial Field", hostCity: "philadelphia" },
            { matchNumber: 56, date: "2026-06-25", kickoffUtc: "2026-06-25T20:00:00Z", stage: "group-stage", group: "Group E", homeTeam: "Ecuador", awayTeam: "Germany", stadium: "MetLife Stadium", hostCity: "new-york" },
            { matchNumber: 57, date: "2026-06-25", kickoffUtc: "2026-06-25T23:00:00Z", stage: "group-stage", group: "Group F", homeTeam: "Japan", awayTeam: "Sweden", stadium: "AT&T Stadium", hostCity: "dallas" },
            { matchNumber: 58, date: "2026-06-25", kickoffUtc: "2026-06-25T23:00:00Z", stage: "group-stage", group: "Group F", homeTeam: "Tunisia", awayTeam: "Netherlands", stadium: "Arrowhead Stadium", hostCity: "kansas-city" },
            { matchNumber: 59, date: "2026-06-25", kickoffUtc: "2026-06-26T02:00:00Z", stage: "group-stage", group: "Group D", homeTeam: "Turkiye", awayTeam: "United States", stadium: "SoFi Stadium", hostCity: "los-angeles" },
            { matchNumber: 60, date: "2026-06-25", kickoffUtc: "2026-06-26T02:00:00Z", stage: "group-stage", group: "Group D", homeTeam: "Paraguay", awayTeam: "Australia", stadium: "Levi's Stadium", hostCity: "san-francisco" },
            { matchNumber: 61, date: "2026-06-26", kickoffUtc: "2026-06-26T19:00:00Z", stage: "group-stage", group: "Group I", homeTeam: "Norway", awayTeam: "France", stadium: "Gillette Stadium", hostCity: "boston" }
        ];
    }

    function renderTeamRow(teamName, score) {
        const isPlaceholder = teamName.startsWith('Winner') || teamName.startsWith('Loser') || teamName.includes('runners-up') || teamName.includes('winners') || teamName.includes('third place');
        let logoHtml = '';
        if (isPlaceholder) {
            logoHtml = `<span class="team-placeholder-icon"><i class="fa-solid fa-users"></i></span>`;
        } else {
            const flagUrl = getTeamFlagUrl(teamName);
            if (flagUrl) {
                logoHtml = `<img class="team-flag" src="${flagUrl}" alt="${teamName}" onerror="this.outerHTML='<span class=\"team-placeholder-icon\"><i class=\"fa-solid fa-users\"></i></span>';">`;
            } else {
                logoHtml = `<span class="team-placeholder-icon"><i class="fa-solid fa-users"></i></span>`;
            }
        }
        
        const scoreHtml = score !== null ? `<span class="team-score">${score}</span>` : '<span class="team-score text-white/20">-</span>';
        
        return `
            <div class="team-row">
                <div class="team-info">
                    ${logoHtml}
                    <span class="team-name-text" title="${teamName}">${teamName}</span>
                </div>
                ${scoreHtml}
            </div>
        `;
    }

    function updateScheduleUI() {
        if (uniqueDates.length === 0) return;
        
        const now = new Date();
        const selectedDateStr = uniqueDates[currentDateIndex];
        
        const parts = selectedDateStr.split('-');
        const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        const selectedMatches = allMatches.filter(m => m.localDate === selectedDateStr);
        let renderedHtml = '';
        
        selectedMatches.forEach((match) => {
            const kickoff = new Date(match.kickoffUtc);
            const matchDurationMs = 2 * 60 * 60 * 1000;
            const matchEnd = new Date(kickoff.getTime() + matchDurationMs);
            
            let status = 'upcoming';
            let badgeClass = 'upcoming';
            let statusText = 'Upcoming';
            
            let timeLabel = '';
            try {
                const timeStr = kickoff.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                const parts = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' }).formatToParts(kickoff);
                const tzPart = parts.find(p => p.type === 'timeZoneName');
                const tzAbbr = tzPart ? tzPart.value : '';
                timeLabel = `${timeStr} ${tzAbbr}`.trim();
            } catch (e) {
                timeLabel = kickoff.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            }
            
            let score1 = null;
            let score2 = null;
            
            if (now < kickoff) {
                status = 'upcoming';
                badgeClass = 'upcoming';
                statusText = 'Upcoming';
            } else if (now >= kickoff && now < matchEnd) {
                status = 'live';
                badgeClass = 'live';
                const elapsedMin = Math.floor((now - kickoff) / 60000);
                
                if (elapsedMin < 45) {
                    statusText = 'Live';
                    timeLabel = `${elapsedMin}'`;
                } else if (elapsedMin >= 45 && elapsedMin < 60) {
                    statusText = 'HT';
                    timeLabel = 'Halftime';
                } else if (elapsedMin >= 60 && elapsedMin < 105) {
                    statusText = 'Live';
                    timeLabel = `${elapsedMin - 15}'`;
                } else {
                    statusText = 'Live';
                    timeLabel = '90+';
                }
                
                const liveScore = getLiveScore(match.matchNumber, elapsedMin);
                score1 = liveScore.score1;
                score2 = liveScore.score2;
            } else {
                status = 'finished';
                badgeClass = 'finished';
                statusText = 'FT';
                timeLabel = 'Full Time';
                
                const finalScore = getDeterministicScore(match.matchNumber);
                score1 = finalScore.score1;
                score2 = finalScore.score2;
            }
            
            const isLive = status === 'live';
            const tuneInBtn = isLive ? `
                <button class="bg-[#ff7a00] hover:bg-[#ff7a00]/90 text-white font-bold px-3 py-1 rounded-lg text-[10px] cursor-pointer" onclick="window.changeServer(SERVERS[0].url, 0)">
                    Tune In
                </button>
            ` : `<span class="text-white/30 text-[10px] font-semibold">${timeLabel}</span>`;

            renderedHtml += `
                <div class="schedule-card ${isLive ? 'live-match-card' : ''}">
                    <div class="flex flex-col gap-2">
                        ${renderTeamRow(match.homeTeam, score1)}
                        ${renderTeamRow(match.awayTeam, score2)}
                    </div>
                    <div class="schedule-card-footer">
                        <span class="match-status-badge ${badgeClass}">${statusText}</span>
                        ${tuneInBtn}
                    </div>
                </div>
            `;
        });
        
        if (scheduleContainer) {
            scheduleContainer.innerHTML = renderedHtml || '<p style="text-align:center;color:rgba(255,255,255,0.4);padding:10px;">No matches scheduled</p>';
        }
        
        updateHeaderBanner(now);
    }

    function updateHeaderBanner(now) {
        let liveMatch = null;
        let nextUpcoming = null;
        
        allMatches.forEach((match) => {
            const kickoff = new Date(match.kickoffUtc);
            const matchDurationMs = 2 * 60 * 60 * 1000;
            const matchEnd = new Date(kickoff.getTime() + matchDurationMs);
            
            let status = match.status;
            if (status === 'live' || (now >= kickoff && now < matchEnd)) {
                liveMatch = match;
            } else if (now < kickoff) {
                if (!nextUpcoming || kickoff < new Date(nextUpcoming.kickoffUtc)) {
                    nextUpcoming = match;
                }
            }
        });
        
        if (liveMatch) {
            const kickoff = new Date(liveMatch.kickoffUtc);
            let score1 = liveMatch.score1;
            let score2 = liveMatch.score2;
            
            if (score1 === null || score2 === null) {
                const elapsedMin = Math.floor((now - kickoff) / 60000);
                const liveScore = getLiveScore(liveMatch.id, elapsedMin);
                score1 = liveScore.score1;
                score2 = liveScore.score2;
            }
            
            if (headerMatchText) {
                headerMatchText.innerHTML = `<span class="live-pulse-dot inline-block w-1.5 h-1.5 bg-[#ef4444] rounded-full mr-1.5 animate-ping"></span> <strong>LIVE:</strong> ${liveMatch.homeTeam} ${score1} - ${score2} ${liveMatch.awayTeam}`;
            }
            if (headerMatchDot) headerMatchDot.style.display = 'inline-block';
        } else if (nextUpcoming) {
            const kickoff = new Date(nextUpcoming.kickoffUtc);
            const formattedTime = kickoff.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
            if (headerMatchText) {
                headerMatchText.textContent = `NEXT: ${nextUpcoming.homeTeam} vs. ${nextUpcoming.awayTeam} (${formattedTime})`;
            }
            if (headerMatchDot) headerMatchDot.style.display = 'none';
        } else {
            if (headerMatchText) headerMatchText.textContent = "All matches completed for today";
            if (headerMatchDot) headerMatchDot.style.display = 'none';
        }
    }

    function setupScheduleNav() {
        const btnPrev = document.getElementById('sched-prev-day');
        const btnNext = document.getElementById('sched-next-day');
        
        if (btnPrev && btnNext) {
            btnPrev.addEventListener('click', () => {
                if (currentDateIndex > 0) {
                    currentDateIndex--;
                    updateScheduleUI();
                }
            });
            
            btnNext.addEventListener('click', () => {
                if (currentDateIndex < uniqueDates.length - 1) {
                    currentDateIndex++;
                    updateScheduleUI();
                }
            });
        }
    }

    function parseSalahTime(dateStr, timeStr) {
        try {
            let t = timeStr.replace('UTC', '').replace(/\s+/g, '');
            if (!t.includes('-') && !t.includes('+')) {
                t += '+00:00';
            } else {
                const match = t.match(/([-+])(\d+)(?::(\d+))?/);
                if (match) {
                    const sign = match[1];
                    const hours = match[2].padStart(2, '0');
                    const mins = (match[3] || '00').padStart(2, '0');
                    t = t.replace(match[0], `${sign}${hours}:${mins}`);
                }
            }
            return new Date(`${dateStr}T${t}`);
        } catch (e) {
            console.error('Error parsing Salah time:', dateStr, timeStr, e);
            return new Date(dateStr + 'T12:00:00Z');
        }
    }

    function normalizeTeamName(name) {
        if (!name) return '';
        return name.toLowerCase()
                   .normalize("NFD")
                   .replace(/[\u0300-\u036f]/g, "")
                   .trim();
    }

    function fuzzyMatchTeam(name1, name2) {
        if (name1 === name2) return true;
        if (name1.includes(name2) || name2.includes(name1)) return true;
        const synonyms = [
            ['usa', 'united states', 'us'],
            ['ivory coast', "cote d'ivoire", 'cote divoire'],
            ['turkiye', 'turkey'],
            ['south korea', 'korea republic', 'korea rep'],
            ['cape verde', 'cabo verde']
        ];
        for (const synList of synonyms) {
            const normalizedSyns = synList.map(s => normalizeTeamName(s));
            if (normalizedSyns.includes(name1) && normalizedSyns.includes(name2)) return true;
        }
        return false;
    }

    function findMatch(team1, team2) {
        const t1 = normalizeTeamName(team1);
        const t2 = normalizeTeamName(team2);
        return allMatches.find(m => {
            const h = normalizeTeamName(m.homeTeam);
            const a = normalizeTeamName(m.awayTeam);
            return (fuzzyMatchTeam(h, t1) && fuzzyMatchTeam(a, t2)) ||
                   (fuzzyMatchTeam(h, t2) && fuzzyMatchTeam(a, t1));
        });
    }

    async function updateRealtimeScores() {
        // Fetch results (past matches scores)
        try {
            const res = await fetch('https://wcup2026.org/api/data.php?action=results');
            if (res.ok) {
                const data = await res.json();
                const matches = data.matches || [];
                matches.forEach(m => {
                    const match = findMatch(m.team1, m.team2);
                    if (match) {
                        match.status = m.status || 'finished';
                        if (m.score) {
                            match.score1 = m.score[0] !== undefined ? m.score[0] : null;
                            match.score2 = m.score[1] !== undefined ? m.score[1] : null;
                        }
                    }
                });
            }
        } catch (e) {
            console.warn('Failed to update historical results:', e);
        }

        // Fetch today's live/upcoming/finished matches
        try {
            const res = await fetch('https://wcup2026.org/api/data.php?action=today');
            if (res.ok) {
                const data = await res.json();
                const matches = data.matches || [];
                matches.forEach(m => {
                    const match = findMatch(m.team1, m.team2);
                    if (match) {
                        match.status = m.status || 'upcoming';
                        if (m.score) {
                            match.score1 = m.score[0] !== undefined ? m.score[0] : null;
                            match.score2 = m.score[1] !== undefined ? m.score[1] : null;
                        }
                        match.liveMinute = m.live_minute;
                    }
                });
            }
        } catch (e) {
            console.warn('Failed to update today\'s matches:', e);
        }
    }

    async function fetchMatches() {
        try {
            const res = await fetch('https://raw.githubusercontent.com/salah23222/worldcup2026/main/data/worldcup_fallback.json');
            if (!res.ok) throw new Error('Failed to load salah fallback fixtures');
            const data = await res.json();
            const rawMatches = data.matches || [];
            
            allMatches = rawMatches.map((m, idx) => {
                const kickoff = parseSalahTime(m.date, m.time);
                return {
                    id: idx + 1,
                    round: m.round || '',
                    group: m.group || '',
                    homeTeam: m.team1,
                    awayTeam: m.team2,
                    kickoffUtc: kickoff.toISOString(),
                    stadium: m.ground || '',
                    status: 'upcoming',
                    score1: null,
                    score2: null,
                    liveMinute: null
                };
            });
        } catch (e) {
            console.warn('Failed to load fallback fixtures from GitHub, loading local fallbacks:', e);
            allMatches = getLocalFallbackMatches().map((m, idx) => ({
                id: m.matchNumber || idx + 1,
                round: m.stage || '',
                group: m.group || '',
                homeTeam: m.homeTeam,
                awayTeam: m.awayTeam,
                kickoffUtc: m.kickoffUtc,
                stadium: m.stadium || '',
                status: 'upcoming',
                score1: null,
                score2: null,
                liveMinute: null
            }));
        }

        await updateRealtimeScores();

        const datesSet = new Set();
        allMatches.forEach(m => {
            const kickoff = new Date(m.kickoffUtc);
            const localDate = getLocalDateString(kickoff);
            m.localDate = localDate;
            datesSet.add(localDate);
        });
        uniqueDates = Array.from(datesSet).sort();

        const now = new Date();
        const todayStr = getLocalDateString(now);

        let targetIndex = uniqueDates.indexOf(todayStr);
        if (targetIndex === -1) {
            targetIndex = uniqueDates.findIndex(d => d >= todayStr);
            if (targetIndex === -1) {
                targetIndex = uniqueDates.length - 1;
            }
        }
        currentDateIndex = Math.max(0, targetIndex);

        setupScheduleNav();
        updateScheduleUI();
        
        setInterval(async () => {
            await updateRealtimeScores();
            updateScheduleUI();
        }, 15000);
    }

    // Set placeholder description dynamically
     const placeholderDesc = playerPlaceholder.querySelector('p');
     if (placeholderDesc) {
         placeholderDesc.textContent = "Select one of the live servers below to start streaming matches instantly.";
     }
 
     // Start fetching match fixtures
     fetchMatches();
 
     // ---------------------------------------------------------
     // 7. DEFAULT BROADCAST LOADING
     // ---------------------------------------------------------
     // Default stream is loaded dynamically inside loadDynamicStreams()


    // ---------------------------------------------------------
    // 9. SIDEBAR TABS & LIVE CHAT SIMULATION
    // ---------------------------------------------------------
    const tabBtnServers = document.getElementById('tab-btn-servers');
    const tabBtnChat = document.getElementById('tab-btn-chat');
    const panelServers = document.getElementById('sidebar-servers-panel');
    const panelChat = document.getElementById('sidebar-chat-panel');

    if (tabBtnServers && tabBtnChat && panelServers && panelChat) {
        tabBtnServers.addEventListener('click', () => {
            tabBtnServers.classList.add('active');
            tabBtnChat.classList.remove('active');
            panelServers.classList.remove('hidden');
            panelChat.classList.add('hidden');
        });

        tabBtnChat.addEventListener('click', () => {
            tabBtnChat.classList.add('active');
            tabBtnServers.classList.remove('active');
            panelChat.classList.remove('hidden');
            panelServers.classList.add('hidden');
            
            // Auto scroll to bottom when opening chat
            const chatContainer = document.getElementById('chat-messages-container');
            if (chatContainer) {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
        });
    }

    function initLiveChatSimulation() {
        const chatContainer = document.getElementById('chat-messages-container');
        if (!chatContainer) return;

        const chatInput = document.getElementById('chat-input-field');
        const chatSendBtn = document.getElementById('chat-send-btn');

        const USERNAMES = ['GamerPro2026', 'CopaViewer', 'FifaFanatic', 'MonirulFan', 'ZidLiveStream', 'GoalGetter', 'FootyBuff', 'MessiGOAT', 'Cr7Legacy', 'SambaMagic'];
        const MESSAGES = [
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
        const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#ff9f0a', '#a855f7', '#ec4899', '#ff7a00'];

        // Persistent local user setup
        let localUsername = localStorage.getItem('zid_chat_username');
        if (!localUsername) {
            localUsername = 'Viewer_' + Math.floor(1000 + Math.random() * 9000);
            localStorage.setItem('zid_chat_username', localUsername);
        }
        let localUserColor = localStorage.getItem('zid_chat_color');
        if (!localUserColor) {
            localUserColor = COLORS[Math.floor(Math.random() * COLORS.length)];
            localStorage.setItem('zid_chat_color', localUserColor);
        }

        // Add header with username edit capability
        const infoHeader = document.createElement('div');
        infoHeader.className = 'text-[10px] text-white/30 pb-2 border-b border-white/5 mb-2 flex justify-between items-center w-full';
        infoHeader.innerHTML = `
            <span>Global Chat Room</span>
            <span>Your Name: <span id="local-username-display" class="font-bold text-[#ff7a00] cursor-pointer underline hover:text-[#ff7a00]/80" onclick="changeChatUsername()">${localUsername}</span></span>
        `;
        chatContainer.appendChild(infoHeader);

        window.changeChatUsername = () => {
            const currentName = localStorage.getItem('zid_chat_username') || 'Viewer';
            const newName = prompt('Enter your new username (max 15 chars):', currentName);
            if (newName && newName.trim()) {
                const cleaned = newName.trim().substring(0, 15);
                localStorage.setItem('zid_chat_username', cleaned);
                const display = document.getElementById('local-username-display');
                if (display) display.textContent = cleaned;
                
                // Alert chat room of username change
                sendSystemNotice(`${currentName} changed their name to ${cleaned}`);
            }
        };

        const displayedMessageIds = new Set();

        function appendMessage(user, text, color, isSystem = false, msgId = null) {
            if (msgId) {
                if (displayedMessageIds.has(msgId)) return;
                displayedMessageIds.add(msgId);
            }
            const div = document.createElement('div');
            div.className = 'chat-bubble';
            if (isSystem) {
                div.innerHTML = `<span class="text-white/40 italic text-[10px]">${text}</span>`;
            } else {
                div.innerHTML = `
                    <span class="chat-username" style="color: ${color}">${user}:</span>
                    <span class="text-white/80">${text}</span>
                `;
            }
            chatContainer.appendChild(div);
            chatContainer.scrollTop = chatContainer.scrollHeight;

            if (chatContainer.children.length > 80) {
                // Keep the header infoNode (index 0) intact, remove index 1
                if (chatContainer.children[1]) chatContainer.children[1].remove();
            }
        }

        function sendSystemNotice(noticeText) {
            fetch('https://ntfy.sh/zidvaionair_chat_2026', {
                method: 'POST',
                body: JSON.stringify({
                    system: true,
                    text: noticeText
                })
            }).catch(e => {});
        }

        function generateSimulatedMessage() {
            const user = USERNAMES[Math.floor(Math.random() * USERNAMES.length)];
            const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
            const color = COLORS[Math.floor(Math.random() * COLORS.length)];
            const simId = 'sim_' + Math.random().toString(36).substr(2, 9);
            appendMessage(user, msg, color, false, simId);
        }

        function sendMessage() {
            if (!chatInput) return;
            const text = chatInput.value.trim();
            if (!text) return;

            const username = localStorage.getItem('zid_chat_username') || 'Viewer';
            const color = localStorage.getItem('zid_chat_color') || '#ff7a00';
            const msgId = 'user_' + Math.random().toString(36).substr(2, 9);

            // Render locally immediately for instant feedback
            appendMessage(username, text, color, false, msgId);

            const payload = {
                id: msgId,
                user: username,
                text: text,
                color: color
            };

            fetch('https://ntfy.sh/zidvaionair_chat_2026', {
                method: 'POST',
                body: JSON.stringify(payload)
            }).catch(err => {
                console.warn('Realtime chat publish failed, relying on local view:', err);
                // Trigger a simulated reply after 1.5 seconds to keep chat alive
                setTimeout(() => {
                    const replyUser = USERNAMES[Math.floor(Math.random() * USERNAMES.length)];
                    const replyMsg = "Smooth stream! Zero buffering for me.";
                    const replyColor = COLORS[Math.floor(Math.random() * COLORS.length)];
                    appendMessage(replyUser, replyMsg, replyColor, false, 'sim_reply_' + Math.random().toString(36).substr(2, 9));
                }, 1500);
            });

            chatInput.value = '';
        }

        // Setup input key listeners
        if (chatInput) {
            chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    sendMessage();
                }
            });
        }
        if (chatSendBtn) {
            chatSendBtn.addEventListener('click', sendMessage);
        }

        // Generate initial simulated items to make chat look alive
        for (let i = 0; i < 5; i++) {
            generateSimulatedMessage();
        }

        // Add a simulator check: only inject simulated comments every 18 seconds to keep chat warm
        setInterval(generateSimulatedMessage, 18000);

        // Connect to public realtime broadcast topic
        try {
            const eventSource = new EventSource('https://ntfy.sh/zidvaionair_chat_2026/sse');
            
            const handleMessageEvent = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.event === 'message' && data.message) {
                        const payload = JSON.parse(data.message);
                        if (payload.id && displayedMessageIds.has(payload.id)) {
                            return; // already displayed locally
                        }
                        if (payload.system) {
                            appendMessage(null, payload.text, null, true, payload.id || data.id);
                        } else {
                            appendMessage(payload.user, payload.text, payload.color, false, payload.id || data.id);
                        }
                    }
                } catch (e) {
                    // Fallback to text messages from external clients
                    try {
                        const data = JSON.parse(event.data);
                        if (data.event === 'message' && data.message) {
                            appendMessage('Viewer', data.message, '#ff7a00', false, data.id);
                        }
                    } catch (err) {}
                }
            };

            eventSource.onmessage = handleMessageEvent;
            eventSource.addEventListener('message', handleMessageEvent);

            eventSource.onerror = () => {
                console.warn('Realtime chat disconnected. Retrying...');
            };
        } catch (e) {
            console.error('Realtime chat connection failed:', e);
        }
    }

    initLiveChatSimulation();

    // ---------------------------------------------------------
    // 8. CLOCK HEADER INITIATION
    // ---------------------------------------------------------
    function updateClock() {
        if (clock) {
            const now = new Date();
            clock.textContent = now.toLocaleTimeString('en-US', { hour12: false });
            
            const clockTimezone = document.getElementById('clock-timezone');
            if (clockTimezone) {
                let tzString = 'UTC';
                try {
                    const parts = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' }).formatToParts(now);
                    const tzPart = parts.find(p => p.type === 'timeZoneName');
                    if (tzPart) {
                        tzString = tzPart.value;
                    }
                } catch (e) {
                    const offset = -now.getTimezoneOffset() / 60;
                    const sign = offset >= 0 ? '+' : '';
                    tzString = `GMT${sign}${offset}`;
                }
                
                const utcHour = now.getUTCHours().toString().padStart(2, '0');
                const utcMin = now.getUTCMinutes().toString().padStart(2, '0');
                const utcSec = now.getUTCSeconds().toString().padStart(2, '0');
                
                clockTimezone.textContent = `${tzString} | UTC ${utcHour}:${utcMin}:${utcSec}`;
            }
        }
    }
    updateClock();
    setInterval(updateClock, 1000);

    console.log('✅ Zid Vai On Air x WC 2026 — Active');
});
