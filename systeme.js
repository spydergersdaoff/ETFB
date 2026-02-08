// ===== SYSTÈME DE VALIDATION =====

const System = {
    // Valider un code avec détection avancée
    validateCode: async function(code, username) {
        const config = CONFIG.get();
        
        // Vérifier le code (insensible à la casse)
        if (code.toUpperCase() !== config.SECRET_CODE.toUpperCase()) {
            return {
                success: false,
                message: 'Code invalide'
            };
        }
        
        // Vérifier si l'utilisateur a déjà utilisé le code (par pseudo)
        if (Stats.hasUserRedeemed(username)) {
            return {
                success: false,
                message: 'Ce pseudo Roblox a déjà utilisé le code !'
            };
        }
        
        // Générer l'empreinte digitale du navigateur
        const fingerprint = await Fingerprint.generate();
        console.log('🔍 Empreinte générée:', fingerprint.substring(0, 16) + '...');
        
        // Vérifier l'empreinte dans localStorage
        if (Fingerprint.hasUsedCode(fingerprint)) {
            return {
                success: false,
                message: 'Ce navigateur a déjà utilisé le code ! 🚫'
            };
        }
        
        // Vérifier l'empreinte dans IndexedDB (backup)
        const foundInDB = await Fingerprint.checkIndexedDB(fingerprint);
        if (foundInDB) {
            return {
                success: false,
                message: 'Ce navigateur a déjà utilisé le code ! 🚫'
            };
        }
        
        // Obtenir et vérifier l'IP
        const userIP = await IPDetection.getIP();
        if (userIP) {
            console.log('🌐 IP détectée:', userIP);
            if (IPDetection.hasIPUsedCode(userIP)) {
                return {
                    success: false,
                    message: 'Cette connexion a déjà utilisé le code ! 🚫'
                };
            }
        }
        
        // Vérifier la limite d'utilisations
        if (Stats.getStats().totalRedeems >= config.MAX_USES) {
            return {
                success: false,
                message: 'Toutes les places ont été prises !'
            };
        }
        
        // Code valide ! Enregistrer toutes les données
        Stats.addUser(username);
        Fingerprint.saveFingerprint(fingerprint);
        if (userIP) {
            IPDetection.saveIP(userIP);
        }
        
        // Calculer les places restantes
        const remainingPlaces = Stats.getRemainingUses();
        
        // Envoyer au webhook Discord
        if (config.WEBHOOK_URL) {
            this.sendWebhook(username, config.SECRET_CODE, remainingPlaces);
        }
        
        console.log('✅ Code validé avec succès pour:', username);
        
        return {
            success: true,
            message: 'Code validé avec succès !',
            remainingPlaces: remainingPlaces
        };
    },
    
    // Envoyer un message au webhook Discord
    sendWebhook: async function(username, code, remainingPlaces) {
        const config = CONFIG.get();
        let description;
        
        if (remainingPlaces === 0) {
            description = `Felicitation ${username} tu a optenue le brainrot de la vidéo d'aujourd'hui il à plus de place le mots étais ${code}`;
        } else {
            description = `Felicitation ${username} tu a optenue le brainrot de la vidéo d'aujourd'hui il reste encore ${remainingPlaces} place allez vite regardée la nouvelle vidéo`;
        }
        
        const payload = {
            embeds: [{
                description: description,
                color: 8134893, // Couleur violette (0x7c3aed)
                timestamp: new Date().toISOString()
            }]
        };
        
        try {
            await fetch(config.WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });
            console.log('✅ Webhook envoyé avec succès !');
        } catch (error) {
            console.error('❌ Erreur webhook:', error);
        }
    }
};

// ===== INTERFACE UTILISATEUR =====

const UI = {
    elements: {},
    
    init: function() {
        // Récupérer les éléments
        this.elements = {
            codeInput: document.getElementById('codeInput'),
            usernameInput: document.getElementById('usernameInput'),
            redeemBtn: document.getElementById('redeemBtn'),
            message: document.getElementById('message'),
            successModal: document.getElementById('successModal')
        };
        
        // Événements
        this.elements.redeemBtn.addEventListener('click', () => this.handleRedeem());
        
        // Permettre Enter pour soumettre
        [this.elements.codeInput, this.elements.usernameInput].forEach(input => {
            input.addEventListener('keypress', e => {
                if (e.key === 'Enter') this.handleRedeem();
            });
        });
        
        // Triple-clic sur le logo pour le panel admin
        let logoClicks = 0;
        let clickTimer = null;
        document.querySelector('.logo').addEventListener('click', () => {
            logoClicks++;
            
            if (clickTimer) clearTimeout(clickTimer);
            
            if (logoClicks === 3) {
                logoClicks = 0;
                AdminUI.show();
            }
            
            clickTimer = setTimeout(() => {
                logoClicks = 0;
            }, 1000);
        });
        
        // Fermer les modals au clic
        this.elements.successModal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('show');
            }
        });
    },
    
    handleRedeem: async function() {
        const code = this.elements.codeInput.value.trim();
        const username = this.elements.usernameInput.value.trim();
        
        // Validation
        if (!code) {
            this.showMessage('Veuillez entrer un code', 'error');
            return;
        }
        
        if (!username) {
            this.showMessage('Veuillez entrer votre @ Roblox', 'error');
            return;
        }
        
        // Désactiver le bouton pendant la validation
        this.elements.redeemBtn.disabled = true;
        this.showMessage('Vérification en cours...', 'info');
        
        // Valider le code (async maintenant)
        const result = await System.validateCode(code, username);
        
        // Réactiver le bouton
        this.elements.redeemBtn.disabled = false;
        
        if (result.success) {
            // Afficher le modal de succès
            this.showSuccessModal();
            
            // Réinitialiser les champs
            this.elements.codeInput.value = '';
            this.elements.usernameInput.value = '';
        } else {
            this.showMessage(result.message, 'error');
        }
    },
    
    showMessage: function(text, type) {
        this.elements.message.textContent = text;
        this.elements.message.className = `message ${type} show`;
        
        setTimeout(() => {
            this.elements.message.classList.remove('show');
        }, 3000);
    },
    
    showSuccessModal: function() {
        this.elements.successModal.classList.add('show');
    }
};

// ===== PANEL ADMIN =====

const AdminUI = {
    elements: {},
    
    init: function() {
        this.elements = {
            panel: document.getElementById('adminPanel'),
            auth: document.getElementById('adminAuth'),
            content: document.getElementById('adminContent'),
            passwordInput: document.getElementById('adminPassword'),
            loginBtn: document.getElementById('adminLoginBtn'),
            
            // Champs de modification
            newCodeInput: document.getElementById('newCodeInput'),
            updateCodeBtn: document.getElementById('updateCodeBtn'),
            newLimitInput: document.getElementById('newLimitInput'),
            updateLimitBtn: document.getElementById('updateLimitBtn'),
            newWebhookInput: document.getElementById('newWebhookInput'),
            updateWebhookBtn: document.getElementById('updateWebhookBtn'),
            
            // Affichage des infos
            currentCode: document.getElementById('currentCode'),
            currentLimit: document.getElementById('currentLimit'),
            currentWebhook: document.getElementById('currentWebhook'),
            totalRedeems: document.getElementById('totalRedeems'),
            remainingUses: document.getElementById('remainingUses'),
            
            // Boutons
            resetStatsBtn: document.getElementById('resetStatsBtn'),
            logoutBtn: document.getElementById('adminLogoutBtn')
        };
        
        // Événements
        this.elements.loginBtn.addEventListener('click', () => this.handleLogin());
        this.elements.updateCodeBtn.addEventListener('click', () => this.updateCode());
        this.elements.updateLimitBtn.addEventListener('click', () => this.updateLimit());
        this.elements.updateWebhookBtn.addEventListener('click', () => this.updateWebhook());
        this.elements.resetStatsBtn.addEventListener('click', () => this.resetStats());
        this.elements.logoutBtn.addEventListener('click', () => this.hide());
        
        this.elements.passwordInput.addEventListener('keypress', e => {
            if (e.key === 'Enter') this.handleLogin();
        });
    },
    
    show: function() {
        this.init();
        this.elements.panel.classList.add('show');
    },
    
    hide: function() {
        this.elements.panel.classList.remove('show');
        this.elements.auth.style.display = 'block';
        this.elements.content.style.display = 'none';
        this.elements.passwordInput.value = '';
    },
    
    handleLogin: function() {
        const password = this.elements.passwordInput.value.trim();
        const config = CONFIG.get();
        
        if (password === config.ADMIN_PASSWORD) {
            this.elements.auth.style.display = 'none';
            this.elements.content.style.display = 'block';
            this.loadData();
        } else {
            alert('Mot de passe incorrect !');
            this.elements.passwordInput.value = '';
        }
    },
    
    loadData: function() {
        const config = CONFIG.get();
        const stats = Stats.getStats();
        
        // Afficher les infos actuelles
        this.elements.currentCode.textContent = config.SECRET_CODE;
        this.elements.currentLimit.textContent = config.MAX_USES;
        this.elements.currentWebhook.textContent = config.WEBHOOK_URL ? '✅ Configuré' : '❌ Non configuré';
        
        // Afficher les stats
        this.elements.totalRedeems.textContent = stats.totalRedeems;
        this.elements.remainingUses.textContent = config.MAX_USES - stats.totalRedeems;
    },
    
    updateCode: function() {
        const newCode = this.elements.newCodeInput.value.trim();
        
        if (!newCode) {
            alert('Veuillez entrer un nouveau code !');
            return;
        }
        
        CONFIG.update('SECRET_CODE', newCode.toUpperCase());
        alert('✅ Code mis à jour avec succès !');
        this.elements.newCodeInput.value = '';
        this.loadData();
    },
    
    updateLimit: function() {
        const newLimit = parseInt(this.elements.newLimitInput.value);
        
        if (!newLimit || newLimit < 1) {
            alert('Veuillez entrer un nombre valide (minimum 1) !');
            return;
        }
        
        CONFIG.update('MAX_USES', newLimit);
        alert('✅ Limite mise à jour avec succès !');
        this.elements.newLimitInput.value = '';
        this.loadData();
    },
    
    updateWebhook: function() {
        const newWebhook = this.elements.newWebhookInput.value.trim();
        
        if (newWebhook && !newWebhook.includes('discord.com/api/webhooks/')) {
            alert('⚠️ URL de webhook Discord invalide !');
            return;
        }
        
        CONFIG.update('WEBHOOK_URL', newWebhook);
        alert('✅ Webhook mis à jour avec succès !');
        this.elements.newWebhookInput.value = '';
        this.loadData();
    },
    
    resetStats: function() {
        if (!confirm('⚠️ Voulez-vous vraiment réinitialiser les statistiques ? Les utilisateurs pourront à nouveau utiliser le code.')) {
            return;
        }
        
        Stats.resetStats();
        alert('✅ Statistiques réinitialisées avec succès !');
        this.loadData();
    }
};

// ===== INITIALISATION =====
document.addEventListener('DOMContentLoaded', () => {
    UI.init();
    const config = CONFIG.get();
    console.log('✅ Système initialisé !');
    console.log('📊 Code actuel:', config.SECRET_CODE);
    console.log('👥 Limite:', config.MAX_USES, 'utilisateurs');
    console.log('🔔 Webhook:', config.WEBHOOK_URL ? 'Configuré' : 'Non configuré');
});
