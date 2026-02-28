"use client";

import { useState, useEffect } from "react";
import { getUserCollections, addWordToCollection, WordCollection } from "@/lib/collections-service";
import { FolderHeart, Plus, X, Check, Loader2 } from "lucide-react";

interface Props {
    wordId: string;
    wordText: string;
    isOpen: boolean;
    onClose: () => void;
}

export const AddToCollectionModal = ({ wordId, wordText, isOpen, onClose }: Props) => {
    const [collections, setCollections] = useState<WordCollection[]>([]);
    const [loading, setLoading] = useState(true);
    const [addingTo, setAddingTo] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        if (isOpen) {
            setLoading(true);
            getUserCollections().then(data => {
                if (isMounted) {
                    setCollections(data);
                    setLoading(false);
                }
            });
        }
        return () => { isMounted = false; };
    }, [isOpen]);

    const handleAdd = async (collectionId: string) => {
        setAddingTo(collectionId);
        const success = await addWordToCollection(collectionId, wordId);
        if (success) {
            setTimeout(() => {
                setAddingTo(null);
            }, 500);
        } else {
            setAddingTo(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border border-zinc-200 dark:border-zinc-800">
                <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                    <h3 className="text-xl font-black flex items-center gap-2">
                        <FolderHeart className="w-5 h-5 text-rose-500" />
                        Listeye Ekle
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400 mb-6">
                        <span className="text-zinc-900 dark:text-zinc-100 italic">&quot;{wordText}&quot;</span> kelimesini hangi listeye eklemek istersiniz?
                    </p>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {loading ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                            </div>
                        ) : collections.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-sm text-zinc-400 font-medium mb-4">Henüz hiç listeniz yok.</p>
                                <button
                                    onClick={() => window.location.href = '/listelerim'}
                                    className="text-indigo-500 font-bold text-sm hover:underline"
                                >
                                    Liste Oluşturun →
                                </button>
                            </div>
                        ) : (
                            collections.map(col => {
                                const isAdded = col.wordIds.includes(wordId);
                                return (
                                    <button
                                        key={col.id}
                                        disabled={addingTo !== null || isAdded}
                                        onClick={() => handleAdd(col.id)}
                                        className={`w-full flex items-center justify-between p-4 rounded-2xl font-bold text-sm transition-all ${isAdded
                                            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20"
                                            : "bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-transparent"
                                            }`}
                                    >
                                        <span>{col.name}</span>
                                        {addingTo === col.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : isAdded ? (
                                            <Check className="w-4 h-4" />
                                        ) : (
                                            <Plus className="w-4 h-4 opacity-40" />
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 text-sm font-black text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                    >
                        Kapat
                    </button>
                </div>
            </div>
        </div>
    );
};
