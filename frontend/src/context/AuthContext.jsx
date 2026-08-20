import React, { createContext, useState, useEffect, useContext } from 'react';
import axiosInstance from '../api/axiosInstance';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await axiosInstance.get('/auth/profile');
      if (res.data.success) {
        setUser(res.data.data);
      } else {
        localStorage.removeItem('token');
        setUser(null);
      }
    } catch (err) {
      console.error('Error fetching profile:', err.message);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await axiosInstance.post('/auth/login', { email, password });
      if (res.data.success) {
        localStorage.setItem('token', res.data.data.token);
        setUser({
          _id: res.data.data._id,
          name: res.data.data.name,
          email: res.data.data.email,
          phone: res.data.data.phone,
          role: res.data.data.role,
        });
        return res.data;
      }
    } catch (err) {
      throw err.response?.data?.message || 'Login failed';
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name, email, password, phone, role) => {
    setLoading(true);
    try {
      const res = await axiosInstance.post('/auth/register', { name, email, password, phone, role });
      if (res.data.success) {
        localStorage.setItem('token', res.data.data.token);
        setUser({
          _id: res.data.data._id,
          name: res.data.data.name,
          email: res.data.data.email,
          phone: res.data.data.phone,
          role: res.data.data.role,
        });
        return res.data;
      }
    } catch (err) {
      throw err.response?.data?.message || 'Registration failed';
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData) => {
    setLoading(true);
    try {
      const res = await axiosInstance.put('/auth/profile', profileData);
      if (res.data.success) {
        if (res.data.data.token) {
          localStorage.setItem('token', res.data.data.token);
        }
        setUser({
          _id: res.data.data._id,
          name: res.data.data.name,
          email: res.data.data.email,
          phone: res.data.data.phone,
          role: res.data.data.role,
        });
        return res.data;
      }
    } catch (err) {
      throw err.response?.data?.message || 'Profile update failed';
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const isAuthenticated = !!user;
  const isOwner = user?.role === 'owner';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        updateProfile,
        logout,
        isAuthenticated,
        isOwner,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
