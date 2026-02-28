"use client";

import { useState, useRef, useEffect } from "react";

import { BookOpen, Search, ArrowRight, Brain, Filter, AlertCircle, CheckCircle2, XCircle, History, RotateCw, ListX, Flame, Target, Database, Volume2, FolderHeart, Sparkles } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserProfile } from "@/components/user-profile";
import { updateWordProgress, updateStats, getProgressData, getStats, UserStats } from "@/utils/storage";
import { playAudio, VoiceAccent, SpeechRate } from "@/utils/speech";
import { getUserCollections } from "@/lib/collections-service";
import { WordCollection } from "@/lib/collections-service";

type QuizMode = "en-tr" | "tr-en" | "mixed";
type QuizType = "normal" | "review" | "mistakes";
type Level = "A1" | "A2" | "B1" | "B2";

interface Word {
  id: string;
  english: string;
  turkish: string;
  alternativeMeanings?: string[]; // Yan anlamlar: ["hala", "teyze"] gibi
  level: string;
  tags: string[];
  example: string;
}

export default function Home() {

  const [mode, setMode] = useState<QuizMode>("en-tr");
  const [selectedLevels, setSelectedLevels] = useState<Set<Level>>(new Set(["A1", "A2"]));
  const [letters, setLetters] = useState<string>("");
  const [isQuizStarted, setIsQuizStarted] = useState(false);
  const [isQuizFinished, setIsQuizFinished] = useState(false);
  const [filteredWords, setFilteredWords] = useState<Word[]>([]);
  const [quizType, setQuizType] = useState<QuizType>("normal");
  const [userCollections, setUserCollections] = useState<WordCollection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Stats for the current session (useful for review/mistakes summary)
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionWrong, setSessionWrong] = useState(0);

  // Homepage "Due Reviews" and "All Mistakes" stats
  const [dueReviewsCount, setDueReviewsCount] = useState(0);
  const [allMistakesCount, setAllMistakesCount] = useState(0);

  // Phase 6 stats
  const [stats, setStats] = useState<UserStats | null>(null);

  // Quiz State
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState<"idle" | "correct" | "wrong">("idle");
  const [correctAnswerText, setCorrectAnswerText] = useState("");
  const [recentWordIds, setRecentWordIds] = useState<string[]>([]);
  const [wordsLeftInSession, setWordsLeftInSession] = useState<string[]>([]);
  const [roundQueue, setRoundQueue] = useState<string[]>([]); // normal mod: tur sırasını tutar
  const [audioPlayed, setAudioPlayed] = useState(false);
  const [voiceAccent, setVoiceAccent] = useState<VoiceAccent>("en-US");
  const [speechRate, setSpeechRate] = useState<SpeechRate>("normal");

  const inputRef = useRef<HTMLInputElement>(null);
  const levels: Level[] = ["A1", "A2", "B1", "B2"];

  // Load saved voice preferences
  useEffect(() => {
    const savedAccent = localStorage.getItem("ik_voice_accent") as VoiceAccent | null;
    const savedRate = localStorage.getItem("ik_speech_rate") as SpeechRate | null;
    if (savedAccent) setVoiceAccent(savedAccent);
    if (savedRate) setSpeechRate(savedRate);
  }, []);

  // Persist voice preferences
  const handleAccentChange = (accent: VoiceAccent) => {
    setVoiceAccent(accent);
    localStorage.setItem("ik_voice_accent", accent);
    if (currentWord) playAudio(currentWord.english, { accent, rate: speechRate });
    setAudioPlayed(true);
  };

  const handleRateChange = (rate: SpeechRate) => {
    setSpeechRate(rate);
    localStorage.setItem("ik_speech_rate", rate);
    if (currentWord) playAudio(currentWord.english, { accent: voiceAccent, rate });
    setAudioPlayed(true);
  };

  // Auto-play pronunciation when a new English word appears
  useEffect(() => {
    if (currentWord && isQuizStarted && feedback === "idle" && (mode === "en-tr" || mode === "mixed")) {
      setAudioPlayed(false);
      const timer = setTimeout(() => {
        playAudio(currentWord.english, { accent: voiceAccent, rate: speechRate });
        setAudioPlayed(true);
      }, 300);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWord?.id]);

  const calculateCounters = () => {
    if (typeof window !== "undefined") {
      const progressData = getProgressData();
      let dueReqs = 0;
      let mistakesReqs = 0;
      const now = new Date().getTime();

      Object.values(progressData).forEach((prog) => {
        if (prog.wrongCount > 0) {
          mistakesReqs++;
          if (prog.nextReviewAt && new Date(prog.nextReviewAt).getTime() <= now) {
            dueReqs++;
          }
        }
      });
      setDueReviewsCount(dueReqs);
      setAllMistakesCount(mistakesReqs);
      setStats(getStats());
    }
  };

  useEffect(() => {
    getUserCollections().then(setUserCollections);
  }, []);

  useEffect(() => {
    // Calculate Review and Mistakes stats purely for UI when page loads or comes back
    if (!isQuizStarted) {
      calculateCounters();
    }
  }, [isQuizStarted]);

  const toggleLevel = (level: Level) => {
    const newLevels = new Set(selectedLevels);
    if (newLevels.has(level)) {
      newLevels.delete(level);
    } else {
      newLevels.add(level);
    }
    setSelectedLevels(newLevels);
    setError(null);
  };

  // Diziyi karıştır (Fisher-Yates)
  const shuffle = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const startQuizWithWords = (initialWords: Word[], qType: QuizType) => {
    setFilteredWords(initialWords);
    setQuizType(qType);
    setRecentWordIds([]);
    setSessionCorrect(0);
    setSessionWrong(0);
    setIsQuizFinished(false);

    if (qType === "review" || qType === "mistakes") {
      setWordsLeftInSession(initialWords.map(w => w.id));
      setRoundQueue([]);
    } else {
      setWordsLeftInSession([]);
      // Normal mod: tüm kelimeleri karıştırılmış sırayla bir kez sun
      const queue = shuffle(initialWords.map(w => w.id));
      setRoundQueue(queue);
    }

    setIsQuizStarted(true);
    const queue = qType === "normal" ? shuffle(initialWords.map(w => w.id)) : [];
    startNextQuestion(
      initialWords,
      [],
      qType === "review" || qType === "mistakes" ? initialWords.map(w => w.id) : [],
      qType,
      queue
    );
  };

  const getNextWord = (pool: Word[], currentHistory: string[], leftInSession: string[], qType: QuizType, currentRoundQueue: string[] = roundQueue) => {
    if (pool.length === 0) return null;

    if (qType === "review" || qType === "mistakes") {
      if (leftInSession.length === 0) return null;
      const nextId = leftInSession[Math.floor(Math.random() * leftInSession.length)];
      return pool.find(w => w.id === nextId) || null;
    }

    // Normal Mode: round-based (tüm kelimeler bir kez gösterilmeden tekrar etme)
    const progressData = getProgressData();
    const now = new Date().getTime();

    // Önce zamanı gelen tekrar kelimeleri kontrol et (sıraya bakma)
    const dueWordsInPool = pool.filter(w => {
      const prog = progressData[w.id];
      return !currentHistory.includes(w.id)
        && prog && prog.wrongCount > 0
        && prog.nextReviewAt
        && new Date(prog.nextReviewAt).getTime() <= now;
    });
    if (dueWordsInPool.length > 0) {
      return dueWordsInPool[Math.floor(Math.random() * dueWordsInPool.length)];
    }

    // Round queue'dan sıradaki kelimeyi al
    if (currentRoundQueue.length > 0) {
      const nextId = currentRoundQueue[0];
      return pool.find(w => w.id === nextId) || pool[Math.floor(Math.random() * pool.length)];
    }

    // Queue bitti, yeni tur başlat
    return null; // startNextQuestion yeni turu başlatacak
  };

  const startNextQuestion = (
    pool: Word[],
    currentHistory: string[],
    leftInSession: string[] = wordsLeftInSession,
    currentQuizType: QuizType = quizType,
    currentRoundQueue: string[] = roundQueue
  ) => {
    let nextWord = getNextWord(pool, currentHistory, leftInSession, currentQuizType, currentRoundQueue);
    let newRoundQueue = currentRoundQueue;

    // Normal modda queue bittiyse yeni tur başlat
    if (!nextWord && currentQuizType === "normal" && pool.length > 0) {
      newRoundQueue = shuffle(pool.map(w => w.id));
      setRoundQueue(newRoundQueue);
      nextWord = pool.find(w => w.id === newRoundQueue[0]) || pool[0];
    }

    if (nextWord) {
      setCurrentWord(nextWord);
      setUserAnswer("");
      setFeedback("idle");
      setCorrectAnswerText("");

      // Normal modda: gösterilen kelimeyi queue'dan çıkar
      if (currentQuizType === "normal") {
        const updatedQueue = newRoundQueue.filter(id => id !== nextWord!.id);
        setRoundQueue(updatedQueue);
      }

      const newHistory = [...currentHistory, nextWord.id].slice(-Math.min(5, Math.ceil(pool.length / 2)));
      setRecentWordIds(newHistory);

      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 50);
    } else {
      // Finished finite session
      setCurrentWord(null);
      setIsQuizFinished(true);
    }
  };

  const handleStartNormal = async () => {
    setError(null);
    if (selectedLevels.size === 0) {
      setError("Lütfen en az bir seviye seçin.");
      return;
    }

    try {
      const res = await fetch('/api/words');
      const latestWords: Word[] = await res.json();

      const selectedLetterArray = letters
        .split(",")
        .map((l) => l.toLocaleLowerCase('tr-TR').trim())
        .filter((l) => l.length > 0);

      let filtered = latestWords.filter((word) => {
        // Modül ve seviye kontrolü
        if (!selectedLevels.has(word.level as Level)) return false;

        // Baş harf filtresi (virgülle ayırmış olabilir)
        if (selectedLetterArray.length > 0) {
          const checkWord = mode === "en-tr" ? word.english : mode === "tr-en" ? word.turkish : word.english;
          const matchesLetter = selectedLetterArray.some((letter) =>
            checkWord.toLowerCase().startsWith(letter)
          );
          if (!matchesLetter) return false;
        }
        return true;
      });

      // Filter by selected collection if active
      if (selectedCollection) {
        const collection = userCollections.find(c => c.id === selectedCollection);
        if (collection) {
          filtered = filtered.filter(w => collection.wordIds.includes(w.id));
        }
      }

      if (filtered.length === 0) {
        setError("Bu filtrelere uygun kelime bulunamadı. Lütfen filtreleri esnetin.");
        return;
      }

      startQuizWithWords(filtered, "normal");
    } catch (err) {
      console.error("Fetch error in handleStartNormal:", err);
      setError("Kelimeler yüklenirken bir sorun oluştu.");
    }
  };

  const handleStartReview = async () => {
    try {
      const res = await fetch('/api/words');
      const latestWords: Word[] = await res.json();

      const progressData = getProgressData();
      const now = new Date().getTime();
      const dueIds = Object.keys(progressData).filter(id => {
        const prog = progressData[id];
        return prog.wrongCount > 0 && prog.nextReviewAt && new Date(prog.nextReviewAt).getTime() <= now;
      });

      const reviews = latestWords.filter(w => dueIds.includes(w.id));
      if (reviews.length === 0) return;

      startQuizWithWords(reviews, "review");
    } catch (err) {
      console.error("Fetch error in handleStartReview:", err);
      setError("Tekrar kelimeleri yüklenirken bir sorun oluştu.");
    }
  };

  const handleStartMistakes = async () => {
    try {
      const res = await fetch('/api/words');
      const latestWords: Word[] = await res.json();

      const progressData = getProgressData();
      const mistakeIds = Object.keys(progressData).filter(id => progressData[id].wrongCount > 0);

      const mistakesWords = latestWords.filter(w => mistakeIds.includes(w.id));
      if (mistakesWords.length === 0) return;

      startQuizWithWords(mistakesWords, "mistakes");
    } catch (err) {
      console.error("Fetch error in handleStartMistakes:", err);
      setError("Yanlış kelimeler yüklenirken bir sorun oluştu.");
    }
  };


  // Levenshtein distance algorithm
  const getEditDistance = (a: string, b: string): number => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }
    return matrix[b.length][a.length];
  };

  const checkMultipleAnswers = (userAns: string, word: Word, answerField: "turkish" | "english", allowTypos: boolean = true) => {
    const cleanUser = userAns.trim().toLocaleLowerCase('tr-TR');

    const primaryAnswers = word[answerField].split("/").map((a: string) => a.trim().toLocaleLowerCase('tr-TR'));
    const altAnswers = (answerField === "turkish" && word.alternativeMeanings)
      ? word.alternativeMeanings.map((a: string) => a.trim().toLocaleLowerCase('tr-TR'))
      : [];
    const possibleAnswers = [...primaryAnswers, ...altAnswers];

    // Direct match
    if (possibleAnswers.includes(cleanUser)) return true;

    for (const pa of possibleAnswers) {
      // Missing spaces check
      const noSpaceUser = cleanUser.replace(/\s+/g, '');
      const noSpaceCorrect = pa.replace(/\s+/g, '');
      if (noSpaceUser === noSpaceCorrect) return true;

      // Typo check
      if (allowTypos && pa.length > 3) {
        const distance = getEditDistance(cleanUser, pa);
        const allowedErrors = pa.length >= 7 ? 2 : 1;
        if (distance <= allowedErrors) return true;
      }

      // Kısmi yazım kabulü: 8+ harfli kelimelerde başın %65'ini yazmak yeterli
      // Örnek: "concentration" (13 harf) için "concentra" (9 harf = %69) kabul edilir
      const paNoSpace = pa.replace(/\s+/g, '');
      const userNoSpace = cleanUser.replace(/\s+/g, '');
      if (paNoSpace.length >= 8 && userNoSpace.length >= Math.ceil(paNoSpace.length * 0.65)) {
        if (paNoSpace.startsWith(userNoSpace)) return true;
      }
    }
    return false;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswer.trim() || feedback !== "idle" || !currentWord) return;

    let isCorrect = false;
    let actualCorrectAnswer = "";

    if (mode === "en-tr") {
      isCorrect = checkMultipleAnswers(userAnswer, currentWord, "turkish", true);
      actualCorrectAnswer = currentWord.turkish;
    } else {
      isCorrect = checkMultipleAnswers(userAnswer, currentWord, "english", false);
      actualCorrectAnswer = currentWord.english;
    }

    if (isCorrect) {
      setFeedback("correct");
      updateWordProgress(currentWord.id, true, userAnswer);
      updateStats(true, currentWord.level);
      setSessionCorrect(prev => prev + 1);
    } else {
      setFeedback("wrong");
      setCorrectAnswerText(actualCorrectAnswer);
      updateWordProgress(currentWord.id, false, userAnswer);
      updateStats(false, currentWord.level);
      setSessionWrong(prev => prev + 1);
    }

    // Determine left words for finite session modes
    let newLeftInSession = wordsLeftInSession;
    if (quizType === "review" || quizType === "mistakes") {
      newLeftInSession = wordsLeftInSession.filter(id => id !== currentWord.id);
      setWordsLeftInSession(newLeftInSession);
    }

    setTimeout(() => {
      startNextQuestion(filteredWords, recentWordIds, newLeftInSession);
    }, isCorrect ? 1000 : 2500);
  };

  const handleSkip = () => {
    if (!currentWord || feedback !== "idle") return;

    setFeedback("wrong");
    const actualCorrectAnswer = mode === "en-tr" ? currentWord.turkish : currentWord.english;
    setCorrectAnswerText(actualCorrectAnswer);
    setUserAnswer("");

    updateWordProgress(currentWord.id, false, "", true);
    updateStats(false, currentWord.level, true);
    setSessionWrong(prev => prev + 1);

    let newLeftInSession = wordsLeftInSession;
    if (quizType === "review" || quizType === "mistakes") {
      newLeftInSession = wordsLeftInSession.filter(id => id !== currentWord.id);
      setWordsLeftInSession(newLeftInSession);
    }

    setTimeout(() => {
      startNextQuestion(filteredWords, recentWordIds, newLeftInSession);
    }, 2500);
  };


  if (isQuizStarted) {
    if (isQuizFinished) {
      // Summary Screen
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6 font-sans">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-8 text-center animate-in zoom-in-95">
            <div className="inline-flex w-20 h-20 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-500 rounded-full items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-black mb-4">Oturum Tamamlandı!</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mb-8">
              {quizType === "review" ? "Zamanı gelen tüm tekrarları yaptın." : "Listendeki tüm hataları bitirdin."}
            </p>

            <div className="flex justify-center gap-6 mb-8 text-lg">
              <div className="flex flex-col items-center">
                <span className="font-bold text-3xl text-emerald-500">{sessionCorrect}</span>
                <span className="text-sm font-medium text-emerald-500/80">Doğru</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-3xl text-rose-500">{sessionWrong}</span>
                <span className="text-sm font-medium text-rose-500/80">Yanlış</span>
              </div>
            </div>

            <button
              onClick={() => {
                setIsQuizStarted(false);
                calculateCounters();
              }}
              className="w-full p-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold hover:opacity-90 transition active:scale-[0.98]"
            >
              Ana Sayfaya Dön
            </button>
          </div>
        </div>
      );
    }

    if (currentWord) {
      const questionText = mode === "en-tr" ? currentWord.english : mode === "tr-en" ? currentWord.turkish : currentWord.english;

      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50 via-white to-zinc-50 dark:from-indigo-950/20 dark:via-zinc-950 dark:to-zinc-950 p-6 font-sans">
          <div className="w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={() => {
                  setIsQuizStarted(false);
                  calculateCounters();
                }}
                className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition cursor-pointer text-sm font-medium"
              >
                ← Çıkış Yap
              </button>
              <div className="flex items-center gap-2">
                {(quizType === "review" || quizType === "mistakes") && (
                  <div className="text-xs font-semibold px-3 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-full">
                    Kalan: {wordsLeftInSession.length}
                  </div>
                )}
                <div className="text-xs font-semibold px-3 py-1 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-full">
                  {currentWord.level}
                </div>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 dark:border-zinc-800/50 p-8 sm:p-10 text-center relative overflow-hidden transition-all duration-500">
              <div className="mb-8">
                <p className="text-sm font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-4">
                  {mode === "en-tr" ? "İngİlİzce → Türkçe" : "Türkçe → İngİlİzce"}
                </p>

                <div className="flex items-center justify-center gap-4 mb-6">
                  <h2 className="text-4xl sm:text-5xl font-black text-zinc-900 dark:text-white tracking-tight">
                    {questionText}
                  </h2>
                </div>

                {/* Pronunciation Bar — visible when English is the question */}
                {(mode === "en-tr" || mode === "mixed" || (mode === "tr-en" && feedback !== "idle")) && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {/* Main play button */}
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => { playAudio(currentWord.english, { accent: voiceAccent, rate: speechRate }); setAudioPlayed(true); }}
                        type="button"
                        className="flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 hover:bg-indigo-600 active:scale-95 transition-all"
                      >
                        <Volume2 className="w-4 h-4" />
                        {audioPlayed ? "Tekrar Dinle" : "Telaffuzu Duy"}
                      </button>
                      {!audioPlayed && (
                        <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                          veya direkt yazın ↓
                        </span>
                      )}
                    </div>

                    {/* Accent selector */}
                    <div className="flex items-center justify-center gap-2">
                      {([
                        { value: "en-US" as VoiceAccent, label: "🇺🇸 US" },
                        { value: "en-GB" as VoiceAccent, label: "🇬🇧 UK" },
                        { value: "en-AU" as VoiceAccent, label: "🇦🇺 AU" },
                      ]).map(({ value, label }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleAccentChange(value)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${voiceAccent === value
                            ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-300 dark:ring-indigo-500/40"
                            : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    {/* Speed selector */}
                    <div className="flex items-center justify-center gap-2">
                      {([
                        { value: "slow" as SpeechRate, label: "🐢 Yavaş" },
                        { value: "normal" as SpeechRate, label: "🎵 Normal" },
                        { value: "fast" as SpeechRate, label: "⚡ Hızlı" },
                      ]).map(({ value, label }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleRateChange(value)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${speechRate === value
                            ? "bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 ring-1 ring-violet-300 dark:ring-violet-500/40"
                            : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    disabled={feedback !== "idle"}
                    placeholder="Karşılığını yazın..."
                    className={`w-full text-center text-xl bg-zinc-50 dark:bg-zinc-800/50 border-2 rounded-2xl px-6 py-4 outline-none transition-all placeholder:text-zinc-300 dark:placeholder:text-zinc-600
                      ${feedback === "idle" ? "border-zinc-200 dark:border-zinc-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" : ""}
                      ${feedback === "correct" ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : ""}
                      ${feedback === "wrong" ? "border-red-500 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400" : ""}
                    `}
                    autoFocus
                    autoComplete="off"
                  />

                  {feedback === "correct" && (
                    <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 text-emerald-500 animate-in zoom-in" />
                  )}
                  {feedback === "wrong" && (
                    <XCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 text-red-500 animate-in zoom-in" />
                  )}
                </div>

                {feedback === "wrong" && (
                  <div className="bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-200 p-4 rounded-xl text-sm font-medium animate-in slide-in-from-bottom-2">
                    <span className="opacity-70 block mb-1">Doğrusu şu olmalıydı:</span>
                    <span className="text-xl font-bold">{correctAnswerText}</span>
                    {/* Yan anlamlar */}
                    {mode === "en-tr" && currentWord?.alternativeMeanings && currentWord.alternativeMeanings.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-500/30">
                        <span className="text-xs opacity-60 block mb-2 uppercase tracking-wider font-black">Yan Anlamlar</span>
                        <div className="flex flex-wrap gap-1.5 justify-center">
                          {currentWord.alternativeMeanings.map((alt, i) => (
                            <span key={i} className="px-2.5 py-1 rounded-lg bg-red-200/60 dark:bg-red-400/20 text-red-800 dark:text-red-200 text-sm font-bold">
                              {alt}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}


                <button
                  type="submit"
                  disabled={!userAnswer.trim() || feedback !== "idle"}
                  className={`w-full p-4 rounded-xl font-bold transition-all duration-300 ${feedback !== "idle" || !userAnswer.trim()
                    ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white shadow-xl shadow-indigo-500/25 active:scale-[0.98]"
                    }`}
                >
                  Cevapla
                </button>

                {feedback === "idle" && (
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="w-full mt-2 p-3 text-sm font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors rounded-xl"
                  >
                    Bilmiyorum
                  </button>
                )}
              </form>
            </div>
          </div>
        </div >
      );
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50 via-white to-zinc-50 dark:from-indigo-950/20 dark:via-zinc-950 dark:to-zinc-950 p-6 font-sans text-zinc-900 dark:text-zinc-100 pb-20">
      <div className="w-full max-w-lg mt-8">

        {/* Top bar (Phase 6) */}
        {stats && (
          <div className="flex justify-between items-center mb-6 px-2">
            <div className="flex items-center gap-1.5 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 px-3 py-1.5 rounded-full font-bold text-sm shadow-sm border border-orange-100 dark:border-orange-500/20">
              <Flame className={`w-4 h-4 ${stats.streak.currentStreak > 0 ? "fill-orange-500 text-orange-500" : ""}`} />
              {stats.streak.currentStreak} Gün Seri
            </div>

            <div className="flex flex-col items-end flex-1 mr-4">
              <div className="flex items-center justify-end w-full gap-1.5 text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                <Target className="w-3.5 h-3.5" />
                Günlük Hedef ({stats.dailyGoal.current}/{stats.dailyGoal.target})
              </div>
              <div className="w-24 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden self-end">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (stats.dailyGoal.current / stats.dailyGoal.target) * 100)}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <UserProfile />
            </div>
          </div>
        )}

        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-2xl mb-6 shadow-indigo-500/40 relative group">
            <div className="absolute inset-0 bg-white/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <Brain className="w-10 h-10 relative z-10 animate-pulse" style={{ animationDuration: '3s' }} />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400">Kelime Öğren</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-3 mb-6 text-lg">Daha akıllıca, kalıcı öğrenin.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/yanlislarim">
              <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 px-5 py-2.5 rounded-full text-sm font-bold hover:shadow-md hover:-translate-y-0.5 transition-all">
                <History className="w-4 h-4 text-violet-500" />
                Yanlışlar & İstatistikler
              </button>
            </Link>
            <Link href="/admin">
              <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 px-5 py-2.5 rounded-full text-sm font-bold hover:shadow-md hover:-translate-y-0.5 transition-all">
                <Database className="w-4 h-4 text-emerald-500" />
                Kelime Havuzu
              </button>
            </Link>
          </div>
        </div>

        {/* --- Spaced Repetition Notifications --- */}
        {(dueReviewsCount > 0 || allMistakesCount > 0) && (
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={handleStartReview}
              disabled={dueReviewsCount === 0}
              className={`flex flex-col items-start p-5 rounded-2xl border text-left transition-all duration-300 ${dueReviewsCount > 0
                ? "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10 border-amber-200 dark:border-amber-500/30 hover:shadow-lg hover:-translate-y-1 cursor-pointer text-amber-900 dark:text-amber-100"
                : "bg-zinc-100 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
                }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <RotateCw className={`w-4 h-4 ${dueReviewsCount > 0 ? "text-amber-500" : ""}`} />
                <span className="font-bold text-sm">Tekrar Zamanı</span>
              </div>
              <p className="text-xs opacity-80">{dueReviewsCount} kelime seni bekliyor</p>
            </button>

            <button
              onClick={handleStartMistakes}
              disabled={allMistakesCount === 0}
              className={`flex flex-col items-start p-5 rounded-2xl border text-left transition-all duration-300 ${allMistakesCount > 0
                ? "bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-500/10 dark:to-pink-500/10 border-rose-200 dark:border-rose-500/30 hover:shadow-lg hover:-translate-y-1 cursor-pointer text-rose-900 dark:text-rose-100"
                : "bg-zinc-100 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
                }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <ListX className={`w-4 h-4 ${allMistakesCount > 0 ? "text-rose-500" : ""}`} />
                <span className="font-bold text-sm">Tüm Yanlışlar</span>
              </div>
              <p className="text-xs opacity-80">Toplam {allMistakesCount} hatalı kelime</p>
            </button>
          </div>
        )}


        {/* Normal Quiz Settings Card */}
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 dark:border-zinc-800/50 overflow-hidden">
          <div className="p-6 sm:p-8 space-y-8">

            <div>
              <label className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3 block flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Mod Seçin
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setMode("en-tr")}
                  className={`py-3 px-4 rounded-xl flex items-center justify-center font-medium transition-all ${mode === "en-tr"
                    ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-2 border-indigo-200 dark:border-indigo-500/30"
                    : "bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-300 border-2 border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                >
                  EN → TR
                </button>
                <button
                  onClick={() => setMode("tr-en")}
                  className={`py-3 px-4 rounded-xl flex items-center justify-center font-medium transition-all ${mode === "tr-en"
                    ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-2 border-indigo-200 dark:border-indigo-500/30"
                    : "bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-300 border-2 border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                >
                  TR → EN
                </button>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block flex items-center gap-2">
                  <FolderHeart className="w-4 h-4" /> Listeler
                </label>
                <Link href="/listelerim" className="text-xs font-bold text-indigo-500 hover:underline flex items-center gap-1">
                  Yönet <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCollection(null)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${selectedCollection === null
                    ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20"
                    : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                    }`}
                >
                  Tüm Havuz
                </button>
                {userCollections.map((col) => (
                  <button
                    key={col.id}
                    onClick={() => setSelectedCollection(col.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${selectedCollection === col.id
                      ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                      : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                      }`}
                  >
                    {col.name} ({col.wordIds.length})
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3 block flex items-center gap-2">
                <Filter className="w-4 h-4" /> Seviyeler
              </label>
              <div className="flex flex-wrap gap-3">
                {levels.map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => toggleLevel(lvl)}
                    className={`px-5 py-2.5 rounded-full font-medium transition-all ${selectedLevels.has(lvl)
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-md"
                      : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                      }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3 block flex items-center gap-2">
                <Search className="w-4 h-4" /> Baş Harfe Göre (İsteğe Bağlı)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={letters}
                  onChange={(e) => {
                    setLetters(e.target.value);
                    setError(null);
                  }}
                  placeholder="Örn: a, b, c (virgülle ayırın)"
                  className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-zinc-400"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <div className="pt-4">
              <button
                onClick={handleStartNormal}
                className="w-full group relative flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white p-4 rounded-xl font-bold text-lg shadow-xl shadow-indigo-500/30 transition-all outline-none focus:ring-4 focus:ring-indigo-500/30 active:scale-[0.98]"
              >
                <span>Hemen Başla (Rastgele)</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-300" />
              </button>

              {/* AI Cümle Modu */}
              <Link href="/cumle-modu" className="block mt-3">
                <div className="w-full group flex items-center justify-between bg-gradient-to-r from-violet-500/10 to-indigo-500/10 hover:from-violet-500/20 hover:to-indigo-500/20 dark:from-violet-500/10 dark:to-indigo-500/10 dark:hover:from-violet-500/20 dark:hover:to-indigo-500/20 border border-violet-200 dark:border-violet-500/30 text-violet-700 dark:text-violet-300 p-4 rounded-xl font-bold transition-all active:scale-[0.98]">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet-500 rounded-xl">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-black text-sm">AI Cümle Modu</p>
                      <p className="text-xs font-medium opacity-70">Yapay zekayla boşluk doldurma alıştırmaları</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            </div>

          </div>
        </div>

        <p className="text-center text-zinc-400 dark:text-zinc-600 text-sm mt-8">
          Bu uygulama sadece eğitim amaçlıdır.
        </p>

      </div>
    </div>
  );
}
