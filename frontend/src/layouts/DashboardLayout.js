import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Building2, 
  HardDrive, 
  Ticket, 
  Package, 
  FileText, 
  Users, 
  Settings, 
  LogOut,
  Menu,
  X,
  Bell
} from 'lucide-react';
import { Button } from '../components/ui/button';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DashboardLayout = () => {
  const { user, logout, getAuthHeader } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [showAlerts, setShowAlerts] = useState(false);

  React.useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 300000); // Check every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await axios.get(`${API}/alerts/sla`, {
        headers: getAuthHeader()
      });
      setAlerts(response.data);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/', roles: ['admin', 'technician', 'client'] },
    { icon: Building2, label: 'Empresas', path: '/companies', roles: ['admin', 'technician'] },
    { icon: HardDrive, label: 'Activos', path: '/assets', roles: ['admin', 'technician', 'client'] },
    { icon: Ticket, label: 'Tickets', path: '/tickets', roles: ['admin', 'technician', 'client'] },
    { icon: Package, label: 'Servicios', path: '/services', roles: ['admin'] },
    { icon: FileText, label: 'Contratos', path: '/contracts', roles: ['admin', 'client'] },
    { icon: Users, label: 'Usuarios', path: '/users', roles: ['admin'] },
    { icon: Settings, label: 'Configuración', path: '/system-config', roles: ['admin'] },
  ];

  const filteredMenuItems = menuItems.filter(item => item.roles.includes(user?.role));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-slate-900 to-slate-800 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-slate-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white" style={{ fontFamily: 'Inter, sans-serif' }}>ITSM Pro</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* User Info */}
          <div className="px-6 py-4 bg-slate-800/50">
            <div className="text-sm text-slate-400">Bienvenido</div>
            <div className="text-white font-medium truncate" style={{ fontFamily: 'Inter, sans-serif' }}>{user?.name}</div>
            <div className="text-xs text-blue-400 capitalize">{user?.role}</div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-slate-700">
            <Button
              onClick={handleLogout}
              data-testid="logout-button"
              className="w-full flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-3 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span style={{ fontFamily: 'Inter, sans-serif' }}>Cerrar Sesión</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-600 hover:text-slate-900"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Sistema ITSM
            </div>
            <div className="relative">
              <button
                onClick={() => setShowAlerts(!showAlerts)}
                data-testid="alerts-button"
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Bell className="w-6 h-6" />
                {alerts.length > 0 && (
                  <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {alerts.length}
                  </span>
                )}
              </button>
              {showAlerts && alerts.length > 0 && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-slate-200 p-4 z-50">
                  <div className="text-sm font-semibold text-slate-800 mb-3">Alertas SLA</div>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {alerts.map((alert, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          alert.status === 'breached'
                            ? 'bg-red-50 border-red-200'
                            : 'bg-yellow-50 border-yellow-200'
                        }`}
                      >
                        <div className="text-sm font-medium text-slate-800">{alert.ticket_title}</div>
                        <div className="text-xs text-slate-600 mt-1">
                          {alert.status === 'breached'
                            ? `Vencido: ${alert.hours_overdue.toFixed(1)} horas`
                            : `Restante: ${alert.hours_remaining.toFixed(1)} horas`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;
