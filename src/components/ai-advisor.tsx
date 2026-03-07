"use client";

import { useState } from "react";
import { Brain, Loader2, Sparkles, MessageSquare, Target, Lightbulb, AlertCircle } from "lucide-react";

interface AIAnalysis {
    category: string;
    summary: string;
    tips: string[];
    suggestedGoal: string;
}

interface MistakeData {
    english: string;
    turkish: string;
    progress: {
        lastAnswer?: string | null;
        wrongCount: number;
    };
}

export const AIAdvisor = ({ mistakes }: { mistakes: MistakeData[] }) => {
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
    const [error, setError] = useState<string | null>(null);

    const analyzeMistakes = async () => {
        if (!mistakes.length) return;

        setLoading(true);
        setError(null);

        try {
            // Prepare mistake data for AI
            const mistakeSummary = mistakes.slice(0, 15).map(m => ({
                word: m.english,
                meaning: m.turkish,
                lastWrongAnswer: m.progress.lastAnswer,
                wrongCount: m.progress.wrongCount
            }));

            const prompt = `Aşağıda bir İngilizce öğrencisinin yaptığı son hatalar ve yanlış cevaplar verilmiştir. 
      Lütfen bu hataları analiz et ve JSON formatında şu yapıda yanıt ver:
      {
        "category": "Hata ana kategorisi (örn: Gramer Karışıklığı, Benzer Kelimeler vb.)",
        "summary": "Öğrencinin genel durumu hakkında kısa bir özet (Türkçe)",
        "tips": ["Öneri 1", "Öneri 2", "Öneri 3"],
        "suggestedGoal": "Öğrenci için haftalık kelime hedefi önerisi"
      }

      Hatalar: ${JSON.stringify(mistakeSummary)}`;

            const res = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: "arcee-ai/trinity-large-preview:free",
                    messages: [
                        { role: "system", content: "Sen profesyonel bir İngilizce öğretmenisin ve yardımcı bir eğitim asistanısın." },
                        { role: "user", content: prompt }
                    ]
                })
            });

            const data = await res.json();

            if (data.error) throw new Error(data.error);

            // Parse AI response (robustly handle stringified JSON if needed)
            const content = data.choices[0].message.content;
            setAnalysis(JSON.parse(content));
        } catch (err: unknown) {
            console.error("AI Analysis Error:", err);
            const errorMessage = err instanceof Error ? err.message : "Analiz yapılamadı.";
            setError(`${errorMessage}. Lütfen API anahtarınızı kontrol edin.`);
        } finally {
            setLoading(false);
        }
    };

    if (!mistakes.length) return null;

    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] overflow-hidden shadow-sm mb-10 transition-all hover:shadow-xl border-t-4 border-t-indigo-500">
            <div className="p-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500 shadow-inner">
                            <Brain className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight">AI Öğretmen Analizi</h2>
                            <p className="text-zinc-500 dark:text-zinc-400 font-medium text-sm">Hatalarına göre sana özel öneriler.</p>
                        </div>
                    </div>

                    {!analysis && (
                        <button
                            onClick={analyzeMistakes}
                            disabled={loading}
                            className="w-full sm:w-auto bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-8 py-4 rounded-2xl font-black text-sm shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all flex items-center justify-center gap-2 group"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Analiz Ediliyor...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5 text-indigo-400 group-hover:rotate-12 transition-transform" />
                                    Analizi Başlat
                                </>
                            )}
                        </button>
                    )}
                </div>

                {error && (
                    <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 p-5 rounded-2xl flex items-start gap-3 text-rose-600 dark:text-rose-400">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <p className="text-sm font-bold">{error}</p>
                    </div>
                )}

                {analysis && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800">
                                <div className="flex items-center gap-2 text-indigo-500 mb-3">
                                    <MessageSquare className="w-5 h-5" />
                                    <span className="text-xs font-black uppercase tracking-widest">Genel Durum</span>
                                </div>
                                <p className="font-bold text-lg leading-relaxed">{analysis.summary}</p>
                            </div>

                            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800">
                                <div className="flex items-center gap-2 text-emerald-500 mb-3">
                                    <Target className="w-5 h-5" />
                                    <span className="text-xs font-black uppercase tracking-widest">Önerilen Hedef</span>
                                </div>
                                <div className="text-3xl font-black mb-1">{analysis.suggestedGoal}</div>
                                <p className="text-sm text-zinc-500 font-bold">Yeni Kelime / Hafta</p>
                            </div>
                        </div>

                        <div className="bg-indigo-50/50 dark:bg-indigo-500/5 p-8 rounded-3xl border border-indigo-100 dark:border-indigo-500/20">
                            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-6 font-black uppercase tracking-widest text-xs">
                                <Lightbulb className="w-4 h-4" /> Çalışma İpuçları
                            </div>
                            <ul className="space-y-4">
                                {analysis.tips.map((tip, i) => (
                                    <li key={i} className="flex items-start gap-4">
                                        <span className="w-6 h-6 rounded-lg bg-indigo-500 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5 shadow-md shadow-indigo-500/20">
                                            {i + 1}
                                        </span>
                                        <span className="font-bold text-zinc-700 dark:text-zinc-300">{tip}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="flex justify-center pt-4">
                            <button
                                onClick={() => setAnalysis(null)}
                                className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white font-black text-xs uppercase tracking-widest transition-colors"
                            >
                                Analizi Temizle
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
