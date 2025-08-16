import React, { createContext, useState, useContext, useEffect } from 'react';
import API_BASE from '../apiConfig';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            const token = localStorage.getItem('token');

            if (!token) {
                setCurrentUser(null);
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`${API_BASE}/user/profile`, {
                    method: 'GET',
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!response.ok) {
                    const text = await response.text();
                    console.error(`Perfil no cargado (${response.status}):`, text);
                    localStorage.removeItem('token');
                    localStorage.removeItem('userData');
                    setCurrentUser(null);
                    return; // ← evita throw capturado localmente
                }

                const user = await response.json();
                setCurrentUser(user);
                localStorage.setItem('userData', JSON.stringify(user));
            } catch (error) {
                console.error('❌ Error al cargar perfil:', error);
                localStorage.removeItem('token');
                localStorage.removeItem('userData');
                setCurrentUser(null);
            } finally {
                setLoading(false);
            }
        };

        void fetchUserData(); // ← evitamos advertencia de promesa ignorada
    }, []);

    const login = async (email, password) => {
        try {
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correo: email, contrasenia: password }),
            });

            if (!response.ok) {
                const text = await response.text();
                return { success: false, error: text || 'Error al iniciar sesión' };
            }

            const data = await response.json();
            localStorage.setItem('token', data.token);

            // Cargar perfil después de login
            const profileRes = await fetch(`${API_BASE}/user/profile`, {
                method: 'GET',
                headers: { Authorization: `Bearer ${data.token}` },
            });

            if (!profileRes.ok) {
                const t = await profileRes.text();
                localStorage.removeItem('token');
                localStorage.removeItem('userData');
                return { success: false, error: t || 'No se pudo cargar el perfil' };
            }

            const profileData = await profileRes.json();
            setCurrentUser(profileData);
            localStorage.setItem('userData', JSON.stringify(profileData));

            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const register = async (userData) => {
        try {
            const response = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData),
            });

            if (!response.ok) {
                const text = await response.text();
                console.error(`❌ Error ${response.status} ${response.statusText}:`, text);
                return { success: false, error: `(${response.status}) ${text || 'Error al registrarse'}` };
            }

            // Puede venir JSON o texto
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                return { success: true, message: text, requireLogin: true };
            }

            const data = await response.json();

            if (data && data.token) {
                localStorage.setItem('token', data.token);

                // Datos básicos si aún no hay endpoint de perfil tras registro
                const basicUserData = {
                    nombre: userData.nombre,
                    correo: userData.correo,
                    especialidad: userData.especialidad,
                    isAuthenticated: true,
                };

                localStorage.setItem('userData', JSON.stringify(basicUserData));
                setCurrentUser(basicUserData);
                return { success: true };
            }

            return { success: true, requireLogin: true };
        } catch (error) {
            console.error('Error en registro:', error);
            return { success: false, error: error.message };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        setCurrentUser(null);
    };

    const value = {
        currentUser,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!currentUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
