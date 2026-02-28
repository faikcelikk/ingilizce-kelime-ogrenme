export type VoiceAccent = "en-US" | "en-GB" | "en-AU";
export type SpeechRate = "slow" | "normal" | "fast";

export interface PlayAudioOptions {
    accent?: VoiceAccent;
    rate?: SpeechRate;
}

const RATE_MAP: Record<SpeechRate, number> = {
    slow: 0.55,
    normal: 0.9,
    fast: 1.25,
};

/**
 * Returns all available voices for a given language prefix (e.g. "en")
 */
export const getAvailableAccents = (): VoiceAccent[] => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return ["en-US"];

    const voices = window.speechSynthesis.getVoices();
    const accents: VoiceAccent[] = ["en-US", "en-GB", "en-AU"];
    return accents.filter(accent =>
        voices.some(v => v.lang === accent || v.lang.startsWith(accent.split("-")[0]))
    );
};

/**
 * Picks the best available voice for a given accent, preferring Google/enhanced voices
 */
const pickVoice = (voices: SpeechSynthesisVoice[], accent: VoiceAccent): SpeechSynthesisVoice | null => {
    // 1. Exact match + Google
    const googleExact = voices.find(v => v.lang === accent && v.name.toLowerCase().includes("google"));
    if (googleExact) return googleExact;

    // 2. Exact lang match
    const exact = voices.find(v => v.lang === accent);
    if (exact) return exact;

    // 3. Language prefix match (e.g. en-US → en)
    const prefix = accent.split("-")[0];
    const prefixMatch = voices.find(v => v.lang.startsWith(prefix));
    if (prefixMatch) return prefixMatch;

    return null;
};

export const playAudio = (text: string, options: PlayAudioOptions = {}) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        console.warn("Speech Synthesis API is not supported in this browser.");
        return;
    }

    const { accent = "en-US", rate = "normal" } = options;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = accent;
    utterance.rate = RATE_MAP[rate];
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const voice = pickVoice(voices, accent);
    if (voice) utterance.voice = voice;

    window.speechSynthesis.speak(utterance);
};

// Trigger voice loading on startup (Chrome loads voices async)
if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
    };
}
