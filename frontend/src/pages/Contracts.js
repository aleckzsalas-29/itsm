import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Plus, Pencil, Trash2, FileText, Clock } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Contracts = () => {
  const { getAuthHeader, user } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [formData, setFormData] = useState({
    company_id: '',
    service_id: '',
    start_date: '',
    end_date: '',
    sla_hours: '',
    terms: '',
    status: 'active'
  });

  useEffect(() => {
    fetchContracts();
    fetchServices();
    if (user?.role === 'admin') {
      fetchCompanies();
    }
  }, []);

  const fetchContracts = async () => {
    try {
      const response = await axios.get(`${API}/contracts`, {
        headers: getAuthHeader()
      });
      setContracts(response.data);
    } catch (error) {
      toast.error('Error al cargar contratos');
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

  const fetchServices = async () => {
    try {
      const response = await axios.get(`${API}/services`, {
        headers: getAuthHeader()
      });
      setServices(response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingContract) {
        await axios.put(`${API}/contracts/${editingContract.id}`, formData, {
          headers: getAuthHeader()
        });
        toast.success('Contrato actualizado exitosamente');
      } else {
        await axios.post(`${API}/contracts`, formData, {
          headers: getAuthHeader()
        });
        toast.success('Contrato creado exitosamente');
      }
      setDialogOpen(false);
      resetForm();
      fetchContracts();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al guardar contrato');
    }
  };

  const handleEdit = (contract) => {
    setEditingContract(contract);
    setFormData({
      company_id: contract.company_id,
      service_id: contract.service_id,
      start_date: contract.start_date,
      end_date: contract.end_date,
      sla_hours: contract.sla_hours,
      terms: contract.terms,
      status: contract.status
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este contrato?')) return;
    
    try {
      await axios.delete(`${API}/contracts/${id}`, {
        headers: getAuthHeader()
      });
      toast.success('Contrato eliminado exitosamente');
      fetchContracts();
    } catch (error) {
      toast.error('Error al eliminar contrato');
    }
  };

  const resetForm = () => {
    setFormData({
      company_id: '',
      service_id: '',
      start_date: '',
      end_date: '',
      sla_hours: '',
      terms: '',
      status: 'active'
    });
    setEditingContract(null);
  };

  const getServiceName = (serviceId) => {
    const service = services.find(s => s.id === serviceId);
    return service ? service.name : 'Desconocido';
  };

  const getCompanyName = (companyId) => {
    const company = companies.find(c => c.id === companyId);
    return company ? company.name : 'Desconocido';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-600 text-lg">Cargando contratos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Contratos & SLA
          </h1>
          <p className="text-slate-600 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            Gestiona contratos y acuerdos de nivel de servicio
          </p>
        </div>
        {user?.role === 'admin' && (
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button data-testid="add-contract-button" className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Contrato
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingContract ? 'Editar Contrato' : 'Nuevo Contrato'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company_id">Empresa</Label>
                    <select
                      id="company_id"
                      data-testid="contract-company-select"
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
                  <div>
                    <Label htmlFor="service_id">Servicio</Label>
                    <select
                      id="service_id"
                      data-testid="contract-service-select"
                      value={formData.service_id}
                      onChange={(e) => setFormData({ ...formData, service_id: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg"
                      required
                    >
                      <option value="">Seleccionar servicio...</option>
                      {services.map((service) => (
                        <option key={service.id} value={service.id}>{service.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date">Fecha de Inicio</Label>
                    <Input
                      id="start_date"
                      type="date"
                      data-testid="contract-start-date-input"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_date">Fecha de Finalización</Label>
                    <Input
                      id="end_date"
                      type="date"
                      data-testid="contract-end-date-input"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sla_hours">SLA (Horas de Respuesta)</Label>
                    <Input
                      id="sla_hours"
                      type="number"
                      data-testid="contract-sla-input"
                      value={formData.sla_hours}
                      onChange={(e) => setFormData({ ...formData, sla_hours: e.target.value })}
                      placeholder="24"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Estado</Label>
                    <select
                      id="status"
                      data-testid="contract-status-select"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg"
                      required
                    >
                      <option value="active">Activo</option>
                      <option value="expired">Expirado</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="terms">Términos del Contrato</Label>
                  <textarea
                    id="terms"
                    data-testid="contract-terms-input"
                    value={formData.terms}
                    onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg min-h-[120px]"
                    placeholder="Describe los términos del contrato..."
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" data-testid="contract-submit-button" className="bg-blue-600 hover:bg-blue-700 text-white">
                    {editingContract ? 'Actualizar' : 'Crear'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {contracts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">No hay contratos registrados</h3>
          <p className="text-slate-600">Comienza agregando tu primer contrato</p>
        </div>
      ) : (
        <div className="space-y-4">
          {contracts.map((contract) => (
            <div
              key={contract.id}
              data-testid={`contract-card-${contract.id}`}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {getServiceName(contract.service_id)}
                      </h3>
                      {user?.role === 'admin' && (
                        <p className="text-sm text-slate-600">{getCompanyName(contract.company_id)}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-slate-600">Inicio:</span>
                      <p className="font-medium text-slate-800">{contract.start_date}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Fin:</span>
                      <p className="font-medium text-slate-800">{contract.end_date}</p>
                    </div>
                    <div>
                      <span className="text-slate-600 flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        SLA:
                      </span>
                      <p className="font-medium text-slate-800">{contract.sla_hours} horas</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Estado:</span>
                      <p className={`font-medium inline-block px-2 py-1 rounded-full text-xs ${
                        contract.status === 'active' ? 'bg-green-100 text-green-800' :
                        contract.status === 'expired' ? 'bg-red-100 text-red-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {contract.status === 'active' ? 'Activo' :
                         contract.status === 'expired' ? 'Expirado' :
                         'Cancelado'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-sm text-slate-600">{contract.terms}</p>
                  </div>
                </div>
                {user?.role === 'admin' && (
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleEdit(contract)}
                      data-testid={`edit-contract-${contract.id}`}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(contract.id)}
                      data-testid={`delete-contract-${contract.id}`}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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

export default Contracts;
