"use client";

import { useState, useEffect, useCallback } from "react";
import {
    getUserCollections,
    saveCollection,
    deleteCollection,
    WordCollection
} from "@/lib/collections-service";
import {
    ArrowLeft,
    Plus,
    FolderHeart,
    Trash2,
    BookOpen,
    Calendar,
} from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function CollectionsPage() {
    const [collections, setCollections] = useState<WordCollection[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newListName, setNewListName] = useState("");
    const [newWordsText, setNewWordsText] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const fetchCollections = useCallback(async () => {
        const data = await getUserCollections();
        setCollections(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchCollections();
    }, [fetchCollections]);

    const handleCreateList = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newListName.trim()) return;

        setSubmitting(true);
        let success = false;
        
        if (newWordsText.trim()) {
            // Quick Create Mode
            const res = await fetch("/api/collections/quick-create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newListName.trim(), wordsText: newWordsText }),
            });
            if (res.ok) success = true;
        } else {
            // Normal Empty List Create
            const id = await saveCollection({
                name: newListName.trim(),
                wordIds: []
            });
            if (id) success = true;
        }

        if (success) {
            setNewListName("");
            setNewWordsText("");
            setIsCreateModalOpen(false);
            fetchCollections();
        } else {
            alert("Liste oluşturulurken bir hata oluştu.");
        }
        setSubmitting(false);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Bu listeyi silmek istediğinize emin misiniz?")) return;
        const success = await deleteCollection(id);
        if (success) {
            setCollections(prev => prev.filter(c => c.id !== id));
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50 via-white to-zinc-50 dark:from-indigo-950/20 dark:via-zinc-950 dark:to-zinc-950 p-6 font-sans text-zinc-900 dark:text-zinc-100 pb-20">
            <div className="w-full max-w-4xl mx-auto mt-6">

                {/* Header */}
                <div className="mb-10 flex items-start sm:items-center gap-4 justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <button className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full hover:bg-zinc-100 hover:scale-105 active:scale-95 dark:hover:bg-zinc-800 transition shadow-sm">
                                <ArrowLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                            </button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2 bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400">
                                <FolderHeart className="w-8 h-8 text-rose-500" />
                                Özel Listelerim
                            </h1>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Kendi kelime gruplarınızı oluşturun ve yönetin.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="bg-indigo-500 text-white p-3 rounded-full shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all"
                        >
                            <Plus className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Collections Grid */}
                {collections.length === 0 ? (
                    <div className="bg-white dark:bg-zinc-900/50 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl p-12 text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mb-6">
                            <BookOpen className="w-10 h-10" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">Henüz listeniz yok</h2>
                        <p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-xs mx-auto">
                            Hemen ilk özel listenizi oluşturarak kelimelerinizi temalarına göre gruplandırmaya başlayın.
                        </p>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="bg-indigo-500 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all"
                        >
                            Yeni Liste Oluştur
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {collections.map(col => (
                            <div
                                key={col.id}
                                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                        <BookOpen className="w-6 h-6" />
                                    </div>
                                    <button
                                        onClick={() => handleDelete(col.id)}
                                        className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>

                                <h3 className="text-xl font-black mb-1 group-hover:text-indigo-500 transition-colors">{col.name}</h3>
                                <div className="flex items-center gap-4 mt-4 text-sm font-bold text-zinc-500 dark:text-zinc-400">
                                    <span className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full">
                                        {col.wordIds.length} Kelime
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="w-4 h-4" />
                                        {col.createdAt ? new Date(col.createdAt).toLocaleDateString('tr-TR') : '-'}
                                    </span>
                                </div>

                                <div className="mt-6 flex gap-2">
                                    <button className="flex-1 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-3 rounded-2xl font-black text-sm hover:opacity-90 transition-all">
                                        Listeyi İncele
                                    </button>
                                    <button 
                                        onClick={() => {
                                            localStorage.setItem('autoStartCollection', col.id);
                                            window.location.href = '/';
                                        }}
                                        className="flex-1 w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 py-3 rounded-2xl font-black text-sm hover:shadow-md transition-all">
                                            Çalışmaya Başla
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                        <h2 className="text-2xl font-black mb-6">Yeni Liste Oluştur</h2>
                        <form onSubmit={handleCreateList}>
                            <div className="mb-4">
                                <label className="block text-xs font-black uppercase tracking-widest text-zinc-400 mb-2 px-1">Liste Adı</label>
                                <input
                                    autoFocus
                                    type="text"
                                    value={newListName}
                                    onChange={(e) => setNewListName(e.target.value)}
                                    placeholder="Örn: Seyahat Kelimeleri"
                                    className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-4 font-bold focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                                />
                            </div>

                            <div className="mb-6">
                                <label className="block text-xs font-black uppercase tracking-widest text-zinc-400 mb-2 px-1">Otomatik Kelime Ekle (Opsiyonel)</label>
                                <textarea
                                    value={newWordsText}
                                    onChange={(e) => setNewWordsText(e.target.value)}
                                    placeholder="Her satıra bir kelime yazın.
Örn:
apple=elma
banana=muz
car"
                                    className="w-full h-32 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none resize-none"
                                />
                                <p className="text-[10px] text-zinc-500 mt-1.5 px-1">Otomatik listeye eklenir, sistemde yoksalar A1 seviyesinde kaydedilir.</p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="flex-1 py-4 font-black text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                                >
                                    Vazgeç
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || !newListName.trim()}
                                    className="flex-1 bg-indigo-500 text-white py-4 rounded-2xl font-black shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all"
                                >
                                    {submitting ? "Oluşturuluyor..." : "Oluştur"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
