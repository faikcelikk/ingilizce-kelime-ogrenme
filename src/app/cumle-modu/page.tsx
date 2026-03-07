"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, RotateCw, CheckCircle2, XCircle, Lightbulb, Volume2, Brain, Zap, Target, ChevronRight, Info } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { playAudio, VoiceAccent, SpeechRate } from "@/utils/speech";

type Level = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
type Feedback = "idle" | "correct" | "wrong";

interface SentenceExercise {
    sentence: string;   // "She went to the ___ to buy food."
    answer: string;     // "market"
    turkish: string;    // "pazar yeri"
    hint: string;       // "a place where you buy things"
    difficulty: string;
}

const LEVEL_META: Record<Level, { color: string; darkColor: string; label: string; emoji: string; desc: string }> = {
    A1: { color: "bg-emerald-100 text-emerald-700 border-emerald-200", darkColor: "dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30", label: "A1 — Başlangıç", emoji: "🌱", desc: "Günlük temel kelimeler" },
    A2: { color: "bg-teal-100 text-teal-700 border-teal-200", darkColor: "dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/30", label: "A2 — Temel", emoji: "🌿", desc: "Sık kullanılan ifadeler" },
    B1: { color: "bg-blue-100 text-blue-700 border-blue-200", darkColor: "dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30", label: "B1 — Orta", emoji: "📘", desc: "Günlük konular ve fikirler" },
    B2: { color: "bg-indigo-100 text-indigo-700 border-indigo-200", darkColor: "dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/30", label: "B2 — Üst Orta", emoji: "🎯", desc: "Karmaşık konular" },
    C1: { color: "bg-violet-100 text-violet-700 border-violet-200", darkColor: "dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/30", label: "C1 — İleri", emoji: "🔮", desc: "Akademik ve profesyonel" },
    C2: { color: "bg-rose-100 text-rose-700 border-rose-200", darkColor: "dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30", label: "C2 — Ustalık", emoji: "👑", desc: "Ana dil yakını" },
};

export default function CumleModu() {
    const [selectedLevel, setSelectedLevel] = useState<Level>("B1");
    const [exercise, setExercise] = useState<SentenceExercise | null>(null);
    const [userAnswer, setUserAnswer] = useState("");
    const [feedback, setFeedback] = useState<Feedback>("idle");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showHint, setShowHint] = useState(false);
    const [sessionCorrect, setSessionCorrect] = useState(0);
    const [sessionWrong, setSessionWrong] = useState(0);
    const [streak, setStreak] = useState(0);
    // useRef: her zaman güncel değeri tutar, closure sorunu olmaz
    const usedWordsRef = useRef<string[]>([]);
    const [voiceAccent] = useState<VoiceAccent>(() =>
        (localStorage.getItem("ik_voice_accent") as VoiceAccent) || "en-US"
    );
    const [speechRate] = useState<SpeechRate>(() =>
        (localStorage.getItem("ik_speech_rate") as SpeechRate) || "normal"
    );
    const inputRef = useRef<HTMLInputElement>(null);
    const levels: Level[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

    const fetchExercise = useCallback(async () => {
        setLoading(true);
        setError(null);
        setExercise(null);
        setFeedback("idle");
        setUserAnswer("");
        setShowHint(false);

        // Ref her zaman güncel listeyi gösterir — son 20 kelime yeterli
        const wordsToExclude = usedWordsRef.current.slice(-20);

        try {
            const res = await fetch("/api/ai/sentence", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ level: selectedLevel, usedWords: wordsToExclude }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Cümle oluşturulamadı");
            setExercise(data);

            // Kullanılan kelimeyi ref'e anında ekle (state güncellenmesini beklemeye gerek yok)
            if (data.answer) {
                usedWordsRef.current = [...usedWordsRef.current, data.answer.toLowerCase()];
            }

            // Otomatik cümle seslendir
            setTimeout(() => {
                const readableSentence = data.sentence.replace("___", "blank");
                playAudio(readableSentence, { accent: voiceAccent, rate: speechRate });
            }, 400);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Bir hata oluştu");
        } finally {
            setLoading(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedLevel, voiceAccent, speechRate]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!exercise || !userAnswer.trim() || feedback !== "idle") return;

        const clean = (s: string) => s.trim().toLocaleLowerCase("tr-TR").replace(/\s+/g, "");
        const userClean = clean(userAnswer);
        const answerClean = clean(exercise.answer);

        // Tam eşleşme veya kısmi (8+ harf için %65 prefix)
        let isCorrect = userClean === answerClean;
        if (!isCorrect && answerClean.length >= 8 && userClean.length >= Math.ceil(answerClean.length * 0.65)) {
            isCorrect = answerClean.startsWith(userClean);
        }
        // 1 typo toleransı (7+ harf)
        if (!isCorrect && answerClean.length >= 7) {
            const dist = levenshtein(userClean, answerClean);
            if (dist <= (answerClean.length >= 10 ? 2 : 1)) isCorrect = true;
        }

        if (isCorrect) {
            setFeedback("correct");
            setSessionCorrect(p => p + 1);
            setStreak(p => p + 1);
            // Tam cümleyi seslendir
            const fullSentence = exercise.sentence.replace("___", exercise.answer);
            setTimeout(() => playAudio(fullSentence, { accent: voiceAccent, rate: speechRate }), 300);
            // Ref zaten güncel, direkt fetchExercise çağır
            setTimeout(() => fetchExercise(), 2200);
        } else {
            setFeedback("wrong");
            setSessionWrong(p => p + 1);
            setStreak(0);
        }
    };

    const levenshtein = (a: string, b: string): number => {
        const m = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(0));
        for (let i = 0; i <= a.length; i++) m[0][i] = i;
        for (let j = 0; j <= b.length; j++) m[j][0] = j;
        for (let j = 1; j <= b.length; j++) {
            for (let i = 1; i <= a.length; i++) {
                m[j][i] = Math.min(m[j][i - 1] + 1, m[j - 1][i] + 1, m[j - 1][i - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
            }
        }
        return m[b.length][a.length];
    };

    // Cümleyi parçalara böl: boşluk öncesi, boşluk, boşluk sonrası
    const renderSentence = (sentence: string, answer?: string) => {
        const parts = sentence.split("___");
        if (parts.length !== 2) return <span>{sentence}</span>;

        return (
            <>
                {parts[0]}
                {feedback === "correct" || feedback === "wrong" ? (
                    <span className={`inline-block px-3 py-0.5 rounded-lg font-black mx-1 ${feedback === "correct"
                        ? "bg-emerald-200 dark:bg-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                        : "bg-red-200 dark:bg-red-500/30 text-red-800 dark:text-red-300"
                        }`}>
                        {answer || "___"}
                    </span>
                ) : (
                    <span className="inline-block border-b-4 border-indigo-400 dark:border-indigo-500 min-w-[80px] mx-1 font-black text-indigo-400 dark:text-indigo-500 tracking-widest">
                        ___
                    </span>
                )}
                {parts[1]}
            </>
        );
    };

    return (
        <div className="flex min-h-screen flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-50 via-white to-zinc-50 dark:from-violet-950/20 dark:via-zinc-950 dark:to-zinc-950 p-6 font-sans text-zinc-900 dark:text-zinc-100">
            <div className="w-full max-w-2xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <button className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:scale-105 active:scale-95 transition shadow-sm">
                                <ArrowLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                            </button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                                <Sparkles className="w-6 h-6 text-violet-500" />
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400">
                                    AI Cümle Modu
                                </span>
                            </h1>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Yapay zeka destekli boşluk doldurma alıştırmaları</p>
                        </div>
                    </div>
                    <ThemeToggle />
                </div>

                {/* Skor Çubuğu */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="flex-1 flex items-center justify-center gap-6 bg-white/70 dark:bg-zinc-900/70 backdrop-blur border border-white/50 dark:border-zinc-800/50 rounded-2xl px-6 py-3 shadow-sm">
                        <div className="flex flex-col items-center">
                            <span className="text-2xl font-black text-emerald-500">{sessionCorrect}</span>
                            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Doğru</span>
                        </div>
                        <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-700" />
                        <div className="flex flex-col items-center">
                            <span className="text-2xl font-black text-rose-500">{sessionWrong}</span>
                            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Yanlış</span>
                        </div>
                        <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-700" />
                        <div className="flex flex-col items-center">
                            <div className="flex items-center gap-1">
                                <Zap className={`w-4 h-4 ${streak > 0 ? "text-amber-500 fill-amber-500" : "text-zinc-400"}`} />
                                <span className={`text-2xl font-black ${streak > 0 ? "text-amber-500" : "text-zinc-400"}`}>{streak}</span>
                            </div>
                            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Seri</span>
                        </div>
                    </div>
                </div>

                {/* Seviye Seçimi */}
                <div className="mb-6">
                    <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Target className="w-4 h-4" /> Seviye Seç
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {levels.map(lvl => {
                            const meta = LEVEL_META[lvl];
                            const isSelected = selectedLevel === lvl;
                            return (
                                <button
                                    key={lvl}
                                    onClick={() => { setSelectedLevel(lvl); usedWordsRef.current = []; }}
                                    disabled={loading}
                                    className={`relative py-3 px-2 rounded-2xl border-2 font-bold text-sm transition-all active:scale-95 flex flex-col items-center gap-1 ${isSelected
                                        ? `${meta.color} ${meta.darkColor} border-current scale-105 shadow-md`
                                        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600"
                                        }`}
                                >
                                    <span className="text-lg">{meta.emoji}</span>
                                    <span>{lvl}</span>
                                </button>
                            );
                        })}
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 text-center">
                        {LEVEL_META[selectedLevel].desc}
                    </p>
                </div>

                {/* Egzersiz Kartı */}
                <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 dark:border-zinc-800/50 overflow-hidden">

                    {/* Başlangıç Ekranı */}
                    {!exercise && !loading && !error && (
                        <div className="p-10 text-center">
                            <div className="w-20 h-20 bg-violet-100 dark:bg-violet-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Brain className="w-10 h-10 text-violet-500" />
                            </div>
                            <h2 className="text-2xl font-black mb-3">Yapay Zeka Hazır</h2>
                            <p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-xs mx-auto text-sm leading-relaxed">
                                {LEVEL_META[selectedLevel].label} seviyesine uygun cümleler üretilecek. Boşluğa doğru kelimeyi yazın.
                            </p>
                            <button
                                onClick={fetchExercise}
                                className="w-full max-w-xs mx-auto flex items-center justify-center gap-3 py-4 px-8 bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-violet-500/30 active:scale-95 transition-all text-lg"
                            >
                                <Sparkles className="w-5 h-5" />
                                Başla
                            </button>
                        </div>
                    )}

                    {/* Yükleniyor */}
                    {loading && (
                        <div className="p-12 text-center">
                            <div className="relative w-16 h-16 mx-auto mb-6">
                                <div className="absolute inset-0 rounded-full border-4 border-violet-200 dark:border-violet-500/20" />
                                <div className="absolute inset-0 rounded-full border-4 border-violet-500 border-t-transparent animate-spin" />
                                <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-violet-500" />
                            </div>
                            <p className="text-zinc-500 dark:text-zinc-400 font-medium">AI cümle oluşturuyor...</p>
                            <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-1">{LEVEL_META[selectedLevel].label} seviyesi</p>
                        </div>
                    )}

                    {/* Hata */}
                    {error && (
                        <div className="p-8 text-center">
                            {error === "no_words_available" ? (
                                <>
                                    <div className="w-16 h-16 bg-amber-100 dark:bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="text-3xl">🎉</span>
                                    </div>
                                    <p className="text-amber-600 dark:text-amber-400 font-bold mb-2">Bu seviyeyi bitirdin!</p>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                                        {selectedLevel} seviyesindeki tüm kelimeleri gördün. Seviyeyi sıfırlayarak tekrar başlayabilirsin.
                                    </p>
                                    <button
                                        onClick={() => { usedWordsRef.current = []; setError(null); fetchExercise(); }}
                                        className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition"
                                    >
                                        Tekrar Başla
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <XCircle className="w-8 h-8 text-red-500" />
                                    </div>
                                    <p className="text-red-600 dark:text-red-400 font-bold mb-2">Bir hata oluştu</p>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">{error}</p>
                                    <button onClick={fetchExercise} className="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold hover:opacity-90 transition">
                                        Tekrar Dene
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {/* Egzersiz */}
                    {exercise && !loading && (
                        <div className="p-8">
                            {/* Seviye badge */}
                            <div className="flex items-center justify-between mb-6">
                                <span className={`text-xs font-black px-3 py-1 rounded-full border ${LEVEL_META[selectedLevel].color} ${LEVEL_META[selectedLevel].darkColor}`}>
                                    {LEVEL_META[selectedLevel].emoji} {selectedLevel}
                                </span>
                                <button
                                    onClick={() => {
                                        const fullSentence = exercise.sentence.replace("___", exercise.answer);
                                        playAudio(fullSentence, { accent: voiceAccent, rate: speechRate });
                                    }}
                                    type="button"
                                    className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition"
                                    title="Cümleyi Dinle"
                                >
                                    <Volume2 className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Cümle */}
                            <div className="mb-8 text-center">
                                <p className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white leading-relaxed">
                                    {renderSentence(
                                        exercise.sentence,
                                        feedback !== "idle" ? exercise.answer : undefined
                                    )}
                                </p>
                            </div>

                            {/* İpucu */}
                            {showHint && (
                                <div className="mb-4 flex items-start gap-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl px-4 py-3 animate-in slide-in-from-top-2">
                                    <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                    <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">{exercise.hint}</p>
                                </div>
                            )}

                            {/* Doğru Cevap Açıklaması */}
                            {feedback === "wrong" && (
                                <div className="mb-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3 animate-in slide-in-from-bottom-2">
                                    <p className="text-sm text-red-600 dark:text-red-400 font-bold mb-1">Doğru cevap: <span className="text-red-800 dark:text-red-200">{exercise.answer}</span></p>
                                    <p className="text-xs text-red-500 dark:text-red-400 opacity-80">🇹🇷 {exercise.turkish}</p>
                                </div>
                            )}
                            {feedback === "correct" && (
                                <div className="mb-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl px-4 py-3 animate-in slide-in-from-bottom-2 flex items-center gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                    <div>
                                        <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Harika! 🎉</p>
                                        <p className="text-xs text-emerald-600 dark:text-emerald-400">🇹🇷 {exercise.turkish}</p>
                                    </div>
                                </div>
                            )}

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-3">
                                <div className="relative">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={userAnswer}
                                        onChange={e => setUserAnswer(e.target.value)}
                                        disabled={feedback !== "idle"}
                                        placeholder="Boşluğa gelecek kelimeyi yazın..."
                                        autoComplete="off"
                                        className={`w-full text-center text-xl rounded-2xl px-6 py-4 border-2 outline-none transition-all
                                            bg-zinc-50 dark:bg-zinc-800/50 placeholder:text-zinc-300 dark:placeholder:text-zinc-600
                                            ${feedback === "idle" ? "border-zinc-200 dark:border-zinc-700 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20" : ""}
                                            ${feedback === "correct" ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : ""}
                                            ${feedback === "wrong" ? "border-red-500 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400" : ""}
                                        `}
                                    />
                                    {feedback === "correct" && <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 text-emerald-500" />}
                                    {feedback === "wrong" && <XCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 text-red-500" />}
                                </div>

                                <div className="flex gap-2">
                                    {feedback === "idle" && (
                                        <>
                                            <button
                                                type="submit"
                                                disabled={!userAnswer.trim()}
                                                className={`flex-1 py-4 rounded-xl font-bold transition-all ${userAnswer.trim()
                                                    ? "bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white shadow-lg shadow-violet-500/25 active:scale-[0.98]"
                                                    : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
                                                    }`}
                                            >
                                                Kontrol Et
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setShowHint(!showHint)}
                                                title="İpucu"
                                                className="px-4 py-4 bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl hover:bg-amber-200 dark:hover:bg-amber-500/20 transition"
                                            >
                                                <Lightbulb className="w-5 h-5" />
                                            </button>
                                        </>
                                    )}

                                    {feedback !== "idle" && (
                                        <button
                                            type="button"
                                            onClick={fetchExercise}
                                            className="flex-1 flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-violet-500/25 active:scale-[0.98] transition-all"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                            Sonraki Cümle
                                        </button>
                                    )}
                                </div>

                                {feedback === "idle" && (
                                    <button
                                        type="button"
                                        onClick={fetchExercise}
                                        className="w-full py-2.5 text-xs font-medium text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 flex items-center justify-center gap-1.5 transition"
                                    >
                                        <RotateCw className="w-3.5 h-3.5" />
                                        Bu cümleyi geç, yeni bir tane üret
                                    </button>
                                )}
                            </form>

                            {/* Bilgi notu */}
                            <div className="mt-6 flex items-start gap-2 text-xs text-zinc-400 dark:text-zinc-600">
                                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                <p>Uzun kelimelerde ilk %65'ini doğru yazmak yeterli · Typo toleransı aktif</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
