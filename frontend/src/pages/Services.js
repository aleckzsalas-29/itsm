import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Plus, Trash2, Package } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Services = () => {
  const { getAuthHeader } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await axios.get(`${API}/services`, {
        headers: getAuthHeader()
      });
      setServices(response.data);
    } catch (error) {
      toast.error('Error al cargar servicios');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/services`, formData, {
        headers: getAuthHeader()
      });
      toast.success('Servicio creado exitosamente');
      setDialogOpen(false);
      resetForm();
      fetchServices();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al crear servicio');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este servicio?')) return;
    
    try {
      await axios.delete(`${API}/services/${id}`, {
        headers: getAuthHeader()
      });
      toast.success('Servicio eliminado exitosamente');
      fetchServices();
    } catch (error) {
      toast.error('Error al eliminar servicio');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: ''
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-600 text-lg">Cargando servicios...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Servicios
          </h1>
          <p className="text-slate-600 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            Catálogo de servicios disponibles
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button data-testid="add-service-button" className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Servicio
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo Servicio</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre del Servicio</Label>
                <Input
                  id="name"
                  data-testid="service-name-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ej. Web Hosting, VPS, Correo Electrónico"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Descripción</Label>
                <textarea
                  id="description"
                  data-testid="service-description-input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg min-h-[100px]"
                  placeholder="Describe el servicio..."
                  required
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" data-testid="service-submit-button" className="bg-blue-600 hover:bg-blue-700 text-white">
                  Crear Servicio
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {services.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <Package className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">No hay servicios registrados</h3>
          <p className="text-slate-600">Comienza agregando tu primer servicio</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div
              key={service.id}
              data-testid={`service-card-${service.id}`}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-slate-800" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {service.name}
                  </h3>
                </div>
                <button
                  onClick={() => handleDelete(service.id)}
                  data-testid={`delete-service-${service.id}`}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-slate-600 text-sm">{service.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Services;
