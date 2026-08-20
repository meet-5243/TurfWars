import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const OwnerRoute = ({ children }) => {
  const { isAuthenticated, isOwner, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080c14]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated || !isOwner) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default OwnerRoute;
