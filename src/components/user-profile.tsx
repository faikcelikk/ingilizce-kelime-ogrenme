"use client";

import { useState } from "react";
import { Settings, Trash2 } from "lucide-react";
import { resetProgressAndStats } from "@/utils/storage";

export const UserProfile = () => {
    const [isOpen, setIsOpen] = useState(false);

    const handleReset = () => {
        if (confirm("Tüm istatistiklerinizi ve ilerlemenizi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.")) {
            resetProgressAndStats();
            window.location.reload();
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition shadow-sm text-zinc-600 dark:text-zinc-400"
                title="Ayarlar"
            >
                <Settings className="w-5 h-5" />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                handleReset();
                            }}
                            className="w-full flex items-center justify-start gap-3 px-4 py-3 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition"
                        >
                            <Trash2 className="w-4 h-4" />
                            İlerlemeyi Sıfırla
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};
