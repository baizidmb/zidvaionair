/* =========================================================
   COPASTREAM 2026 - MAIN BROADCAST SCRIPT (REBUILT)
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

    // 1. Live Server Categories Configuration
    const SERVER_CATEGORIES = [
        {
            category: 'Toffee Live CDN (Bangladesh Feeds)',
            servers: [
                {
                    name: 'Toffee FIFA 1',
                    url: 'https://prod-cdn01-live.toffeelive.com/live/FIFA-2026-1/0/master_2000.m3u8?hdntl=Expires=1782422686~_GO=Generated~URLPrefix=aHR0cHM6Ly9wcm9kLWNkbjAxLWxpdmUudG9mZmVlbGl2ZS5jb20~Signature=AVXEwvdw_EW5yg24646Tzt0JTgHcKGu1d-bn9GbywpEI3FBOVE8cEtb0uSgOCgprrb7FYTph1R5J3AWwM5aCDED4FRAH',
                    detail: 'Toffee FIFA Live Channel 1 (HD)',
                    badge: 'hd'
                },
                {
                    name: 'Toffee FIFA 2',
                    url: 'https://prod-cdn01-live.toffeelive.com/live/FIFA-2026-2/0/master_2000.m3u8?hdntl=Expires=1782422686~_GO=Generated~URLPrefix=aHR0cHM6Ly9wcm9kLWNkbjAxLWxpdmUudG9mZmVlbGl2ZS5jb20~Signature=AVXEwvdw_EW5yg24646Tzt0JTgHcKGu1d-bn9GbywpEI3FBOVE8cEtb0uSgOCgprrb7FYTph1R5J3AWwM5aCDED4FRAH',
                    detail: 'Toffee FIFA Live Channel 2 (HD)',
                    badge: 'hd'
                },
                {
                    name: 'Toffee FIFA 3 (Active)',
                    url: 'https://prod-cdn01-live.toffeelive.com/live/FIFA-2026-3/0/master_2000.m3u8?hdntl=Expires=1782422686~_GO=Generated~URLPrefix=aHR0cHM6Ly9wcm9kLWNkbjAxLWxpdmUudG9mZmVlbGl2ZS5jb20~Signature=AVXEwvdw_EW5yg24646Tzt0JTgHcKGu1d-bn9GbywpEI3FBOVE8cEtb0uSgOCgprrb7FYTph1R5J3AWwM5aCDED4FRAH',
                    detail: 'Toffee FIFA Live Channel 3 (HD)',
                    badge: 'hd'
                },
                {
                    name: 'Toffee FIFA 4',
                    url: 'https://prod-cdn01-live.toffeelive.com/live/FIFA-2026-4/0/master_2000.m3u8?hdntl=Expires=1782422686~_GO=Generated~URLPrefix=aHR0cHM6Ly9wcm9kLWNkbjAxLWxpdmUudG9mZmVlbGl2ZS5jb20~Signature=AVXEwvdw_EW5yg24646Tzt0JTgHcKGu1d-bn9GbywpEI3FBOVE8cEtb0uSgOCgprrb7FYTph1R5J3AWwM5aCDED4FRAH',
                    detail: 'Toffee FIFA Live Channel 4 (HD)',
                    badge: 'hd'
                }
            ]
        },
        {
            category: 'Server Group A (HundredMiles CDN)',
            servers: [
                {
                    name: 'FOX Sports US',
                    url: 'https://hundredmilesperhour.uk/fox-usa.m3u8?md5=dbcbe5ba2cda0235516f4e513fdb99a3&exp=1782352666',
                    detail: 'FOX US Broadcast Stream (HD)',
                    badge: 'hd'
                },
                {
                    name: 'FOX Sports 1 (FS1)',
                    url: 'https://hundredmilesperhour.uk/fox-sports-1.m3u8?md5=dbcbe5ba2cda0235516f4e513fdb99a3&exp=1782352666',
                    detail: 'Direct FS1 Feed (HD)',
                    badge: 'hd'
                },
                {
                    name: 'FOX Sports 4K',
                    url: 'https://hundredmilesperhour.uk/fox4k-usa.m3u8?md5=dbcbe5ba2cda0235516f4e513fdb99a3&exp=1782352666',
                    detail: 'Ultra HD 4K FOX Broadcast Feed',
                    badge: 'fhd'
                },
                {
                    name: 'ESPN USA',
                    url: 'https://hundredmilesperhour.uk/espn-usa.m3u8?md5=dbcbe5ba2cda0235516f4e513fdb99a3&exp=1782352666',
                    detail: 'ESPN US Sports Coverage (HD)',
                    badge: 'hd'
                },
                {
                    name: 'Telemundo USA',
                    url: 'https://hundredmilesperhour.uk/telemundo-usa.m3u8?md5=dbcbe5ba2cda0235516f4e513fdb99a3&exp=1782352666',
                    detail: 'Telemundo Spanish Feed (HD)',
                    badge: 'hd'
                }
            ]
        },
        {
            category: 'Server Group B (Inproviszon CDN)',
            servers: [
                {
                    name: 'FOX Sports US (Alt)',
                    url: 'https://inproviszon.st/fox-usa.m3u8?md5=dbcbe5ba2cda0235516f4e513fdb99a3&exp=1782336816',
                    detail: 'Alternative FOX US Feed (HD)',
                    badge: 'hd'
                },
                {
                    name: 'FOX Sports 1 (Alt)',
                    url: 'https://inproviszon.st/fox-sports-1.m3u8?md5=dbcbe5ba2cda0235516f4e513fdb99a3&exp=1782336816',
                    detail: 'Alternative FS1 Feed (HD)',
                    badge: 'hd'
                },
                {
                    name: 'Peacock 1 Live',
                    url: 'https://inproviszon.st/peacock-1.m3u8?md5=dbcbe5ba2cda0235516f4e513fdb99a3&exp=1782336816',
                    detail: 'Peacock Live Spanish Broadcast (4K)',
                    badge: 'fhd'
                },
                {
                    name: 'ESPN USA (Alt)',
                    url: 'https://inproviszon.st/espn-usa.m3u8?md5=dbcbe5ba2cda0235516f4e513fdb99a3&exp=1782336816',
                    detail: 'Alternative ESPN US Feed (HD)',
                    badge: 'hd'
                },
                {
                    name: 'Telemundo USA (Alt)',
                    url: 'https://inproviszon.st/telemundo-usa.m3u8?md5=dbcbe5ba2cda0235516f4e513fdb99a3&exp=1782336816',
                    detail: 'Alternative Telemundo Spanish (HD)',
                    badge: 'hd'
                }
            ]
        },
        {
            category: 'Worker Proxy Feeds',
            servers: [
                {
                    name: 'Proxy Server',
                    url: 'https://tahmidx.shusanta-project.workers.dev/',
                    detail: 'Cloudflare Worker proxy feed',
                    badge: 'hd'
                }
            ]
        }
    ];

    // Flatten server categories into a unified indexing list for the player
    const SERVERS = [];
    SERVER_CATEGORIES.forEach(cat => {
        cat.servers.forEach(srv => {
            SERVERS.push({
                name: srv.name,
                url: srv.url,
                detail: srv.detail,
                category: cat.category
            });
        });
    });

    // Player State
    let hls = null;
    let currentServerIndex = null;

    // DOM Elements
    const video = document.getElementById('video-player');
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
    const unmuteOverlay = document.getElementById('player-unmute-overlay');
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

    // Failover & Auto-switching State
    let failoverCount = 0;

    // ---------------------------------------------------------
    // 2. STREAM PLAYER FUNCTION
    // ---------------------------------------------------------
    function playStream(url, name, description) {
        // Show loading spinner, hide placeholder and errors
        playerLoader.classList.remove('hidden');
        playerError.classList.add('hidden');
        playerPlaceholder.classList.add('hidden');

        // Update titles and info
        currentServerTitle.textContent = name;
        currentServerDesc.textContent = description || 'Live Stream';
        playerSourceUrl.textContent = url;

        // Clean up previous HLS instance
        if (hls) {
            hls.destroy();
            hls = null;
        }

        // Stop any playing video
        video.src = '';

        let networkRetryCount = 0;
        const maxNetworkRetries = 3;

        // Initialize HLS.js
        if (Hls.isSupported() && url.includes('.m3u8')) {
            hls = new Hls({
                maxMaxBufferLength: 10,
                enableWorker: true,
                lowLatencyMode: true
            });
            hls.loadSource(url);
            hls.attachMedia(video);
            
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                playerLoader.classList.add('hidden');
                customControls.classList.remove('hidden');
                unmuteOverlay.classList.add('hidden');
                
                video.play().catch(e => {
                    console.log('Autoplay blocked. Starting muted.');
                    video.muted = true;
                    ctrlMute.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
                    ctrlVolume.value = 0;
                    unmuteOverlay.classList.remove('hidden');
                    video.play();
                });
            });

            hls.on(Hls.Events.ERROR, (event, data) => {
                console.error('HLS error:', data);
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            if (networkRetryCount < maxNetworkRetries) {
                                networkRetryCount++;
                                console.log(`Fatal network error, retrying (${networkRetryCount}/${maxNetworkRetries})...`);
                                hls.startLoad();
                            } else {
                                handleStreamError('HLS Network Error.');
                            }
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            console.log('Fatal media error, trying to recover...');
                            hls.recoverMediaError();
                            break;
                        default:
                            handleStreamError('HLS Fatal Error.');
                            break;
                    }
                }
            });
        } 
        // Native HLS Fallback (e.g. Safari on Mac/iOS, or standard MP4 streams)
        else if (video.canPlayType('application/vnd.apple.mpegurl') || !url.includes('.m3u8')) {
            video.src = url;
            video.addEventListener('loadedmetadata', () => {
                playerLoader.classList.add('hidden');
                customControls.classList.remove('hidden');
                unmuteOverlay.classList.add('hidden');
                
                video.play().catch(e => {
                    console.log('Autoplay blocked. Starting muted.');
                    video.muted = true;
                    ctrlMute.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
                    ctrlVolume.value = 0;
                    unmuteOverlay.classList.remove('hidden');
                    video.play();
                });
            });
            video.addEventListener('error', (e) => {
                console.error('HTML5 video error:', e);
                handleStreamError('Native Video Playback Error.');
            });
        } else {
            handlePlayerError('Your browser does not support HLS streaming natively or via Hls.js.');
        }
    }

    function handlePlayerError(msg) {
        playerLoader.classList.add('hidden');
        playerError.classList.remove('hidden');
        errorMessage.textContent = msg;
        video.src = '';
    }

    // ---------------------------------------------------------
    // 3. SERVER SELECTION INTERFACE & DYNAMIC RENDER
    // ---------------------------------------------------------
    function renderServers() {
        if (!serversContainer) return;
        serversContainer.innerHTML = '';
        
        let globalIndex = 0;
        SERVER_CATEGORIES.forEach(cat => {
            // Category Wrapper
            const catDiv = document.createElement('div');
            catDiv.className = 'server-category';

            // Category Title
            const catTitle = document.createElement('h3');
            catTitle.className = 'server-category-title';
            catTitle.innerHTML = `<i class="fa-solid fa-layer-group text-accent"></i> ${cat.category}`;
            catDiv.appendChild(catTitle);

            // Category Grid
            const catGrid = document.createElement('div');
            catGrid.className = 'servers-grid';

            cat.servers.forEach(srv => {
                const btn = document.createElement('button');
                btn.className = `server-btn ${srv.badge}`;
                btn.dataset.index = globalIndex;
                btn.innerHTML = `
                    <i class="fa-solid fa-play"></i>
                    <div class="server-btn-info">
                        <span class="server-btn-name">${srv.name}</span>
                        <span class="server-btn-detail">${srv.detail}</span>
                    </div>
                `;

                // Capture index in a local scope
                const currentIndex = globalIndex;
                btn.addEventListener('click', () => {
                    window.changeServer(srv.url, currentIndex);
                });

                catGrid.appendChild(btn);
                globalIndex++;
            });

            catDiv.appendChild(catGrid);
            serversContainer.appendChild(catDiv);
        });
    }

    window.changeServer = function(url, index, isAutoSwitch = false) {
        currentServerIndex = index;

        // Reset failover counter on manual selection
        if (!isAutoSwitch) {
            failoverCount = 0;
        }

        // Toggle active states on all dynamically created buttons
        const allButtons = document.querySelectorAll('.server-btn');
        allButtons.forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.querySelector(`.server-btn[data-index="${index}"]`);
        if (activeBtn) activeBtn.classList.add('active');

        // Play the stream
        const server = SERVERS[index];
        playStream(url, server.name, server.detail);
    };

    // Initialize the servers list in the DOM
    renderServers();

    // ---------------------------------------------------------
    // 4. CUSTOM ACCESSIBLE PLAYER CONTROLLER LOGIC
    // ---------------------------------------------------------
    function togglePlay() {
        if (video.paused) {
            video.play();
            ctrlPlayPause.innerHTML = '<i class="fa-solid fa-pause"></i>';
        } else {
            video.pause();
            ctrlPlayPause.innerHTML = '<i class="fa-solid fa-play"></i>';
        }
    }

    ctrlPlayPause.addEventListener('click', togglePlay);

    // Click on video playing area toggles play/pause
    video.addEventListener('click', () => {
        if (unmuteOverlay.classList.contains('hidden')) {
            togglePlay();
        } else {
            // Trigger unmute overlay click
            unmuteOverlay.click();
        }
    });

    // Synced Video Playback state events
    video.addEventListener('play', () => {
        ctrlPlayPause.innerHTML = '<i class="fa-solid fa-pause"></i>';
        customControls.classList.remove('hidden');
        showControlsTemporarily();
    });

    video.addEventListener('pause', () => {
        ctrlPlayPause.innerHTML = '<i class="fa-solid fa-play"></i>';
        clearTimeout(controlsTimeout);
        customControls.classList.remove('hide-controls');
        videoWrapper.classList.remove('hide-cursor');
    });

    // Volume & Mute logic
    function toggleMute() {
        video.muted = !video.muted;
        if (video.muted) {
            ctrlMute.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
            ctrlVolume.value = 0;
        } else {
            ctrlMute.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
            ctrlVolume.value = video.volume;
        }
    }

    ctrlMute.addEventListener('click', toggleMute);

    ctrlVolume.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        video.volume = val;
        video.muted = (val === 0);
        if (video.muted) {
            ctrlMute.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
        } else if (val < 0.5) {
            ctrlMute.innerHTML = '<i class="fa-solid fa-volume-low"></i>';
        } else {
            ctrlMute.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
        }
    });

    // Format time display
    function formatTime(time) {
        if (isNaN(time) || time === Infinity) return '00:00';
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // Progress updates & timeline buffering
    video.addEventListener('timeupdate', () => {
        if (video.duration && video.duration !== Infinity) {
            const percent = (video.currentTime / video.duration) * 100;
            timelineProgress.style.width = `${percent}%`;
            timeElapsed.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
        } else {
            timelineProgress.style.width = '0%';
            timeElapsed.textContent = formatTime(video.currentTime);
        }

        // Buffer bar calculations
        if (video.buffered.length > 0 && video.duration) {
            const bufferedEnd = video.buffered.end(video.buffered.length - 1);
            const percent = (bufferedEnd / video.duration) * 100;
            timelineBuffer.style.width = `${percent}%`;
        } else {
            timelineBuffer.style.width = '0%';
        }
    });

    // Seek track clicks
    timelineContainer.addEventListener('click', (e) => {
        if (video.duration && video.duration !== Infinity) {
            const rect = timelineContainer.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const width = rect.width;
            const newTime = (clickX / width) * video.duration;
            video.currentTime = newTime;
        }
    });

    // Picture in Picture
    if (!document.pictureInPictureEnabled) {
        ctrlPip.style.display = 'none';
    }
    ctrlPip.addEventListener('click', async () => {
        try {
            if (video !== document.pictureInPictureElement) {
                await video.requestPictureInPicture();
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

    // Unmute overlay click handler
    unmuteOverlay.addEventListener('click', () => {
        video.muted = false;
        video.volume = 1;
        ctrlVolume.value = 1;
        ctrlMute.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
        unmuteOverlay.classList.add('hidden');
    });

    // Auto-hide Control Bar logic
    let controlsTimeout = null;
    function showControlsTemporarily() {
        customControls.classList.remove('hide-controls');
        videoWrapper.classList.remove('hide-cursor');
        
        clearTimeout(controlsTimeout);
        
        if (!video.paused) {
            controlsTimeout = setTimeout(() => {
                customControls.classList.add('hide-controls');
                videoWrapper.classList.add('hide-cursor');
            }, 2500);
        }
    }

    videoWrapper.addEventListener('mousemove', showControlsTemporarily);
    videoWrapper.addEventListener('mouseleave', () => {
        if (!video.paused) {
            customControls.classList.add('hide-controls');
            videoWrapper.classList.add('hide-cursor');
        }
    });

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
                if (video.duration && video.duration !== Infinity) {
                    video.currentTime = Math.max(0, video.currentTime - 5);
                    showControlsTemporarily();
                }
                break;
            case 'arrowright':
                e.preventDefault();
                if (video.duration && video.duration !== Infinity) {
                    video.currentTime = Math.min(video.duration, video.currentTime + 5);
                    showControlsTemporarily();
                }
                break;
            case 'arrowup':
                e.preventDefault();
                video.volume = Math.min(1, video.volume + 0.05);
                ctrlVolume.value = video.volume;
                video.muted = false;
                showControlsTemporarily();
                break;
            case 'arrowdown':
                e.preventDefault();
                video.volume = Math.max(0, video.volume - 0.05);
                ctrlVolume.value = video.volume;
                video.muted = (video.volume === 0);
                showControlsTemporarily();
                break;
        }
    });

    // Retry button on error overlay
    btnRetry.addEventListener('click', () => {
        if (currentServerIndex !== null) {
            const server = SERVERS[currentServerIndex];
            window.changeServer(server.url, currentServerIndex);
        }
    });

    // Copy stream link button
    btnCopyUrl.addEventListener('click', () => {
        const url = playerSourceUrl.textContent;
        if (url && url !== 'None Loaded') {
            navigator.clipboard.writeText(url).then(() => {
                const icon = btnCopyUrl.querySelector('i');
                icon.className = 'fa-solid fa-check text-accent';
                setTimeout(() => {
                    icon.className = 'fa-regular fa-copy';
                }, 2000);
            }).catch(err => {
                alert('Failed to copy: ' + err);
            });
        }
    });

    // Placeholder click triggers Server 1 (index 0)
    playerPlaceholder.addEventListener('click', () => {
        if (SERVERS.length > 0) {
            window.changeServer(SERVERS[0].url, 0);
        }
    });

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
        
        if (failoverCount < SERVERS.length) {
            const nextIndex = (currentServerIndex + 1) % SERVERS.length;
            const nextServer = SERVERS[nextIndex];
            
            console.log(`[Failover] Server index ${currentServerIndex} failed. Swapping to next server ${nextIndex} (${nextServer.name})...`);
            showToast(`Connection failed. Auto-switching to ${nextServer.name}...`);
            
            setTimeout(() => {
                window.changeServer(nextServer.url, nextIndex, true);
            }, 1200);
        } else {
            handlePlayerError('All available streaming servers are currently offline or blocked by CORS policies. Please consult CORS tips or use fallback search links below.');
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
        
        const scoreHtml = score !== null ? `<span class="team-score">${score}</span>` : '';
        
        return `
            <div class="team-row">
                ${logoHtml}
                <span class="team-name-text" title="${teamName}">${teamName}</span>
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
        
        const todayStr = getLocalDateString(now);
        const dateBadge = document.getElementById('schedule-date-badge');
        const dateLabel = document.getElementById('sched-current-date-label');
        
        if (selectedDateStr === todayStr) {
            if (dateBadge) dateBadge.textContent = 'TODAY';
            if (dateLabel) dateLabel.textContent = `Today (${formattedDate.split(',')[0]} ${formattedDate.split(',')[1]})`;
        } else {
            if (dateBadge) dateBadge.textContent = parts[1] + '/' + parts[2];
            if (dateLabel) dateLabel.textContent = formattedDate;
        }
        
        const selectedMatches = allMatches.filter(m => m.localDate === selectedDateStr);
        let renderedHtml = '';
        
        selectedMatches.forEach((match) => {
            const kickoff = new Date(match.kickoffUtc);
            const matchDurationMs = 2 * 60 * 60 * 1000;
            const matchEnd = new Date(kickoff.getTime() + matchDurationMs);
            
            let status = 'upcoming';
            let badgeClass = 'upcoming';
            let statusText = 'Upcoming';
            let timeLabel = kickoff.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            
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
            
            const activeClass = status === 'live' ? 'active-live' : '';
            
            renderedHtml += `
                <div class="schedule-item ${activeClass}">
                    <div class="match-teams">
                        ${renderTeamRow(match.homeTeam, score1)}
                        ${renderTeamRow(match.awayTeam, score2)}
                    </div>
                    <div class="match-time-info">
                        <span class="match-hour">${timeLabel}</span>
                        <span class="match-status-badge ${badgeClass}">${statusText}</span>
                    </div>
                </div>
            `;
        });
        
        if (scheduleContainer) {
            scheduleContainer.innerHTML = renderedHtml || '<p style="text-align:center;color:var(--text-muted);padding:10px;">No matches scheduled</p>';
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
            
            if (now >= kickoff && now < matchEnd) {
                liveMatch = match;
            } else if (now < kickoff) {
                if (!nextUpcoming || kickoff < new Date(nextUpcoming.kickoffUtc)) {
                    nextUpcoming = match;
                }
            }
        });
        
        if (liveMatch) {
            const kickoff = new Date(liveMatch.kickoffUtc);
            const elapsedMin = Math.floor((now - kickoff) / 60000);
            const liveScore = getLiveScore(liveMatch.matchNumber, elapsedMin);
            
            headerMatchText.innerHTML = `<span class="live-pulse-dot"></span> <strong>LIVE:</strong> ${liveMatch.homeTeam} ${liveScore.score1} - ${liveScore.score2} ${liveMatch.awayTeam}`;
            headerMatchDot.style.display = 'inline-block';
        } else if (nextUpcoming) {
            const kickoff = new Date(nextUpcoming.kickoffUtc);
            const formattedTime = kickoff.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
            headerMatchText.textContent = `NEXT: ${nextUpcoming.homeTeam} vs. ${nextUpcoming.awayTeam} (${formattedTime})`;
            headerMatchDot.style.display = 'none';
        } else {
            headerMatchText.textContent = "All matches completed for today";
            headerMatchDot.style.display = 'none';
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

    async function fetchMatches() {
        try {
            const response = await fetch('https://www.thestatsapi.com/world-cup/data/fixtures.json');
            if (!response.ok) throw new Error('Network error');
            const data = await response.json();
            allMatches = data.fixtures || [];
        } catch (e) {
            console.warn('API error, loading fallback fixtures:', e);
            allMatches = getLocalFallbackMatches();
        }
        
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
        setInterval(updateScheduleUI, 15000);
    }

    // Set placeholder description dynamically
    const placeholderDesc = playerPlaceholder.querySelector('p');
    if (placeholderDesc) {
        placeholderDesc.textContent = "Select one of the 15 live servers below to start streaming matches instantly.";
    }

    // Start fetching match fixtures
    fetchMatches();

    // ---------------------------------------------------------
    // 7. DEFAULT BROADCAST LOADING
    // ---------------------------------------------------------
    const defaultIndex = SERVERS.findIndex(srv => srv.name === 'FOX Sports US');
    const startIdx = defaultIndex !== -1 ? defaultIndex : 0;
    
    console.log(`🚀 Defaulting to ${SERVERS[startIdx].name} (Index ${startIdx})`);
    window.changeServer(SERVERS[startIdx].url, startIdx);

    // ---------------------------------------------------------
    // 8. CLOCK HEADER INITIATION
    // ---------------------------------------------------------
    function updateClock() {
        clock.textContent = new Date().toLocaleTimeString('en-US', { hour12: false });
    }
    setInterval(updateClock, 1000);
    updateClock();

    console.log('✅ Zid Vai On Air x WC 2026 — Active');
});
