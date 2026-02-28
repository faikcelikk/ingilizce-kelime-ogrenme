export interface WordCollection {
    id: string;
    name: string;
    description?: string;
    wordIds: string[];
    createdAt: string;
    updatedAt: string;
}

/**
 * Tüm koleksiyonları getirir
 */
export const getUserCollections = async (): Promise<WordCollection[]> => {
    try {
        const res = await fetch("/api/collections");
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
    } catch (error) {
        console.error("Error fetching collections:", error);
        return [];
    }
};

/**
 * Koleksiyon oluşturur ya da günceller, oluşturulan id'yi döner
 */
export const saveCollection = async (
    collectionData: Partial<WordCollection>
): Promise<string | null> => {
    try {
        const res = await fetch("/api/collections", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(collectionData),
        });
        if (!res.ok) throw new Error("Failed to save");
        const { id } = await res.json();
        return id;
    } catch (error) {
        console.error("Error saving collection:", error);
        return null;
    }
};

/**
 * Koleksiyonu siler
 */
export const deleteCollection = async (collectionId: string): Promise<boolean> => {
    try {
        const res = await fetch(`/api/collections/${collectionId}`, { method: "DELETE" });
        return res.ok;
    } catch (error) {
        console.error("Error deleting collection:", error);
        return false;
    }
};

/**
 * Koleksiyona kelime ekler
 */
export const addWordToCollection = async (
    collectionId: string,
    wordId: string
): Promise<boolean> => {
    try {
        const res = await fetch(`/api/collections/${collectionId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ wordId, action: "add" }),
        });
        return res.ok;
    } catch (error) {
        console.error("Error adding word to collection:", error);
        return false;
    }
};

/**
 * Koleksiyondan kelime çıkarır
 */
export const removeWordFromCollection = async (
    collectionId: string,
    wordId: string
): Promise<boolean> => {
    try {
        const res = await fetch(`/api/collections/${collectionId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ wordId, action: "remove" }),
        });
        return res.ok;
    } catch (error) {
        console.error("Error removing word from collection:", error);
        return false;
    }
};
