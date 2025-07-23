'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
    isAuthenticated: boolean;
    accessToken: string | null;
    login: (token: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    accessToken: null,
    login: () => {},
    logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [accessToken, setAccessToken] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            setAccessToken(token);
        }
    }, []);

    const login = (token: string) => {
        localStorage.setItem('accessToken', token);
        setAccessToken(token);
    };

    const logout = () => {
        localStorage.removeItem('accessToken');
        setAccessToken(null);
    };

    return (
        <AuthContext.Provider value={{
            isAuthenticated: !!accessToken,
            accessToken,
            login,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
};
