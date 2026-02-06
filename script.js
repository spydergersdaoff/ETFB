// ===== SYSTÈME DE SÉCURITÉ ANTI-DEVTOOLS =====
(function() {
    'use strict';
    
    // Protection contre l'inspection
    const antiInspect = () => {
        const threshold = 160;
        const widthThreshold = window.outerWidth - window.innerWidth > threshold;
        const heightThreshold = window.outerHeight - window.innerHeight > threshold;
        
        if (widthThreshold || heightThreshold) {
            // DevTools détectés - redirection
            window.location.href = 'about:blank';
        }
    };
    
    // Vérification continue
    setInterval(antiInspect, 500);
    
    // Désactiver le clic droit
    document.addEventListener('contextmenu', e => {
        e.preventDefault();
        return false;
    });
    
    // Désactiver TOUS les raccourcis clavier dangereux
    document.addEventListener('keydown', e => {
        // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+Shift+C, Ctrl+S
        if (e.key === 'F12' || 
            (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) ||
            (e.ctrlKey && (e.key === 'U' || e.key === 'u' || e.key === 'S' || e.key === 's'))) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    });
    
    // Bloquer Ctrl+P (impression)
    document.addEventListener('keydown', e => {
        if (e.ctrlKey && (e.key === 'p' || e.key === 'P')) {
            e.preventDefault();
            return false;
        }
    });
    
    // Détection de déboggage avancée
    let devtoolsOpen = false;
    const detectDevTools = () => {
        const element = new Image();
        Object.defineProperty(element, 'id', {
            get: function() {
                devtoolsOpen = true;
                window.location.href = 'about:blank';
            }
        });
        console.log(element);
        console.clear();
    };
    
    setInterval(detectDevTools, 1000);
    
    // Détection par taille de fenêtre
    const checkWindowSize = () => {
        if (window.outerHeight - window.innerHeight > 200 || 
            window.outerWidth - window.innerWidth > 200) {
            window.location.href = 'about:blank';
        }
    };
    
    setInterval(checkWindowSize, 500);
})();

// ===== CRYPTAGE ET SÉCURITÉ =====
const SecurityManager = {
    // Clé de cryptage (générée dynamiquement et cachée)
    key: btoa(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)),
    
    // Crypter une chaîne
    encrypt: function(text) {
        return btoa(encodeURIComponent(text).split('').map((char, i) => 
            String.fromCharCode(char.charCodeAt(0) ^ this.key.charCodeAt(i % this.key.length))
        ).join(''));
    },
    
    // Décrypter une chaîne
    decrypt: function(encoded) {
        try {
            return decodeURIComponent(atob(encoded).split('').map((char, i) =>
                String.fromCharCode(char.charCodeAt(0) ^ this.key.charCodeAt(i % this.key.length))
            ).join(''));
        } catch {
            return null;
        }
    },
    
    // Hasher pour comparaison sécurisée
    hash: function(text) {
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            const char = text.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }
};

// ===== GESTIONNAIRE DE DONNÉES =====
const DataManager = {
    storageKey: btoa('etfb_secure_data_v3_final'), // Nouvelle version
    
    // Récupérer les données
    getData: function() {
        try {
            const encrypted = localStorage.getItem(this.storageKey);
            if (!encrypted) return this.getDefaultData();
            
            const decrypted = SecurityManager.decrypt(encrypted);
            return decrypted ? JSON.parse(decrypted) : this.getDefaultData();
        } catch {
            return this.getDefaultData();
        }
    },
    
    // Sauvegarder les données
    saveData: function(data) {
        try {
            const json = JSON.stringify(data);
            const encrypted = SecurityManager.encrypt(json);
            localStorage.setItem(this.storageKey, encrypted);
            return true;
        } catch {
            return false;
        }
    },
    
    // Données par défaut
    getDefaultData: function() {
        // Code admin hashé: Fabien62820sa
        const adminHash = SecurityManager.hash('Fabien62820sa');
        return {
            adminPass: adminHash,
            secretCode: 'TESTE',
            maxUses: 2,
            webhookUrl: 'https://discord.com/api/webhooks/1469188220951597079/GeP2aaoeOvMkXZgtLeV5RhDQpbc2MjnhsKUMeJUJeSibJVUGyLo8pVT7VFwi43l-oIKf',
            stats: {
                totalRedeems: 0,
                redeemedUsers: []
            }
        };
    },
    
    // Initialiser
    init: function() {
        if (!localStorage.getItem(this.storageKey)) {
            this.saveData(this.getDefaultData());
        }
    }
};

// ===== INTERFACE PRINCIPALE =====
const App = {
    elements: {},
    
    init: function() {
        // Initialiser le stockage
        DataManager.init();
        
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
        
        // Easter egg pour accès admin (triple-clic sur le logo)
        let logoClicks = 0;
        let clickTimer = null;
        document.querySelector('.logo').addEventListener('click', () => {
            logoClicks++;
            
            if (clickTimer) clearTimeout(clickTimer);
            
            if (logoClicks === 3) {
                logoClicks = 0;
                AdminPanel.show();
            }
            
            clickTimer = setTimeout(() => {
                logoClicks = 0;
            }, 1000);
        });
    },
    
    handleRedeem: function() {
        const code = this.elements.codeInput.value.trim();
        const username = this.elements.usernameInput.value.trim();
        
        // Validation
        if (!code) {
            this.showMessage('Veuillez entrer un code', 'error');
            return;
        }
        
        if (!username) {
            this.showMessage('Veuillez entrer votre nom d\'utilisateur Roblox', 'error');
            return;
        }
        
        // Vérifier le code (insensible à la casse)
        const data = DataManager.getData();
        
        if (code.toUpperCase() !== data.secretCode.toUpperCase()) {
            this.showMessage('Code invalide', 'error');
            return;
        }
        
        // Vérifier si l'utilisateur a déjà utilisé le code
        if (data.stats.redeemedUsers.includes(username.toLowerCase())) {
            this.showMessage('Vous avez déjà utilisé ce code !', 'error');
            return;
        }
        
        // Vérifier la limite d'utilisations
        if (data.stats.totalRedeems >= data.maxUses) {
            this.showMessage('Toutes les places ont été prises !', 'error');
            return;
        }
        
        // Code valide !
        data.stats.totalRedeems++;
        data.stats.redeemedUsers.push(username.toLowerCase());
        DataManager.saveData(data);
        
        // Calculer les places restantes
        const remainingPlaces = data.maxUses - data.stats.totalRedeems;
        
        // Envoyer au webhook Discord si configuré
        if (data.webhookUrl) {
            this.sendDiscordWebhook(username, data.secretCode, remainingPlaces);
        }
        
        // Afficher le modal de succès
        this.showSuccessModal();
        
        // Réinitialiser les champs
        this.elements.codeInput.value = '';
        this.elements.usernameInput.value = '';
    },
    
    sendDiscordWebhook: async function(username, code, remainingPlaces) {
        const data = DataManager.getData();
        
        let description;
        if (remainingPlaces === 0) {
            description = `Felicitation ${username} tu a optenue le brainrot de la vidéo d'aujourd'hui il à plus de place le mots étais ${code}`;
        } else {
            description = `Felicitation ${username} tu a optenue le brainrot de la vidéo d'aujourd'hui il reste encore ${remainingPlaces} place allez vite regardée la nouvelle vidéo`;
        }
        
        const embed = {
            embeds: [{
                description: description,
                color: 0x7c3aed,
                timestamp: new Date().toISOString()
            }]
        };
        
        try {
            await fetch(data.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(embed)
            });
        } catch (error) {
            console.error('Erreur webhook:', error);
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
const AdminPanel = {
    elements: {},
    isAuthenticated: false,
    
    init: function() {
        this.elements = {
            panel: document.getElementById('adminPanel'),
            auth: document.getElementById('adminAuth'),
            content: document.getElementById('adminContent'),
            passwordInput: document.getElementById('adminPassword'),
            loginBtn: document.getElementById('adminLoginBtn'),
            newCodeInput: document.getElementById('newSecretCode'),
            updateCodeBtn: document.getElementById('updateCodeBtn'),
            maxUses: document.getElementById('maxUses'),
            updateLimitBtn: document.getElementById('updateLimitBtn'),
            webhookUrl: document.getElementById('webhookUrl'),
            updateWebhookBtn: document.getElementById('updateWebhookBtn'),
            currentCode: document.getElementById('currentCode'),
            totalRedeems: document.getElementById('totalRedeems'),
            remainingUses: document.getElementById('remainingUses'),
            resetStatsBtn: document.getElementById('resetStatsBtn'),
            clearAllBtn: document.getElementById('clearAllBtn'),
            logoutBtn: document.getElementById('adminLogoutBtn')
        };
        
        // Événements
        this.elements.loginBtn.addEventListener('click', () => this.handleLogin());
        this.elements.updateCodeBtn.addEventListener('click', () => this.updateCode());
        this.elements.updateLimitBtn.addEventListener('click', () => this.updateLimit());
        this.elements.updateWebhookBtn.addEventListener('click', () => this.updateWebhook());
        this.elements.resetStatsBtn.addEventListener('click', () => this.resetStats());
        this.elements.clearAllBtn.addEventListener('click', () => this.clearAll());
        this.elements.logoutBtn.addEventListener('click', () => this.logout());
        
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
        this.isAuthenticated = false;
        this.elements.auth.style.display = 'block';
        this.elements.content.style.display = 'none';
        this.elements.passwordInput.value = '';
    },
    
    handleLogin: function() {
        const password = this.elements.passwordInput.value.trim();
        const data = DataManager.getData();
        
        // Vérifier le mot de passe (comparaison de hash)
        if (SecurityManager.hash(password) === data.adminPass) {
            this.isAuthenticated = true;
            this.elements.auth.style.display = 'none';
            this.elements.content.style.display = 'block';
            this.loadAdminData();
        } else {
            alert('Mot de passe incorrect !');
            this.elements.passwordInput.value = '';
        }
    },
    
    loadAdminData: function() {
        const data = DataManager.getData();
        this.elements.currentCode.textContent = data.secretCode;
        this.elements.totalRedeems.textContent = data.stats.totalRedeems;
        this.elements.maxUses.value = data.maxUses;
        this.elements.webhookUrl.value = data.webhookUrl || '';
        
        const remaining = data.maxUses - data.stats.totalRedeems;
        this.elements.remainingUses.textContent = remaining;
    },
    
    updateLimit: function() {
        const newLimit = parseInt(this.elements.maxUses.value);
        
        if (!newLimit || newLimit < 1) {
            alert('Veuillez entrer un nombre valide (minimum 1)');
            return;
        }
        
        const data = DataManager.getData();
        data.maxUses = newLimit;
        
        if (DataManager.saveData(data)) {
            alert('Limite mise à jour avec succès !');
            this.loadAdminData();
        } else {
            alert('Erreur lors de la mise à jour');
        }
    },
    
    updateWebhook: function() {
        const newWebhook = this.elements.webhookUrl.value.trim();
        
        if (newWebhook && !newWebhook.includes('discord.com/api/webhooks/')) {
            alert('URL de webhook Discord invalide !');
            return;
        }
        
        const data = DataManager.getData();
        data.webhookUrl = newWebhook;
        
        if (DataManager.saveData(data)) {
            alert('Webhook mis à jour avec succès !');
            this.loadAdminData();
        } else {
            alert('Erreur lors de la mise à jour');
        }
    },
    
    resetStats: function() {
        if (!confirm('Voulez-vous vraiment réinitialiser les statistiques ? Cette action est irréversible.')) {
            return;
        }
        
        const data = DataManager.getData();
        data.stats.totalRedeems = 0;
        data.stats.redeemedUsers = [];
        
        if (DataManager.saveData(data)) {
            alert('Statistiques réinitialisées !');
            this.loadAdminData();
        } else {
            alert('Erreur lors de la réinitialisation');
        }
    },
    
    clearAll: function() {
        if (!confirm('⚠️ ATTENTION ! Cela va réinitialiser TOUT : code secret, webhook, statistiques. Continuer ?')) {
            return;
        }
        
        // Supprimer complètement les données
        localStorage.removeItem(DataManager.storageKey);
        
        // Réinitialiser avec les valeurs par défaut
        DataManager.init();
        
        alert('Toutes les données ont été réinitialisées !');
        this.loadAdminData();
    },
    
    updateCode: function() {
        const newCode = this.elements.newCodeInput.value.trim();
        
        if (!newCode) {
            alert('Veuillez entrer un nouveau code');
            return;
        }
        
        const data = DataManager.getData();
        data.secretCode = newCode.toUpperCase(); // Sauvegarder en majuscules
        
        if (DataManager.saveData(data)) {
            alert('Code mis à jour avec succès !');
            this.elements.newCodeInput.value = '';
            this.loadAdminData();
        } else {
            alert('Erreur lors de la mise à jour');
        }
    },
    
    logout: function() {
        this.hide();
    }
};

// ===== INITIALISATION =====
document.addEventListener('DOMContentLoaded', () => {
    App.init();
    
    // Fermer le modal de succès au clic
    document.getElementById('successModal').addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('show');
        }
    });
});

// ===== PROTECTIONS SUPPLÉMENTAIRES =====

// Effacer la console régulièrement
setInterval(() => {
    console.clear();
}, 2000);

// Empêcher la copie
document.addEventListener('copy', e => {
    e.preventDefault();
    return false;
});

// Empêcher le couper
document.addEventListener('cut', e => {
    e.preventDefault();
    return false;
});

// Protection contre le drag & drop
document.addEventListener('dragstart', e => {
    e.preventDefault();
    return false;
});

// Empêcher la sélection de texte sur les éléments sensibles
document.addEventListener('selectstart', e => {
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        return false;
    }
});

// Bloquer l'ouverture de nouvelles fenêtres suspectes
window.addEventListener('beforeunload', function(e) {
    // Nettoyer si tentative de fermeture
    console.clear();
});

// Messages de warning dans la console
const warningStyle = 'color: red; font-size: 50px; font-weight: bold; text-shadow: 2px 2px 4px black;';
const textStyle = 'color: white; font-size: 18px; font-weight: bold;';

console.log('%c⛔ STOP !', warningStyle);
console.log('%cCeci est une fonction du navigateur destinée aux développeurs.', textStyle);
console.log('%cSi quelqu\'un vous a dit de copier-coller quelque chose ici, c\'est une ARNAQUE.', textStyle);
console.log('%cNe collez RIEN ici. Vous pourriez perdre l\'accès à votre compte.', textStyle);

// Protection contre l'enregistrement de la page
if (window.stop) {
    window.addEventListener('beforeprint', (e) => {
        e.preventDefault();
        alert('L\'impression est désactivée pour des raisons de sécurité.');
        return false;
    });
}
