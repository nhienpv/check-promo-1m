// Configuration file - Load from Netlify Environment Variables
let CONFIG = {
    BEARER_TOKEN: '',
    TG_BOT_TOKEN: '',
    TG_CHAT_ID: '',
    AUTO_LOAD_TOKEN: true,
    SHOW_TOKEN_WARNING: true
};

// Load config from Netlify API
async function loadConfig() {
    try {
        const response = await fetch('/api/config');
        if (response.ok) {
            const serverConfig = await response.json();
            CONFIG = { ...CONFIG, ...serverConfig };
            console.log('✅ Config loaded from Netlify environment variables');
        } else {
            console.warn('⚠️ Failed to load config from server, using defaults');
        }
    } catch (error) {
        console.warn('⚠️ Config API not available, using defaults:', error);
    }
}

// Auto-load config when page loads
if (typeof window !== 'undefined') {
    loadConfig();
}

// Export config
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
