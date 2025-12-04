import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Ticket, 
  HardDrive, 
  Building2, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const Dashboard = () => {
  const { getAuthHeader } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/stats`, {
        headers: getAuthHeader()
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-600 text-lg">Cargando estadísticas...</div>
      </div>
    );
  }

  const ticketTypeData = stats?.tickets?.by_type ? [
    { name: 'Incidentes', value: stats.tickets.by_type.incident },
    { name: 'Solicitudes', value: stats.tickets.by_type.request },
    { name: 'Mantenimiento', value: stats.tickets.by_type.maintenance }
  ] : [];

  const ticketStatusData = [
    { name: 'Abiertos', value: stats?.tickets?.open || 0 },
    { name: 'En Progreso', value: stats?.tickets?.in_progress || 0 },
    { name: 'Resueltos', value: stats?.tickets?.resolved || 0 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Dashboard
        </h1>
        <p className="text-slate-600 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
          Vista general del sistema ITSM
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-lg transition-shadow" data-testid="stats-tickets-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600" style={{ fontFamily: 'Inter, sans-serif' }}>Total Tickets</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">{stats?.tickets?.total || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Ticket className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center space-x-4 text-xs">
            <span className="flex items-center text-green-600">
              <CheckCircle className="w-4 h-4 mr-1" />
              {stats?.tickets?.resolved || 0} Resueltos
            </span>
            <span className="flex items-center text-yellow-600">
              <Clock className="w-4 h-4 mr-1" />
              {stats?.tickets?.open || 0} Abiertos
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-lg transition-shadow" data-testid="stats-assets-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600" style={{ fontFamily: 'Inter, sans-serif' }}>Total Activos</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">{stats?.assets?.total || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <HardDrive className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center space-x-4 text-xs">
            <span className="flex items-center text-green-600">
              <CheckCircle className="w-4 h-4 mr-1" />
              {stats?.assets?.active || 0} Activos
            </span>
            <span className="flex items-center text-red-600">
              <AlertCircle className="w-4 h-4 mr-1" />
              {stats?.assets?.in_repair || 0} En Reparación
            </span>
          </div>
        </div>

        {stats?.companies > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-lg transition-shadow" data-testid="stats-companies-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600" style={{ fontFamily: 'Inter, sans-serif' }}>Empresas</p>
                <p className="text-3xl font-bold text-slate-800 mt-2">{stats?.companies || 0}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-slate-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              Clientes registrados
            </div>
          </div>
        )}

        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
          <div>
            <p className="text-sm text-blue-100" style={{ fontFamily: 'Inter, sans-serif' }}>Tickets en Progreso</p>
            <p className="text-3xl font-bold mt-2">{stats?.tickets?.in_progress || 0}</p>
          </div>
          <div className="mt-4 flex items-center text-xs text-blue-100">
            <Clock className="w-4 h-4 mr-1" />
            Requieren atención
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Tickets por Estado
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ticketStatusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Tickets por Tipo
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={ticketTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {ticketTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      {stats?.recent_tickets && stats.recent_tickets.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Actividad Reciente
          </h3>
          <div className="space-y-3">
            {stats.recent_tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    ticket.status === 'open' ? 'bg-yellow-500' :
                    ticket.status === 'in_progress' ? 'bg-blue-500' :
                    'bg-green-500'
                  }`} />
                  <div>
                    <p className="font-medium text-slate-800" style={{ fontFamily: 'Inter, sans-serif' }}>{ticket.title}</p>
                    <p className="text-xs text-slate-600">
                      {new Date(ticket.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  ticket.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                  ticket.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {ticket.status === 'open' ? 'Abierto' :
                   ticket.status === 'in_progress' ? 'En Progreso' :
                   'Resuelto'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
