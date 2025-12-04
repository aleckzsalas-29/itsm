import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Trash2, Users as UsersIcon, Shield, Wrench, User } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Users = () => {
  const { getAuthHeader } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/users`, {
        headers: getAuthHeader()
      });
      setUsers(response.data);
    } catch (error) {
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este usuario?')) return;
    
    try {
      await axios.delete(`${API}/users/${id}`, {
        headers: getAuthHeader()
      });
      toast.success('Usuario eliminado exitosamente');
      fetchUsers();
    } catch (error) {
      toast.error('Error al eliminar usuario');
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <Shield className="w-5 h-5 text-purple-600" />;
      case 'technician': return <Wrench className="w-5 h-5 text-blue-600" />;
      case 'client': return <User className="w-5 h-5 text-green-600" />;
      default: return <User className="w-5 h-5 text-slate-600" />;
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'technician': return 'Técnico';
      case 'client': return 'Cliente';
      default: return role;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-purple-100';
      case 'technician': return 'bg-blue-100';
      case 'client': return 'bg-green-100';
      default: return 'bg-slate-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-600 text-lg">Cargando usuarios...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Usuarios
          </h1>
          <p className="text-slate-600 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            Gestiona los usuarios del sistema
          </p>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <UsersIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">No hay usuarios registrados</h3>
          <p className="text-slate-600">Los usuarios pueden registrarse desde la página de login</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <div
              key={user.id}
              data-testid={`user-card-${user.id}`}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getRoleColor(user.role)}`}>
                    {getRoleIcon(user.role)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {user.name}
                    </h3>
                    <p className="text-xs text-slate-600">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(user.id)}
                  data-testid={`delete-user-${user.id}`}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-slate-600">Rol:</span>
                  <p className={`font-medium inline-block px-2 py-1 rounded-full text-xs ml-2 ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                    user.role === 'technician' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {getRoleLabel(user.role)}
                  </p>
                </div>
                <div>
                  <span className="text-slate-600">Fecha de registro:</span>
                  <p className="font-medium text-slate-800 text-xs">
                    {new Date(user.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Users;
