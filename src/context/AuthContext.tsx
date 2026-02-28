"use client";

/**
 * AuthContext artık Firebase kullanmıyor.
 * Uygulama yerel (single-user) modda çalışır.
 * Bu context ileride yerel kullanıcı tercihleri için genişletilebilir.
 */

import React, { createContext, useContext } from "react";

interface AuthContextType {
    isReady: boolean;
}

const AuthContext = createContext<AuthContextType>({ isReady: true });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    return (
        <AuthContext.Provider value={{ isReady: true }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
