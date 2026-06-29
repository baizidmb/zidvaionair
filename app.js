/* =========================================================
   COPASTREAM 2026 - MAIN BROADCAST SCRIPT (REBUILT)
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

    // 1. Live Feed Stream URL Configuration
    let CHANNELS = [
        { name: "SP - SD", url: "https://rglzdwqlaqpzfoofnohk.supabase.co/functions/v1/go?url=Q09k4OukERocFRoTLpNhopWhojWRopWkQVbmFk6nI0zf&headers=3OvT47zfFAzydly_zKugdly_FOKXdly_HG_hI0oSrVwhv1P0dly_dVwhvGgTIGSh4KHmHRdJERI_4UgRHGHJIRIRFhNcE0zKLpycyCv_EU1Uq1yjin", detail: "Sportzfy SD Clean Feed", badge: "sd" },
        { name: "SP - HD", url: "https://rglzdwqlaqpzfoofnohk.supabase.co/functions/v1/go?url=Q09k4OuzERokijak4MYmoV9JdsHJokrJdkABFhNcE0zKLw&headers=3OvT47zfFAzydly_zKugdly_FOKXdly_HG_hI0oSrVwhv1P0dly_dVwhvGgTIGSh4KHmHRdJERI_4UgRHGHJIRIRFhNcE0zKLpycyCv_EU1Uq1yjin", detail: "Sportzfy HD Clean Feed", badge: "fhd" },
        { name: "FAST 1", url: "https://pullsgp.yyzb456.top/live/stream-698168_lhd.m3u8", detail: "High Speed Routing 1", badge: "hd" },
        { name: "FAST 2", url: "https://pul-tenm.nbs3g.com/live/hd-en-1-4459717.m3u8?txSecret=cb546b67173ce18b5d6e9c15e9ec6b4b&txTime=6A42BDE0", detail: "High Speed Routing 2", badge: "hd" },
        { name: "Arabic", url: "https://em.golatooa.site/Canads1.m3u8", detail: "Arabic Broadcast Feed", badge: "sd" },
        { name: "CCTV 5", url: "https://live.666666.zip/cctv/5.m3u8", detail: "CCTV Sports Broadcast", badge: "hd" },
        { name: "SP - 2", url: "https://live.666666.zip/migu/1.m3u8", detail: "Migu Live Broadcast", badge: "hd" },
        { name: "SP - 3", url: "https://hqlive.yarncdn.live/live/hqtv_blv_phanma/playlist.m3u8", detail: "HQTV Live Feed", badge: "hd" },
        { name: "FUSSBALL (Germany VPN)", url: "https://svc45.main.sl.t-online.de/bpk-tv/KID01037_FUSSBALLTV1_hd/DASH/index.mpd", detail: "Fussball TV HD (DASH/DRM)", badge: "fhd" },
        { name: "FUSSBALL 4K (Germany VPN)", url: "https://svc45.main.sl.t-online.de/bpk-tv/KID01037_FUSSBALLTV1_uhd/DASH/index.mpd", detail: "Fussball TV 4K (DASH/DRM)", badge: "4k" }
    ];

    let currentChannelIndex = 1; // Play SP - HD by default
    let searchQuery = '';
    let hls = null;

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
        if (index !== undefined) {
            currentChannelIndex = index;
        }
        const channel = CHANNELS[currentChannelIndex];
        if (!channel) return;

        const url = channel.url;

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
        if (currentServerTitle) currentServerTitle.textContent = channel.name;
        if (currentServerDesc) currentServerDesc.textContent = channel.detail || 'Live Stream Feed';
        playerSourceUrl.textContent = url;

        // Clean up any stale load on the active player
        cleanupPlayer(activePlayer);

        if (url.includes('.mpd')) {
            handlePlayerError('DASH / Widevine DRM channels require a Germany VPN and specialized player components. Please select an HLS stream.');
            return;
        }

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

    function renderChannelsGrid() {
        if (!serversContainer) return;
        serversContainer.innerHTML = '';

        const query = searchQuery.trim().toLowerCase();

        CHANNELS.forEach((channel, index) => {
            if (query && !channel.name.toLowerCase().includes(query) && !(channel.detail || '').toLowerCase().includes(query)) {
                return;
            }

            const card = document.createElement('div');
            const isActive = currentChannelIndex === index;
            card.className = `server-card ${isActive ? 'active' : ''} glossy-shine`;
            card.dataset.index = index;

            const qualityBadge = channel.badge ? channel.badge.toUpperCase() : 'HD';
            const thumbContent = (channel.logo && channel.logo.startsWith('http'))
                ? `<img src="${channel.logo}" class="w-full h-full object-contain rounded-md" onerror="this.outerHTML='<span class=\\'text-[9px] font-bold\\'>${qualityBadge}</span>'">`
                : `<span class="text-[9px] font-bold">${qualityBadge}</span>`;

            card.innerHTML = `
                <div class="server-thumb flex items-center justify-center">${thumbContent}</div>
                <div class="flex-grow flex flex-col overflow-hidden text-left">
                    <span class="server-card-name font-bold text-xs truncate text-white" title="${channel.name}">[${index + 1}] ${channel.name}</span>
                    <span class="text-[10px] text-white/40 truncate">${channel.detail || 'Live Broadcast Feed'}</span>
                </div>
                <div class="flex items-center gap-1.5 text-[10px] font-mono text-white/50">
                    <span>online</span>
                    <span class="status-dot status-green"></span>
                </div>
            `;

            card.addEventListener('click', () => {
                playStream(index);
                renderChannelsGrid();
            });

            serversContainer.appendChild(card);
        });
    }

    function parseM3u(text) {
        const lines = text.split(/\r?\n/);
        const parsed = [];
        let currentChannel = null;

        for (let line of lines) {
            line = line.trim();
            if (!line) continue;

            if (line.startsWith('#EXTINF:')) {
                let logo = '';
                if (line.includes('tvg-logo="')) {
                    logo = line.split('tvg-logo="')[1].split('"')[0];
                }

                const nameParts = line.split(',');
                let name = nameParts[nameParts.length - 1].trim();

                currentChannel = {
                    name: name,
                    logo: logo,
                    badge: 'IPTV',
                    detail: 'IPTV Sports Channel'
                };
            } else if (line.startsWith('http') && currentChannel) {
                currentChannel.url = line;
                parsed.push(currentChannel);
                currentChannel = null;
            }
        }
        return parsed;
    }

    async function loadM3uChannels() {
        try {
            const res = await fetch('https://iptv-org.github.io/iptv/categories/sports.m3u');
            if (!res.ok) throw new Error('Failed to load M3U file');
            const text = await res.text();
            const parsed = parseM3u(text);
            CHANNELS = [...CHANNELS, ...parsed];
            renderChannelsGrid();
        } catch (e) {
            console.error('Error fetching M3U channels:', e);
        }
    }

    window.playStream = playStream;
    window.renderChannelsGrid = renderChannelsGrid;

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
        if (telemetryLatency) {
            telemetryLatency.textContent = `PRIMARY LATENCY: 5ms / STABLE`;
        }

        const telemetryPreloaded = document.getElementById('telemetry-preloaded');
        const backupEngineStatus = document.getElementById('backup-engine-status');
        if (telemetryPreloaded && backupEngineStatus) {
            telemetryPreloaded.textContent = 'PRELOAD QUEUE: EMPTY';
            backupEngineStatus.textContent = 'UNAVAILABLE';
            backupEngineStatus.className = 'text-[#ff2d55] font-bold';
        }
    }

    function handlePlayerError(msg) {
        playerLoader.classList.add('hidden');
        playerError.classList.remove('hidden');
        errorMessage.textContent = msg;
        cleanupPlayer(activePlayer);
        cleanupPlayer(idlePlayer);
    }




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
            playStream();
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

    // Placeholder click triggers playback
    if (playerPlaceholder) {
        playerPlaceholder.addEventListener('click', () => {
            playStream();
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
        handlePlayerError('ALL INCOMING BROADCAST FEEDS DISRUPTED. PLEASE MONITOR CONSOLE FOR REBOOT CORRECTION.');
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
                <button class="bg-[#ff7a00] hover:bg-[#ff7a00]/90 text-white font-bold px-3 py-1 rounded-lg text-[10px] cursor-pointer" onclick="window.playStream(1)">
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
        placeholderDesc.textContent = "Tuning in to the live broadcast matches. Please wait.";
    }

    // Start fetching match fixtures
    fetchMatches();

    // ---------------------------------------------------------
    // 7. DEFAULT BROADCAST LOADING & SIDEBAR INTERACTION
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
            
            const chatContainer = document.getElementById('chat-messages-container');
            if (chatContainer) {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
        });
    }

    const channelSearchInput = document.getElementById('channel-search');
    if (channelSearchInput) {
        channelSearchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderChannelsGrid();
        });
    }

    renderChannelsGrid();
    playStream(1);
    loadM3uChannels();



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



    // Messi Memes Interactive Segmented Slider
    const messiBtn0 = document.getElementById('messi-btn-0');
    const messiBtn1 = document.getElementById('messi-btn-1');
    const messiBtn2 = document.getElementById('messi-btn-2');
    const messiTabIndicator = document.getElementById('messi-tab-indicator');
    const messiMemeImg = document.getElementById('messi-meme-img');
    const messiSliderLabel = document.getElementById('messi-slider-label');

    if (messiMemeImg && messiSliderLabel && messiTabIndicator) {
        const MESSI_MEMES = [
            {
                url: 'https://api.memegen.link/images/custom/WHEN_YOU_SWAP_SERVERS/AND_IT_TAKES_0.01_SECONDS.png?background=https://www.pngmart.com/files/22/Lionel-Messi-PNG-Isolated-HD-Transparent.png',
                label: 'Reaction #1: Fast Server Swapping'
            },
            {
                url: 'https://api.memegen.link/images/custom/CLOCK_FREEZES_AT_00~00/ANTIGRAVITY_FIXES_IT_INSTANTLY.png?background=https://www.pngmart.com/files/22/Lionel-Messi-PNG-Isolated-HD-Transparent.png',
                label: 'Reaction #2: Freeze-Proof Clock'
            },
            {
                url: 'https://api.memegen.link/images/custom/CHAT_SIMULATION_ACTIVE/24K_BOTS_TALKING_TO_THEMSELVES.png?background=https://www.pngmart.com/files/22/Lionel-Messi-PNG-Isolated-HD-Transparent.png',
                label: 'Reaction #3: Simulating 24K Viewer Bots'
            }
        ];

        const setMemeIndex = (idx) => {
            const meme = MESSI_MEMES[idx];
            
            // Slide indicator
            messiTabIndicator.style.transform = `translateX(${idx * 100}%)`;
            
            // Adjust buttons opacity/classes
            const buttons = [messiBtn0, messiBtn1, messiBtn2];
            buttons.forEach((btn, i) => {
                if (btn) {
                    if (i === idx) {
                        btn.style.color = 'rgba(255,255,255,0.95)';
                    } else {
                        btn.style.color = 'rgba(255,255,255,0.4)';
                    }
                }
            });

            // Fade transition
            messiMemeImg.style.opacity = '0';
            messiMemeImg.style.transform = 'scale(0.95)';
            setTimeout(() => {
                messiMemeImg.src = meme.url;
                messiSliderLabel.textContent = meme.label;
                messiMemeImg.style.opacity = '1';
                messiMemeImg.style.transform = 'scale(1)';
            }, 150);
        };

        if (messiBtn0) messiBtn0.addEventListener('click', () => setMemeIndex(0));
        if (messiBtn1) messiBtn1.addEventListener('click', () => setMemeIndex(1));
        if (messiBtn2) messiBtn2.addEventListener('click', () => setMemeIndex(2));
    }

    console.log('✅ Zid Vai On Air x WC 2026 — Active');
});
