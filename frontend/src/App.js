import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import '@/App.css';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Companies from './pages/Companies';
import Assets from './pages/Assets';
import Tickets from './pages/Tickets';
import Services from './pages/Services';
import Contracts from './pages/Contracts';
import Users from './pages/Users';
import SystemConfig from './pages/SystemConfig';
import { AuthProvider, useAuth } from './context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={
            <PrivateRoute>
              <DashboardLayout />
            </PrivateRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="companies" element={<Companies />} />
            <Route path="assets" element={<Assets />} />
            <Route path="tickets" element={<Tickets />} />
            <Route path="services" element={<Services />} />
            <Route path="contracts" element={<Contracts />} />
            <Route path="users" element={<Users />} />
            <Route path="system-config" element={<SystemConfig />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}

export default App;
