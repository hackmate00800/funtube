import React, { createContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

export const AuthContext = createContext();

const normalizeUser = (user) => {
  if (!user) return null;
  return {
    ...user,
    subscribedChannels: Array.isArray(user.subscribedChannels) ? user.subscribedChannels : [],
    subscribers: Array.isArray(user.subscribers) ? user.subscribers : [],
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const setUser = useCallback((u) => setUserState(normalizeUser(u)), []);

  const loadUser = useCallback(async () => {
    try {
      const { data } = await authAPI.getMe();
      setUser(data.data);
      if (data.data) {
        localStorage.setItem('user', JSON.stringify(data.data));
      }
    } catch (err) {
      const cached = localStorage.getItem('user');
      if (cached) {
        try { setUser(JSON.parse(cached)); } catch {}
      } else {
        setUser(null);
      }
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  }, [setUser]);

  useEffect(() => {
    loadUser();

    const params = new URLSearchParams(window.location.search);
    if (params.get('google-auth') === 'success') {
      window.history.replaceState({}, '', window.location.pathname);
      loadUser();
    }
  }, [loadUser]);

  const login = async (email, password) => {
    setError(null);
    try {
      const { data } = await authAPI.login({ email, password });
      if (data.token) localStorage.setItem('token', data.token);
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
      }
      return data;
    } catch (err) {
      const message = err.response?.data?.error || err.response?.data?.message || 'Login failed';
      setError(message);
      throw new Error(message);
    }
  };

  const register = async (username, email, password) => {
    setError(null);
    try {
      const { data } = await authAPI.register({ username, email, password, confirmPassword: password });
      if (data.token) localStorage.setItem('token', data.token);
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
      }
      return data;
    } catch (err) {
      const message = err.response?.data?.error || err.response?.data?.message || 'Registration failed';
      setError(message);
      throw new Error(message);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch {
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  const updateProfile = async (profileData) => {
    const { data } = await authAPI.updateProfile(profileData);
    const updated = normalizeUser(data.data);
    setUser(updated);
    localStorage.setItem('user', JSON.stringify(updated));
    return data;
  };

  const subscribe = async (channelId) => {
    const { data } = await authAPI.subscribe(channelId);
    if (user) {
      const updated = { ...user };
      const channels = [...(updated.subscribedChannels || [])];
      const strId = String(channelId);
      const idx = channels.findIndex((c) => String(c._id || c.id || c) === strId);
      if (data.isSubscribed) {
        if (idx === -1) channels.push(channelId);
      } else {
        if (idx !== -1) channels.splice(idx, 1);
      }
      updated.subscribedChannels = channels;
      setUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
    }
    return data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        updateProfile,
        subscribe,
        loadUser,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
