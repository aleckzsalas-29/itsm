import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Plus, Trash2, Package, Pencil, Calendar, DollarSign } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Services = () => {
  const { getAuthHeader, user } = useAuth();
  const [services, setServices] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    company_id: '',
    service_type: '',
    service_name: '',
    description: '',
    start_date: '',
    expiration_date: '',
    billing_period: '',
    cost: '',
    external_provider: '',
    associated_domain: '',
    panel_access_data: '',
    licenses_quantity: ''
  });

  useEffect(() => {
    fetchServices();
    if (user?.role !== 'client') {
      fetchCompanies();
    }
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

  const fetchCompanies = async () => {
    try {
      const response = await axios.get(`${API}/companies`, {
        headers: getAuthHeader()
      });
      setCompanies(response.data);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingService) {
        await axios.put(`${API}/services/${editingService.id}`, formData, {
          headers: getAuthHeader()
        });
        toast.success('Servicio actualizado exitosamente');
      } else {
        await axios.post(`${API}/services`, formData, {
          headers: getAuthHeader()
        });
        toast.success('Servicio creado exitosamente');
      }
      setDialogOpen(false);
      resetForm();
      fetchServices();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al guardar servicio');
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      company_id: service.company_id,
      service_type: service.service_type || '',
      service_name: service.service_name || '',
      description: service.description || '',
      start_date: service.start_date || '',
      expiration_date: service.expiration_date || '',
      billing_period: service.billing_period || '',
      cost: service.cost || '',
      external_provider: service.external_provider || '',
      associated_domain: service.associated_domain || '',
      panel_access_data: service.panel_access_data || '',
      licenses_quantity: service.licenses_quantity || ''
    });
    setDialogOpen(true);
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
      company_id: '',
      service_type: '',
      service_name: '',
      description: '',
      start_date: '',
      expiration_date: '',
      billing_period: '',
      cost: '',
      external_provider: '',
      associated_domain: '',
      panel_access_data: '',
      licenses_quantity: ''
    });
    setEditingService(null);
  };

  const getCompanyName = (companyId) => {
    const company = companies.find(c => c.id === companyId);
    return company ? company.name : 'Desconocido';
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
            Servicios Contratados
          </h1>
          <p className="text-slate-600 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            Gestiona los servicios contratados por empresa
          </p>
        </div>
        {user?.role !== 'client' && (
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
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingService ? 'Editar Servicio' : 'Nuevo Servicio Contratado'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="basic">Básico</TabsTrigger>
                    <TabsTrigger value="billing">Facturación</TabsTrigger>
                    <TabsTrigger value="access">Acceso</TabsTrigger>
                  </TabsList>

                  {/* BASIC TAB */}
                  <TabsContent value="basic" className="space-y-4">
                    <div>
                      <Label htmlFor="company_id">Empresa Cliente *</Label>
                      <select
                        id="company_id"
                        data-testid="service-company-select"
                        value={formData.company_id}
                        onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg"
                        required
                      >
                        <option value="">Seleccionar empresa...</option>
                        {companies.map((company) => (
                          <option key={company.id} value={company.id}>{company.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="service_type">Tipo de Servicio</Label>
                        <select
                          id="service_type"
                          value={formData.service_type}
                          onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                          className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg"
                        >
                          <option value="">Seleccionar tipo...</option>
                          <option value="Web Hosting">Web Hosting</option>
                          <option value="VPS">VPS</option>
                          <option value="Email Corporativo">Email Corporativo</option>
                          <option value="Licencias Software">Licencias Software</option>
                          <option value="Dominio">Dominio</option>
                          <option value="Cloud Storage">Cloud Storage</option>
                          <option value="Otro">Otro</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="service_name">Nombre del Servicio *</Label>
                        <Input
                          id="service_name"
                          data-testid="service-name-input"
                          value={formData.service_name}
                          onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                          placeholder="ej. Plan Premium Hosting"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="description">Descripción Detallada</Label>
                      <textarea
                        id="description"
                        data-testid="service-description-input"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg min-h-[100px]"
                        placeholder="Describe las características del servicio..."
                      />
                    </div>
                  </TabsContent>

                  {/* BILLING TAB */}
                  <TabsContent value="billing" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="start_date">Fecha Inicio Contrato</Label>
                        <Input
                          id="start_date"
                          type="date"
                          value={formData.start_date}
                          onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="expiration_date">Fecha Vencimiento</Label>
                        <Input
                          id="expiration_date"
                          type="date"
                          value={formData.expiration_date}
                          onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="billing_period">Periodo de Facturación</Label>
                        <select
                          id="billing_period"
                          value={formData.billing_period}
                          onChange={(e) => setFormData({ ...formData, billing_period: e.target.value })}
                          className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg"
                        >
                          <option value="">Seleccionar periodo...</option>
                          <option value="Mensual">Mensual</option>
                          <option value="Trimestral">Trimestral</option>
                          <option value="Semestral">Semestral</option>
                          <option value="Anual">Anual</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="cost">Costo (Mensual o Total)</Label>
                        <Input
                          id="cost"
                          value={formData.cost}
                          onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                          placeholder="ej. $50 USD/mes"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="external_provider">Proveedor Externo</Label>
                      <Input
                        id="external_provider"
                        value={formData.external_provider}
                        onChange={(e) => setFormData({ ...formData, external_provider: e.target.value })}
                        placeholder="ej. Amazon AWS, Google Cloud, HostGator"
                      />
                    </div>
                  </TabsContent>

                  {/* ACCESS TAB */}
                  <TabsContent value="access" className="space-y-4">
                    <div>
                      <Label htmlFor="associated_domain">Dominio Asociado</Label>
                      <Input
                        id="associated_domain"
                        value={formData.associated_domain}
                        onChange={(e) => setFormData({ ...formData, associated_domain: e.target.value })}
                        placeholder="ej. example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="panel_access_data">Datos de Acceso al Panel</Label>
                      <textarea
                        id="panel_access_data"
                        value={formData.panel_access_data}
                        onChange={(e) => setFormData({ ...formData, panel_access_data: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg min-h-[100px]"
                        placeholder="URL del panel, usuario, contraseña, etc."
                      />
                    </div>
                    <div>
                      <Label htmlFor="licenses_quantity">Cantidad de Licencias</Label>
                      <Input
                        id="licenses_quantity"
                        type="number"
                        value={formData.licenses_quantity}
                        onChange={(e) => setFormData({ ...formData, licenses_quantity: e.target.value })}
                        placeholder="ej. 10"
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" data-testid="service-submit-button" className="bg-blue-600 hover:bg-blue-700 text-white">
                    {editingService ? 'Actualizar' : 'Crear'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {services.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <Package className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">No hay servicios contratados</h3>
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
                  <div>
                    <h3 className="font-semibold text-slate-800" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {service.service_name}
                    </h3>
                    {service.service_type && (
                      <p className="text-xs text-slate-600">{service.service_type}</p>
                    )}
                  </div>
                </div>
                {user?.role !== 'client' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(service)}
                      data-testid={`edit-service-${service.id}`}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(service.id)}
                      data-testid={`delete-service-${service.id}`}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <div className="space-y-2 text-sm">
                {user?.role === 'admin' && (
                  <div>
                    <span className="text-slate-600">Empresa:</span>
                    <p className="font-medium text-slate-800">{getCompanyName(service.company_id)}</p>
                  </div>
                )}
                {service.description && (
                  <div>
                    <span className="text-slate-600">Descripción:</span>
                    <p className="text-slate-800 text-xs">{service.description.substring(0, 100)}...</p>
                  </div>
                )}
                {service.cost && (
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-600">{service.cost}</span>
                  </div>
                )}
                {service.billing_period && (
                  <div>
                    <span className="text-slate-600">Facturación:</span>
                    <p className="text-slate-800">{service.billing_period}</p>
                  </div>
                )}
                {service.expiration_date && (
                  <div className="flex items-center space-x-2 text-xs">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="text-slate-600">Vence: {service.expiration_date}</span>
                  </div>
                )}
                {service.external_provider && (
                  <div>
                    <span className="text-slate-600">Proveedor:</span>
                    <p className="text-slate-800 text-xs">{service.external_provider}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Services;
