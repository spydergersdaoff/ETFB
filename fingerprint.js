// ===== SYSTÈME DE FINGERPRINTING =====
// Génère une empreinte unique du navigateur pour empêcher les utilisations multiples

const Fingerprint = {
    // Générer une empreinte unique basée sur plusieurs caractéristiques
    generate: async function() {
        const components = [];
        
        // 1. Canvas fingerprinting
        components.push(await this.getCanvasFingerprint());
        
        // 2. WebGL fingerprinting
        components.push(await this.getWebGLFingerprint());
        
        // 3. Audio fingerprinting
        components.push(await this.getAudioFingerprint());
        
        // 4. Caractéristiques du navigateur
        components.push(this.getBrowserInfo());
        
        // 5. Résolution et caractéristiques de l'écran
        components.push(this.getScreenInfo());
        
        // 6. Timezone et langue
        components.push(this.getLocaleInfo());
        
        // 7. Plugins et fonctionnalités
        components.push(this.getPluginsInfo());
        
        // 8. Hardware info
        components.push(this.getHardwareInfo());
        
        // Combiner toutes les composantes et générer un hash
        const fingerprint = components.join('|');
        const hash = await this.hashString(fingerprint);
        
        return hash;
    },
    
    // Canvas fingerprinting
    getCanvasFingerprint: function() {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Dessiner du texte avec différentes propriétés
            const text = 'ETFB Canvas Fingerprint 🎮 123!@#';
            ctx.textBaseline = 'top';
            ctx.font = '14px "Arial"';
            ctx.textBaseline = 'alphabetic';
            ctx.fillStyle = '#f60';
            ctx.fillRect(125, 1, 62, 20);
            ctx.fillStyle = '#069';
            ctx.fillText(text, 2, 15);
            ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
            ctx.fillText(text, 4, 17);
            
            return canvas.toDataURL();
        } catch (e) {
            return 'canvas-error';
        }
    },
    
    // WebGL fingerprinting
    getWebGLFingerprint: function() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            
            if (!gl) return 'no-webgl';
            
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
            const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            
            return `${vendor}~${renderer}`;
        } catch (e) {
            return 'webgl-error';
        }
    },
    
    // Audio fingerprinting
    getAudioFingerprint: function() {
        return new Promise((resolve) => {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (!AudioContext) {
                    resolve('no-audio');
                    return;
                }
                
                const context = new AudioContext();
                const oscillator = context.createOscillator();
                const analyser = context.createAnalyser();
                const gainNode = context.createGain();
                const scriptProcessor = context.createScriptProcessor(4096, 1, 1);
                
                gainNode.gain.value = 0;
                oscillator.type = 'triangle';
                oscillator.connect(analyser);
                analyser.connect(scriptProcessor);
                scriptProcessor.connect(gainNode);
                gainNode.connect(context.destination);
                
                scriptProcessor.onaudioprocess = function(event) {
                    const output = event.outputBuffer.getChannelData(0);
                    const hash = Array.from(output.slice(0, 30))
                        .map(v => Math.abs(v))
                        .join('');
                    
                    oscillator.disconnect();
                    scriptProcessor.disconnect();
                    gainNode.disconnect();
                    context.close();
                    
                    resolve(hash.substring(0, 50));
                };
                
                oscillator.start(0);
                
                setTimeout(() => {
                    resolve('audio-timeout');
                }, 1000);
            } catch (e) {
                resolve('audio-error');
            }
        });
    },
    
    // Informations du navigateur
    getBrowserInfo: function() {
        return [
            navigator.userAgent,
            navigator.language,
            navigator.platform,
            navigator.hardwareConcurrency || 'unknown',
            navigator.deviceMemory || 'unknown',
            navigator.maxTouchPoints || 0,
            navigator.vendor,
            navigator.productSub,
            navigator.cookieEnabled
        ].join('~');
    },
    
    // Informations de l'écran
    getScreenInfo: function() {
        return [
            screen.width,
            screen.height,
            screen.availWidth,
            screen.availHeight,
            screen.colorDepth,
            screen.pixelDepth,
            window.devicePixelRatio || 1,
            window.innerWidth,
            window.innerHeight
        ].join('~');
    },
    
    // Informations de localisation
    getLocaleInfo: function() {
        return [
            new Date().getTimezoneOffset(),
            Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown',
            navigator.languages ? navigator.languages.join(',') : navigator.language
        ].join('~');
    },
    
    // Plugins et fonctionnalités
    getPluginsInfo: function() {
        const features = [
            'localStorage' in window,
            'sessionStorage' in window,
            'indexedDB' in window,
            'openDatabase' in window,
            'WebSocket' in window,
            'Worker' in window,
            'fetch' in window,
            'Promise' in window
        ].join('~');
        
        return features;
    },
    
    // Informations hardware
    getHardwareInfo: function() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        const connectionInfo = connection ? `${connection.effectiveType}~${connection.downlink}~${connection.rtt}` : 'no-connection-api';
        
        return [
            connectionInfo,
            navigator.hardwareConcurrency || 'unknown',
            navigator.deviceMemory || 'unknown'
        ].join('~');
    },
    
    // Hasher une chaîne de caractères
    hashString: async function(str) {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    },
    
    // Vérifier si l'empreinte existe déjà
    hasUsedCode: function(fingerprint) {
        const usedFingerprints = localStorage.getItem('etfb_fingerprints');
        if (!usedFingerprints) return false;
        
        const fingerprints = JSON.parse(usedFingerprints);
        return fingerprints.includes(fingerprint);
    },
    
    // Enregistrer l'empreinte
    saveFingerprint: function(fingerprint) {
        let fingerprints = [];
        const stored = localStorage.getItem('etfb_fingerprints');
        
        if (stored) {
            fingerprints = JSON.parse(stored);
        }
        
        fingerprints.push(fingerprint);
        localStorage.setItem('etfb_fingerprints', JSON.stringify(fingerprints));
        
        // Également sauvegarder dans IndexedDB comme backup
        this.saveToIndexedDB(fingerprint);
    },
    
    // Sauvegarder dans IndexedDB (backup)
    saveToIndexedDB: function(fingerprint) {
        try {
            const request = indexedDB.open('ETFB_Database', 1);
            
            request.onupgradeneeded = function(event) {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('fingerprints')) {
                    db.createObjectStore('fingerprints', { keyPath: 'id', autoIncrement: true });
                }
            };
            
            request.onsuccess = function(event) {
                const db = event.target.result;
                const transaction = db.transaction(['fingerprints'], 'readwrite');
                const store = transaction.objectStore('fingerprints');
                store.add({
                    fingerprint: fingerprint,
                    timestamp: Date.now()
                });
            };
        } catch (e) {
            console.log('IndexedDB non disponible');
        }
    },
    
    // Vérifier IndexedDB
    checkIndexedDB: function(fingerprint) {
        return new Promise((resolve) => {
            try {
                const request = indexedDB.open('ETFB_Database', 1);
                
                request.onsuccess = function(event) {
                    const db = event.target.result;
                    if (!db.objectStoreNames.contains('fingerprints')) {
                        resolve(false);
                        return;
                    }
                    
                    const transaction = db.transaction(['fingerprints'], 'readonly');
                    const store = transaction.objectStore('fingerprints');
                    const getAllRequest = store.getAll();
                    
                    getAllRequest.onsuccess = function() {
                        const results = getAllRequest.result;
                        const found = results.some(r => r.fingerprint === fingerprint);
                        resolve(found);
                    };
                    
                    getAllRequest.onerror = function() {
                        resolve(false);
                    };
                };
                
                request.onerror = function() {
                    resolve(false);
                };
            } catch (e) {
                resolve(false);
            }
        });
    }
};

// ===== SYSTÈME DE DÉTECTION D'IP (via service externe) =====
const IPDetection = {
    // Obtenir l'IP de l'utilisateur
    getIP: async function() {
        try {
            // Utiliser plusieurs services pour plus de fiabilité
            const services = [
                'https://api.ipify.org?format=json',
                'https://api.my-ip.io/ip.json',
                'https://ipapi.co/json/'
            ];
            
            for (const service of services) {
                try {
                    const response = await fetch(service);
                    const data = await response.json();
                    return data.ip || data.IP || null;
                } catch (e) {
                    continue;
                }
            }
            
            return null;
        } catch (e) {
            return null;
        }
    },
    
    // Vérifier si l'IP a déjà utilisé le code
    hasIPUsedCode: function(ip) {
        if (!ip) return false;
        
        const usedIPs = localStorage.getItem('etfb_ips');
        if (!usedIPs) return false;
        
        const ips = JSON.parse(usedIPs);
        return ips.includes(ip);
    },
    
    // Enregistrer l'IP
    saveIP: function(ip) {
        if (!ip) return;
        
        let ips = [];
        const stored = localStorage.getItem('etfb_ips');
        
        if (stored) {
            ips = JSON.parse(stored);
        }
        
        ips.push(ip);
        localStorage.setItem('etfb_ips', JSON.stringify(ips));
    }
};
