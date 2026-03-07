export interface UserProgress {
    wordId: string;
    wrongCount: number;
    skippedCount: number;
    correctStreak: number; // For backward compatibility or internal tracking
    lastAnswer: string | null;
    lastSeenAt: string | null; // ISO string
    nextReviewAt: string | null; // ISO string
    // SM-2 specific fields
    easeFactor: number;
    interval: number; // in days
    repetitions: number;
}

export interface UserStats {
    totalQuestions: number;
    correctCount: number;
    wrongCount: number;
    skippedCount: number;
    levelStats: Record<string, { correct: number; total: number; skipped: number }>;
    dailyGoal: {
        date: string; // YYYY-MM-DD
        current: number;
        target: number;
    };
    streak: {
        lastPlayedDate: string | null; // YYYY-MM-DD
        currentStreak: number;
    };
}

const PROGRESS_KEY = "ik_user_progress";
const STATS_KEY = "ik_user_stats";

// Helper for date string
const getTodayStr = () => {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
};

// Progress Kayıt Fonksiyonları
export const getProgressData = (): Record<string, UserProgress> => {
    if (typeof window === "undefined") return {};
    const data = localStorage.getItem(PROGRESS_KEY);
    return data ? JSON.parse(data) : {};
};

export const saveProgressData = (progress: Record<string, UserProgress>) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
};

/**
 * SM-2 Algorithm Calculation
 * q: Quality (0-5)
 */
const calculateSM2 = (quality: number, prevInterval: number, prevRepetitions: number, prevEaseFactor: number) => {
    let nextInterval: number;
    let nextRepetitions: number;
    let nextEaseFactor: number;

    if (quality >= 3) {
        if (prevRepetitions === 0) {
            nextInterval = 1;
        } else if (prevRepetitions === 1) {
            nextInterval = 6;
        } else {
            nextInterval = Math.round(prevInterval * prevEaseFactor);
        }
        nextRepetitions = prevRepetitions + 1;
    } else {
        nextRepetitions = 0;
        nextInterval = 1;
    }

    nextEaseFactor = prevEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (nextEaseFactor < 1.3) nextEaseFactor = 1.3;

    return {
        interval: nextInterval,
        repetitions: nextRepetitions,
        easeFactor: nextEaseFactor,
    };
};

export const saveStats = (stats: UserStats) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
};

/**
 * Merges cloud data into local storage. 
 * This is used after login to ensure local state is up to date.
 */
export const mergeCloudData = (cloudStats: UserStats | null, cloudProgress: Record<string, UserProgress> | null) => {
    if (typeof window === "undefined") return;

    if (cloudStats) {
        const localStats = getStats();
        // Simple merge: cloud takes priority for total counts if higher
        const mergedStats = {
            ...localStats,
            ...cloudStats,
            totalQuestions: Math.max(localStats.totalQuestions, cloudStats.totalQuestions),
            correctCount: Math.max(localStats.correctCount, cloudStats.correctCount),
            // Maintain local streak if it's more recent/active? 
            // For now, cloud priority is safer for multi-device.
        };
        saveStats(mergedStats);
    }

    if (cloudProgress) {
        const localProgress = getProgressData();
        const mergedProgress = { ...localProgress, ...cloudProgress };
        saveProgressData(mergedProgress);
    }
};

export const updateWordProgress = (
    wordId: string,
    isCorrect: boolean,
    userAnswer: string,
    isSkipped: boolean = false
) => {
    const data = getProgressData();
    const current = data[wordId] || {
        wordId,
        wrongCount: 0,
        skippedCount: 0,
        correctStreak: 0,
        lastAnswer: null,
        lastSeenAt: null,
        nextReviewAt: null,
        // Default SM-2 values
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
    };

    // Migration for existing data
    if (current.easeFactor === undefined) current.easeFactor = 2.5;
    if (current.interval === undefined) current.interval = 0;
    if (current.repetitions === undefined) current.repetitions = current.correctStreak || 0;

    current.lastSeenAt = new Date().toISOString();
    current.lastAnswer = userAnswer;

    let quality: number;
    if (isSkipped) {
        current.skippedCount += 1;
        quality = 0;
    } else if (isCorrect) {
        quality = 5; // Simplified: all correct answers are q=5
    } else {
        current.wrongCount += 1;
        quality = 0; // Simplified: all wrong answers are q=0
    }

    const sm2Result = calculateSM2(
        quality,
        current.interval,
        current.repetitions,
        current.easeFactor
    );

    current.interval = sm2Result.interval;
    current.repetitions = sm2Result.repetitions;
    current.easeFactor = sm2Result.easeFactor;
    current.correctStreak = current.repetitions; // Keep synced for UI if needed

    const now = new Date();
    if (quality < 3) {
        // If wrong or skipped, review very soon (10 mins)
        now.setMinutes(now.getMinutes() + 10);
    } else {
        // If correct, review after calculated interval (in days)
        now.setDate(now.getDate() + current.interval);
    }
    current.nextReviewAt = now.toISOString();

    data[wordId] = current;
    saveProgressData(data);
    return current;
};

// İstatistik Fonksiyonları
const getInitialStats = (): UserStats => ({
    totalQuestions: 0,
    correctCount: 0,
    wrongCount: 0,
    skippedCount: 0,
    levelStats: {
        A1: { correct: 0, total: 0, skipped: 0 },
        A2: { correct: 0, total: 0, skipped: 0 },
        B1: { correct: 0, total: 0, skipped: 0 },
        B2: { correct: 0, total: 0, skipped: 0 },
        C1: { correct: 0, total: 0, skipped: 0 },
        C2: { correct: 0, total: 0, skipped: 0 },
    },
    dailyGoal: {
        date: getTodayStr(),
        current: 0,
        target: 20 // Default daily target
    },
    streak: {
        lastPlayedDate: null,
        currentStreak: 0
    }
});

export const getStats = (): UserStats => {
    if (typeof window === "undefined") return getInitialStats();

    const dataStr = localStorage.getItem(STATS_KEY);
    if (!dataStr) return getInitialStats();

    const data = JSON.parse(dataStr) as UserStats;

    // Check and reset daily goal if it's a new day
    const today = getTodayStr();
    if (data.dailyGoal?.date !== today) {
        data.dailyGoal = {
            date: today,
            current: 0,
            target: data.dailyGoal?.target || 20
        };

        // Check streak
        if (data.streak?.lastPlayedDate) {
            const lastDate = new Date(data.streak.lastPlayedDate);
            const currentDate = new Date();
            // Reset to midnight for clean diff
            lastDate.setHours(0, 0, 0, 0);
            currentDate.setHours(0, 0, 0, 0);

            const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > 1) {
                // Streak broken
                data.streak.currentStreak = 0;
            }
        }

        // Save fixes back immediately
        localStorage.setItem(STATS_KEY, JSON.stringify(data));
    }

    // Provide defaults for old data
    if (!data.levelStats) data.levelStats = getInitialStats().levelStats;
    if (!data.streak) data.streak = getInitialStats().streak;
    if (data.skippedCount === undefined) data.skippedCount = 0; // Initialize if missing
    for (const level in data.levelStats) {
        if (data.levelStats.hasOwnProperty(level) && data.levelStats[level].skipped === undefined) {
            data.levelStats[level].skipped = 0; // Initialize skipped for each level
        }
    }


    return data;
};

export const updateStats = (isCorrect: boolean, level: string, isSkipped: boolean = false) => {
    const stats = getStats();
    const today = getTodayStr();

    stats.totalQuestions += 1;

    // Ensure levelStats for the current level exists and has 'skipped' property
    if (!stats.levelStats[level]) {
        stats.levelStats[level] = { correct: 0, total: 0, skipped: 0 };
    } else if (stats.levelStats[level].skipped === undefined) {
        stats.levelStats[level].skipped = 0;
    }

    if (isSkipped) {
        stats.skippedCount += 1;
        stats.levelStats[level].total += 1;
        stats.levelStats[level].skipped += 1;
    } else if (isCorrect) {
        stats.correctCount += 1;
        stats.levelStats[level].correct += 1;
        stats.levelStats[level].total += 1;
    } else { // isWrong
        stats.wrongCount += 1;
        stats.levelStats[level].total += 1;
    }

    // Update daily goal
    stats.dailyGoal.current += 1;

    // Update streak logic
    if (stats.streak.lastPlayedDate !== today) {
        // First play of the day
        stats.streak.currentStreak += 1;
        stats.streak.lastPlayedDate = today;
    }

    if (typeof window !== "undefined") {
        localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    }

    return stats; // Return updated to trigger UI events if needed
};

export const resetProgressAndStats = () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(PROGRESS_KEY);
    localStorage.removeItem(STATS_KEY);
};
