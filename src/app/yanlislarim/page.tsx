"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getProgressData, getStats, UserProgress, UserStats, saveProgressData } from "@/utils/storage";
import { ArrowLeft, History, Trophy, BrainCircuit, Target, CheckCircle2, Volume2, FolderHeart, Brain, Loader2, Sparkles, MessageSquare, Lightbulb, AlertCircle } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { playAudio } from "@/utils/speech";

import { AddToCollectionModal } from "@/components/add-to-collection-modal";
import { AIAdvisor } from "@/components/ai-advisor";

interface Word {
    id: string;
    english: string;
    turkish: string;
    level: string;
    tags: string[];
    example: string;
}

interface MistakeItem extends Word {
    progress: UserProgress;
}

export default function YanlislarimPage() {

    const [stats, setStats] = useState<UserStats | null>(null);
    const [mistakes, setMistakes] = useState<MistakeItem[]>([]);
    const [selectedWordToAdd, setSelectedWordToAdd] = useState<{ id: string, english: string } | null>(null);

    useEffect(() => {
        const loadPageData = async () => {
            // Load stats
            const statsData = getStats();
            setStats(statsData);

            // Load mistakes
            try {
                const res = await fetch('/api/words');
                const latestWords: Word[] = await res.json();
                const progressData = getProgressData();

                const mistakesArray: MistakeItem[] = [];

                Object.keys(progressData).forEach(wordId => {
                    const prog = progressData[wordId];
                    if (prog.wrongCount > 0) {
                        const wordInfo = latestWords.find(w => w.id === wordId);
                        if (wordInfo) {
                            mistakesArray.push({
                                ...wordInfo,
                                progress: prog
                            });
                        }
                    }
                });

                // Sort by last seen descending
                mistakesArray.sort((a, b) => {
                    const dateA = a.progress.lastSeenAt ? new Date(a.progress.lastSeenAt).getTime() : 0;
                    const dateB = b.progress.lastSeenAt ? new Date(b.progress.lastSeenAt).getTime() : 0;
                    return dateB - dateA;
                });

                setMistakes(mistakesArray);
            } catch (error) {
                console.error("Failed to fetch mistakes:", error);
            }
        };

        loadPageData();
    }, []);

    const handleMarkAsSolved = (wordId: string) => {
        const progressData = getProgressData();
        if (progressData[wordId]) {
            progressData[wordId].wrongCount = 0;
            progressData[wordId].correctStreak = 1;
            progressData[wordId].repetitions = 0;
            progressData[wordId].interval = 0;

            saveProgressData(progressData);
            setMistakes(prev => prev.filter(m => m.id !== wordId));
        }
    };

    if (!stats) return null;

    const accuracy = stats.totalQuestions > 0
        ? Math.round((stats.correctCount / stats.totalQuestions) * 100)
        : 0;

    return (
        <div className="flex min-h-screen flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50 via-white to-zinc-50 dark:from-indigo-950/20 dark:via-zinc-950 dark:to-zinc-950 p-6 font-sans text-zinc-900 dark:text-zinc-100 pb-20">

            <div className="w-full max-w-4xl mx-auto mt-6">
                <div className="mb-10 flex items-start sm:items-center gap-4 justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <button className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full hover:bg-zinc-100 hover:scale-105 active:scale-95 dark:hover:bg-zinc-800 transition shadow-sm">
                                <ArrowLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                            </button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2 bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400">
                                <History className="w-8 h-8 text-indigo-500" />
                                Gelişim & Hatalar
                            </h1>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">İstatistiklerinizi ve zorlandığınız kelimeleri inceleyin.</p>
                        </div>
                    </div>
                    <ThemeToggle />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400 mb-2 font-medium text-sm">
                            <BrainCircuit className="w-4 h-4 text-indigo-500" /> Toplam Soru
                        </div>
                        <div className="text-3xl font-black">{stats.totalQuestions}</div>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 mb-2 font-medium text-sm">
                            <CheckCircle2 className="w-4 h-4" /> Doğru
                        </div>
                        <div className="text-3xl font-black">{stats.correctCount}</div>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 mb-2 font-medium text-sm">
                            <History className="w-4 h-4" /> Yanlış
                        </div>
                        <div className="text-3xl font-black">{stats.wrongCount}</div>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center gap-3 text-amber-500 mb-2 font-medium text-sm">
                            <Target className="w-4 h-4" /> Başarı
                        </div>
                        <div className="text-3xl font-black">{accuracy}%</div>
                    </div>
                </div>

                {stats.levelStats && (
                    <div className="mb-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4">Seviye Başarı Oranları</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                            {['A1', 'A2', 'B1', 'B2'].map(lvl => {
                                const lvlStat = stats.levelStats?.[lvl];
                                if (!lvlStat) return null;
                                const perc = lvlStat.total > 0 ? Math.round((lvlStat.correct / lvlStat.total) * 100) : 0;

                                return (
                                    <div key={lvl} className="flex flex-col">
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="font-bold text-lg">{lvl}</span>
                                            <span className="text-xs font-semibold text-zinc-500">{perc}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all ${perc > 75 ? 'bg-emerald-500' : perc > 40 ? 'bg-amber-500' : perc > 0 ? 'bg-rose-500' : 'bg-transparent'
                                                    }`}
                                                style={{ width: `${perc}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <AIAdvisor mistakes={mistakes} />

                <div>
                    <div className="flex justify-between items-end mb-6">
                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400">Tekrar Edilecek Kelimeler</h2>
                        <div className="text-sm font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400 px-4 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
                            {mistakes.length} Kelime
                        </div>
                    </div>

                    {mistakes.length === 0 ? (
                        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/50 dark:border-zinc-800/50 rounded-3xl p-12 text-center shadow-xl">
                            <Trophy className="w-20 h-20 mx-auto text-yellow-500 mb-6 drop-shadow-lg" />
                            <h3 className="text-2xl font-black mb-3 text-zinc-900 dark:text-zinc-100">Harika Gidiyorsun!</h3>
                            <p className="text-zinc-500 dark:text-zinc-400 text-lg">Şu anda tekrar etmen gereken yanlış kelimen bulunmuyor.</p>
                        </div>
                    ) : (
                        <div className="grid gap-5 sm:grid-cols-2">
                            {mistakes.map((item) => (
                                <div key={item.id} className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/50 dark:border-zinc-800/50 rounded-3xl p-6 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex justify-between items-start mb-5 relative z-10">
                                        <div className="flex gap-3 items-center">
                                            <span className="font-extrabold text-2xl tracking-tight text-zinc-900 dark:text-white">{item.english}</span>
                                            <button
                                                onClick={() => playAudio(item.english)}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 rounded-md transition-all shrink-0"
                                                title="Sesli Oku"
                                            >
                                                <Volume2 className="w-5 h-5" />
                                            </button>
                                            <span className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg text-zinc-600 dark:text-zinc-400 font-bold uppercase tracking-wider">{item.level}</span>
                                        </div>
                                        <div className="flex items-center text-xs text-rose-600 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 px-2.5 py-1 rounded-lg font-bold">
                                            {item.progress.wrongCount} Kez Yanlış
                                        </div>
                                    </div>

                                    <div className="space-y-4 flex-1 mb-6 relative z-10">
                                        <div className="bg-emerald-50/50 dark:bg-emerald-500/5 p-3 rounded-xl border border-emerald-100 dark:border-emerald-500/10">
                                            <span className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-widest font-black block mb-1">Doğrusu</span>
                                            <span className="text-emerald-700 dark:text-emerald-400 font-bold text-lg">{item.turkish}</span>
                                        </div>
                                        <div className="bg-rose-50/50 dark:bg-rose-500/5 p-3 rounded-xl border border-rose-100 dark:border-rose-500/10">
                                            <span className="text-[10px] text-rose-600/70 dark:text-rose-400/70 uppercase tracking-widest font-black block mb-1">Senin Son Cevabın</span>
                                            <span className="text-rose-700 dark:text-rose-400 font-bold line-through decoration-rose-400/50 text-lg">{item.progress.lastAnswer || "-"}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-auto pt-5 border-t border-zinc-100 dark:border-zinc-800/50 relative z-10">
                                        <div className="text-xs text-zinc-400 font-medium">
                                            Son: {item.progress.lastSeenAt ? new Date(item.progress.lastSeenAt).toLocaleDateString("tr-TR") : "-"}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setSelectedWordToAdd({ id: item.id, english: item.english })}
                                                className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all"
                                                title="Listeye Ekle"
                                            >
                                                <FolderHeart className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleMarkAsSolved(item.id)}
                                                className="flex items-center gap-2 bg-emerald-500 text-white px-5 py-2.5 rounded-2xl font-black text-sm shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                                Çözüldü
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <AddToCollectionModal
                    wordId={selectedWordToAdd?.id || ""}
                    wordText={selectedWordToAdd?.english || ""}
                    isOpen={!!selectedWordToAdd}
                    onClose={() => setSelectedWordToAdd(null)}
                />
            </div>
        </div>
    );
}
