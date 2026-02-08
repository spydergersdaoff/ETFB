// ===== CONFIGURATION DU SYSTÈME =====
// Cette configuration peut être modifiée via le panel admin

const CONFIG = {
    // Obtenir la configuration actuelle (depuis localStorage ou valeurs par défaut)
    get: function() {
        const saved = localStorage.getItem('etfb_config');
        if (saved) {
            return JSON.parse(saved);
        }
        // Valeurs par défaut
        return {
            SECRET_CODE: 'TESTE',
            MAX_USES: 2,
            WEBHOOK_URL: 'https://discord.com/api/webhooks/1469188220951597079/GeP2aaoeOvMkXZgtLeV5RhDQpbc2MjnhsKUMeJUJeSibJVUGyLo8pVT7VFwi43l-oIKf',
            ADMIN_PASSWORD: 'Fabien62820sa'
        };
    },
    
    // Sauvegarder la configuration
    save: function(config) {
        localStorage.setItem('etfb_config', JSON.stringify(config));
    },
    
    // Mettre à jour une valeur spécifique
    update: function(key, value) {
        const config = this.get();
        config[key] = value;
        this.save(config);
    }
};

// ===== STOCKAGE DES STATISTIQUES =====
const Stats = {
    getStats: function() {
        const stats = localStorage.getItem('etfb_stats');
        if (!stats) {
            return {
                totalRedeems: 0,
                redeemedUsers: []
            };
        }
        return JSON.parse(stats);
    },
    
    saveStats: function(stats) {
        localStorage.setItem('etfb_stats', JSON.stringify(stats));
    },
    
    resetStats: function() {
        // Réinitialiser les stats
        localStorage.removeItem('etfb_stats');
        
        // Réinitialiser les empreintes
        localStorage.removeItem('etfb_fingerprints');
        
        // Réinitialiser les IPs
        localStorage.removeItem('etfb_ips');
        
        // Nettoyer IndexedDB
        try {
            const request = indexedDB.deleteDatabase('ETFB_Database');
            request.onsuccess = function() {
                console.log('✅ IndexedDB nettoyée');
            };
        } catch (e) {
            console.log('⚠️ Erreur lors du nettoyage IndexedDB');
        }
    },
    
    addUser: function(username) {
        const stats = this.getStats();
        stats.totalRedeems++;
        stats.redeemedUsers.push(username.toLowerCase());
        this.saveStats(stats);
    },
    
    hasUserRedeemed: function(username) {
        const stats = this.getStats();
        return stats.redeemedUsers.includes(username.toLowerCase());
    },
    
    getRemainingUses: function() {
        const config = CONFIG.get();
        const stats = this.getStats();
        return config.MAX_USES - stats.totalRedeems;
    }
};
