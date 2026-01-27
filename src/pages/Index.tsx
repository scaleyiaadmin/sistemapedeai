import React, { useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import Dashboard from '@/components/dashboard/Dashboard';
import { Navigate } from 'react-router-dom';

const AppContent: React.FC = () => {
  const { isAuthenticated, loadingData } = useApp();

  if (loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />;
};

const Index: React.FC = () => <AppContent />;

export default Index;
