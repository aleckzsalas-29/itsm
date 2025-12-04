import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { LayoutDashboard } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'client'
  });
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(loginData.email, loginData.password);
      toast.success('¡Bienvenido!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(registerData);
      toast.success('¡Cuenta creada exitosamente!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl mb-4 shadow-lg shadow-blue-500/50">
            <LayoutDashboard className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            ITSM Pro
          </h1>
          <p className="text-blue-200" style={{ fontFamily: 'Inter, sans-serif' }}>
            Sistema de Gestión de Servicios TI
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-8">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login" data-testid="login-tab">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="register" data-testid="register-tab">Registrarse</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    data-testid="login-email-input"
                    type="email"
                    placeholder="tu@email.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="login-password">Contraseña</Label>
                  <Input
                    id="login-password"
                    data-testid="login-password-input"
                    type="password"
                    placeholder="••••••••"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                    className="mt-2"
                  />
                </div>
                <Button
                  type="submit"
                  data-testid="login-submit-button"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-xl font-medium shadow-lg shadow-blue-600/30 transition-all"
                >
                  {loading ? 'Iniciando...' : 'Iniciar Sesión'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-6">
                <div>
                  <Label htmlFor="register-name">Nombre Completo</Label>
                  <Input
                    id="register-name"
                    data-testid="register-name-input"
                    type="text"
                    placeholder="Juan Pérez"
                    value={registerData.name}
                    onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                    required
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    data-testid="register-email-input"
                    type="email"
                    placeholder="tu@email.com"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    required
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="register-password">Contraseña</Label>
                  <Input
                    id="register-password"
                    data-testid="register-password-input"
                    type="password"
                    placeholder="••••••••"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    required
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="register-role">Rol</Label>
                  <select
                    id="register-role"
                    data-testid="register-role-select"
                    value={registerData.role}
                    onChange={(e) => setRegisterData({ ...registerData, role: e.target.value })}
                    className="w-full mt-2 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="client">Cliente</option>
                    <option value="technician">Técnico</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <Button
                  type="submit"
                  data-testid="register-submit-button"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-xl font-medium shadow-lg shadow-blue-600/30 transition-all"
                >
                  {loading ? 'Registrando...' : 'Crear Cuenta'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        <div className="text-center mt-6 text-blue-200 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
          <p>© 2025 ITSM Pro. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
