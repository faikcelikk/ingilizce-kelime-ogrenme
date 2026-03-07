"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Edit2, Trash2, Save, X, Database, Volume2, FolderHeart } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { playAudio } from "@/utils/speech";
import { AddToCollectionModal } from "@/components/add-to-collection-modal";

type Level = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

interface Word {
    id: string;
    english: string;
    turkish: string;
    alternativeMeanings?: string[]; // Yan anlamlar: ["hala", "teyze"]
    level: string;
    tags: string[];
    example: string;
}

export default function AdminPage() {
    const [words, setWords] = useState<Word[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Editing state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Word>>({});
    const [selectedWordToAdd, setSelectedWordToAdd] = useState<{ id: string, english: string } | null>(null);

    // New Word state
    const [isAdding, setIsAdding] = useState(false);

    // Filter state
    const [selectedLevelTab, setSelectedLevelTab] = useState<Level>("A1");

    useEffect(() => {
        fetchWords();
    }, []);

    const fetchWords = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/words');
            const data = await res.json();
            setWords(data);
        } catch (error) {
            console.error("Failed to fetch words:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bu kelimeyi silmek istediğinize emin misiniz?")) return;
        try {
            setSaving(true);
            await fetch(`/api/words/${id}`, { method: 'DELETE' });
            setWords(prev => prev.filter(w => w.id !== id));
        } catch {
            alert("Kelime silinirken bir hata oluştu.");
        } finally {
            setSaving(false);
        }
    };

    const handleEditStart = (word: Word) => {
        setEditingId(word.id);
        setEditForm(word);
        setIsAdding(false);
    };

    const handleEditCancel = () => {
        setEditingId(null);
        setEditForm({});
    };

    const handleEditSave = async () => {
        if (!editForm.english || !editForm.turkish || !editForm.level) {
            alert("Lütfen zorunlu alanları (İngilizce, Türkçe, Seviye) doldurun.");
            return;
        }
        try {
            setSaving(true);
            await fetch(`/api/words/${editingId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ english: editForm.english, turkish: editForm.turkish, level: editForm.level }),
            });
            setWords(prev => prev.map(w => w.id === editingId ? { ...w, ...editForm } as Word : w));
            setEditingId(null);
            setEditForm({});
        } catch {
            alert("Kelime kaydedilirken bir hata oluştu.");
        } finally {
            setSaving(false);
        }
    };

    const handleAddStart = () => {
        setIsAdding(true);
        setEditingId(null);
        setEditForm({
            id: `word_${Date.now()}`,
            english: "",
            turkish: "",
            level: selectedLevelTab,
            tags: [],
            example: ""
        });
    };

    const handleAddSave = async () => {
        if (!editForm.english || !editForm.turkish || !editForm.level) {
            alert("Lütfen zorunlu alanları (İngilizce, Türkçe, Seviye) doldurun.");
            return;
        }
        try {
            setSaving(true);
            const res = await fetch('/api/words', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ english: editForm.english, turkish: editForm.turkish, level: editForm.level, example: editForm.example }),
            });
            const saved = await res.json();
            setWords(prev => [saved, ...prev]);
            setIsAdding(false);
            setEditForm({});
        } catch {
            alert("Kelime eklenirken bir hata oluştu.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50 via-white to-zinc-50 dark:from-indigo-950/20 dark:via-zinc-950 dark:to-zinc-950 p-6 font-sans text-zinc-900 dark:text-zinc-100 pb-20">
            <div className="w-full max-w-5xl mx-auto mt-6">

                {/* Header Navigation */}
                <div className="mb-10 flex items-start sm:items-center gap-4 justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <button className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full hover:bg-zinc-100 hover:scale-105 active:scale-95 dark:hover:bg-zinc-800 transition shadow-sm">
                                <ArrowLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                            </button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2 bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400">
                                <Database className="w-8 h-8 text-indigo-500" />
                                Kelime Havuzu Yönetimi
                            </h1>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Sistemdeki tüm kelimeleri ekleyin, silin ve düzenleyin ({words.length} kelime).</p>
                        </div>
                    </div>
                    <ThemeToggle />
                </div>

                <div className="mb-6 flex overflow-x-auto pb-4 gap-3 snap-x scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700">
                    {(["A1", "A2", "B1", "B2", "C1", "C2"] as const).map(lvl => {
                        const count = words.filter(w => w.level === lvl).length;
                        return (
                            <button
                                key={lvl}
                                onClick={() => setSelectedLevelTab(lvl)}
                                className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap snap-start flex border ${selectedLevelTab === lvl
                                    ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105"
                                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white"
                                    }`}
                            >
                                {lvl} Seviyesi
                                <span className={`ml-3 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-black ${selectedLevelTab === lvl ? "bg-white/20 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                                    }`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="mb-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                        {selectedLevelTab} Kelimeleri
                    </h2>
                    {!isAdding && (
                        <button
                            onClick={handleAddStart}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/30 transition-all active:scale-95"
                        >
                            <Plus className="w-4 h-4" /> Yeni Kelime Ekle
                        </button>
                    )}
                </div>

                <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/50 dark:border-zinc-800/50 rounded-3xl shadow-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 uppercase text-xs font-black text-zinc-500 dark:text-zinc-400 tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">İngilizce</th>
                                    <th className="px-6 py-4">Türkçe</th>
                                    <th className="px-6 py-4">Seviye</th>
                                    <th className="px-6 py-4 w-1/3">Örnek Cümle</th>
                                    <th className="px-6 py-4 text-right">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/50">

                                {/* Arama/Ekleme Satırı */}
                                {isAdding && (
                                    <tr className="bg-indigo-50/50 dark:bg-indigo-500/10">
                                        <td className="px-6 py-4">
                                            <input type="text" placeholder="Kelime (En)" value={editForm.english || ""} onChange={e => setEditForm({ ...editForm, english: e.target.value })} className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none" autoFocus />
                                        </td>
                                        <td className="px-6 py-4">
                                            <input type="text" placeholder="Anlam (Tr)" value={editForm.turkish || ""} onChange={e => setEditForm({ ...editForm, turkish: e.target.value })} className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none" />
                                        </td>
                                        <td className="px-6 py-4">
                                            <input
                                                type="text"
                                                placeholder="Yan anlamlar (virgülle: hala, teyze)"
                                                value={(editForm.alternativeMeanings || []).join(", ")}
                                                onChange={e => setEditForm({ ...editForm, alternativeMeanings: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                                                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-violet-500 outline-none text-violet-700 dark:text-violet-300"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <select value={editForm.level || selectedLevelTab} onChange={e => setEditForm({ ...editForm, level: e.target.value })} className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 outline-none">
                                                <option value="A1">A1</option><option value="A2">A2</option>
                                                <option value="B1">B1</option><option value="B2">B2</option>
                                                <option value="C1">C1</option><option value="C2">C2</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4">
                                            <input type="text" placeholder="Örnek Cümle (Opsiyonel)" value={editForm.example || ""} onChange={e => setEditForm({ ...editForm, example: e.target.value })} className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none" />
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button onClick={handleAddSave} disabled={saving} className="p-2 bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-lg hover:bg-emerald-200 transition"><Save className="w-4 h-4" /></button>
                                            <button onClick={() => setIsAdding(false)} className="p-2 bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 rounded-lg hover:bg-rose-200 transition"><X className="w-4 h-4" /></button>
                                        </td>
                                    </tr>
                                )}

                                {/* Kelime Listesi */}
                                {loading && !isAdding && (
                                    <tr><td colSpan={5} className="px-6 py-8 text-center text-zinc-500">Yükleniyor...</td></tr>
                                )}

                                {!loading && words.filter(w => w.level === selectedLevelTab).map((word, index) => {
                                    const isEditing = editingId === word.id;

                                    return isEditing ? (
                                        <tr key={word.id} className="bg-indigo-50/50 dark:bg-indigo-500/10">
                                            <td className="px-6 py-4">
                                                <input type="text" value={editForm.english || ""} onChange={e => setEditForm({ ...editForm, english: e.target.value })} className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none" autoFocus />
                                            </td>
                                            <td className="px-6 py-4">
                                                <input type="text" value={editForm.turkish || ""} onChange={e => setEditForm({ ...editForm, turkish: e.target.value })} className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none" />
                                            </td>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="text"
                                                    placeholder="hala, teyze..."
                                                    value={(editForm.alternativeMeanings || []).join(", ")}
                                                    onChange={e => setEditForm({ ...editForm, alternativeMeanings: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                                                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-violet-500 outline-none text-violet-700 dark:text-violet-300"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <select value={editForm.level || selectedLevelTab} onChange={e => setEditForm({ ...editForm, level: e.target.value })} className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 outline-none">
                                                    <option value="A1">A1</option><option value="A2">A2</option>
                                                    <option value="B1">B1</option><option value="B2">B2</option>
                                                    <option value="C1">C1</option><option value="C2">C2</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4">
                                                <input type="text" value={editForm.example || ""} onChange={e => setEditForm({ ...editForm, example: e.target.value })} className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none" />
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <button onClick={handleEditSave} disabled={saving} className="p-2 bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-lg hover:bg-emerald-200 transition"><Save className="w-4 h-4" /></button>
                                                <button onClick={handleEditCancel} className="p-2 bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-700 transition"><X className="w-4 h-4" /></button>
                                            </td>
                                        </tr>
                                    ) : (
                                        <tr key={word.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors group">
                                            <td className="px-6 py-4 font-bold text-zinc-900 dark:text-white">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-zinc-400 text-xs font-mono w-8">{index + 1}</span>
                                                    {word.english}
                                                    <button
                                                        onClick={() => playAudio(word.english)}
                                                        className="opacity-0 group-hover:opacity-100 p-1.5 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 rounded-md transition-all"
                                                        title="Sesli Oku"
                                                    >
                                                        <Volume2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-emerald-600 dark:text-emerald-400 font-medium">{word.turkish}</td>
                                            <td className="px-6 py-4">
                                                {word.alternativeMeanings && word.alternativeMeanings.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {word.alternativeMeanings.map((alt, i) => (
                                                            <span key={i} className="text-xs bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded-md font-bold">
                                                                {alt}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : <span className="text-zinc-400 text-xs">—</span>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg text-zinc-600 dark:text-zinc-400 font-bold uppercase tracking-wider">{word.level}</span>
                                            </td>
                                            <td className="px-6 py-4 text-zinc-500 max-w-xs truncate" title={word.example}>{word.example || "-"}</td>
                                            <td className="px-6 py-4 text-right space-x-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => setSelectedWordToAdd({ id: word.id, english: word.english })}
                                                    className="p-2 bg-rose-50 text-rose-500 dark:bg-rose-500/10 dark:text-rose-400 rounded-lg hover:bg-rose-100 transition"
                                                    title="Listeye Ekle"
                                                >
                                                    <FolderHeart className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleEditStart(word)} className="p-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 transition"><Edit2 className="w-4 h-4" /></button>
                                                <button onClick={() => handleDelete(word.id)} className="p-2 bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 rounded-lg hover:bg-rose-100 transition"><Trash2 className="w-4 h-4" /></button>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {!loading && !isAdding && words.filter(w => w.level === selectedLevelTab).length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400">
                                            <div className="flex flex-col items-center justify-center">
                                                <Database className="w-12 h-12 mb-4 opacity-20" />
                                                <p>Bu seviyede henüz kelime bulunmuyor.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modals */}
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
