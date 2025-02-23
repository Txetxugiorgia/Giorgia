require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DEEPL_API_KEY = process.env.DEEPL_API_KEY;

// Mapeo de idiomas y banderas
const LANGUAGES = {
    "es": { target: "IT", flag: "🇮🇹" }, // Si el mensaje está en español, traduce a italiano con bandera 🇮🇹
    "it": { target: "ES", flag: "🇪🇸" }  // Si el mensaje está en italiano, traduce a español con bandera 🇪🇸
};

client.once('ready', () => {
    console.log(`✅ Bot conectado como ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return; // Ignorar mensajes de bots

    const detectedLang = await detectLanguage(message.content);
    if (!LANGUAGES[detectedLang]) return; // Solo traducimos español e italiano

    try {
        const translatedText = await translateText(message.content, LANGUAGES[detectedLang].target);
        await message.reply(`${LANGUAGES[detectedLang].flag} ${translatedText}`);
    } catch (error) {
        console.error('❌ Error traduciendo:', error);
        await message.reply('❌ Error al traducir. Inténtalo más tarde.');
    }
});

// Función para traducir texto usando DeepL
async function translateText(text, targetLang) {
    const apiUrl = DEEPL_API_KEY.startsWith("free") 
        ? "https://api-free.deepl.com/v2/translate" 
        : "https://api.deepl.com/v2/translate";

    const response = await axios.post(
        apiUrl,
        new URLSearchParams({
            auth_key: DEEPL_API_KEY,
            text,
            target_lang: targetLang
        })
    );

    return response.data.translations[0].text;
}

// Función para detectar si el mensaje está en español o italiano
async function detectLanguage(text) {
    try {
        const apiUrl = DEEPL_API_KEY.startsWith("free") 
            ? "https://api-free.deepl.com/v2/translate" 
            : "https://api.deepl.com/v2/translate";

        const response = await axios.post(
            apiUrl,
            new URLSearchParams({
                auth_key: DEEPL_API_KEY,
                text,
                target_lang: "EN" // Se traduce temporalmente a inglés para obtener el idioma detectado
            })
        );

        return response.data.translations[0].detected_source_language.toLowerCase();
    } catch (error) {
        console.error('❌ Error detectando el idioma:', error);
        return null;
    }
}

// Iniciar el bot
client.login(DISCORD_TOKEN);
