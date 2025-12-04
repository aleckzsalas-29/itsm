import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Plus, Pencil, Trash2, HardDrive, AlertCircle, CheckCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Assets = () => {
  const { getAuthHeader, user } = useAuth();
  const [assets, setAssets] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [formData, setFormData] = useState({
    company_id: '',
    name: '',
    model: '',
    serial_number: '',
    location: '',
    status: 'active',
    purchase_date: '',
    notes: ''
  });

  useEffect(() => {
    fetchAssets();
    if (user?.role !== 'client') {
      fetchCompanies();
    }
  }, []);

  const fetchAssets = async () => {
    try {
      const response = await axios.get(`${API}/assets`, {
        headers: getAuthHeader()
      });
      setAssets(response.data);
    } catch (error) {
      toast.error('Error al cargar activos');
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
      if (editingAsset) {
        await axios.put(`${API}/assets/${editingAsset.id}`, formData, {
          headers: getAuthHeader()
        });
        toast.success('Activo actualizado exitosamente');
      } else {
        await axios.post(`${API}/assets`, formData, {
          headers: getAuthHeader()
        });
        toast.success('Activo creado exitosamente');
      }
      setDialogOpen(false);
      resetForm();
      fetchAssets();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al guardar activo');
    }
  };

  const handleEdit = (asset) => {
    setEditingAsset(asset);
    setFormData({
      company_id: asset.company_id,
      name: asset.name,
      model: asset.model,
      serial_number: asset.serial_number,
      location: asset.location,
      status: asset.status,
      purchase_date: asset.purchase_date || '',
      notes: asset.notes || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este activo?')) return;
    
    try {
      await axios.delete(`${API}/assets/${id}`, {
        headers: getAuthHeader()
      });
      toast.success('Activo eliminado exitosamente');
      fetchAssets();
    } catch (error) {
      toast.error('Error al eliminar activo');
    }
  };

  const resetForm = () => {
    setFormData({
      company_id: '',
      name: '',
      model: '',
      serial_number: '',
      location: '',
      status: 'active',
      purchase_date: '',
      notes: ''
    });
    setEditingAsset(null);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in_repair':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'retired':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <HardDrive className="w-5 h-5 text-slate-600" />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'in_repair': return 'En Reparación';
      case 'retired': return 'Retirado';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-600 text-lg">Cargando activos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Activos
          </h1>
          <p className="text-slate-600 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            Gestiona el inventario de equipos
          </p>
        </div>
        {user?.role !== 'client' && (
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button data-testid="add-asset-button" className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Activo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingAsset ? 'Editar Activo' : 'Nuevo Activo'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="company_id">Empresa</Label>
                  <select
                    id="company_id"
                    data-testid="asset-company-select"
                    value={formData.company_id}
                    onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <Label htmlFor="name">Nombre del Activo</Label>
                    <Input
                      id="name"
                      data-testid="asset-name-input"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="model">Modelo</Label>
                    <Input
                      id="model"
                      data-testid="asset-model-input"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="serial_number">Número de Serie</Label>
                    <Input
                      id="serial_number"
                      data-testid="asset-serial-input"
                      value={formData.serial_number}
                      onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Ubicación</Label>
                    <Input
                      id="location"
                      data-testid="asset-location-input"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status">Estado</Label>
                    <select
                      id="status"
                      data-testid="asset-status-select"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="active">Activo</option>
                      <option value="in_repair">En Reparación</option>
                      <option value="retired">Retirado</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="purchase_date">Fecha de Compra</Label>
                    <Input
                      id="purchase_date"
                      type="date"
                      value={formData.purchase_date}
                      onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Notas</Label>
                  <textarea
                    id="notes"
                    data-testid="asset-notes-input"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
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
                  <Button type="submit" data-testid="asset-submit-button" className="bg-blue-600 hover:bg-blue-700 text-white">
                    {editingAsset ? 'Actualizar' : 'Crear'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {assets.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <HardDrive className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">No hay activos registrados</h3>
          <p className="text-slate-600">Comienza agregando tu primer activo</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assets.map((asset) => (
            <div
              key={asset.id}
              data-testid={`asset-card-${asset.id}`}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    asset.status === 'active' ? 'bg-green-100' :
                    asset.status === 'in_repair' ? 'bg-yellow-100' :
                    'bg-red-100'
                  }`}>
                    {getStatusIcon(asset.status)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {asset.name}
                    </h3>
                    <p className="text-xs text-slate-600">{asset.model}</p>
                  </div>
                </div>
                {user?.role !== 'client' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(asset)}
                      data-testid={`edit-asset-${asset.id}`}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(asset.id)}
                      data-testid={`delete-asset-${asset.id}`}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-slate-600">Número de Serie:</span>
                  <p className="font-medium text-slate-800">{asset.serial_number}</p>
                </div>
                <div>
                  <span className="text-slate-600">Ubicación:</span>
                  <p className="font-medium text-slate-800">{asset.location}</p>
                </div>
                <div>
                  <span className="text-slate-600">Estado:</span>
                  <p className={`font-medium inline-block px-2 py-1 rounded-full text-xs ${
                    asset.status === 'active' ? 'bg-green-100 text-green-800' :
                    asset.status === 'in_repair' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {getStatusLabel(asset.status)}
                  </p>
                </div>
                {asset.notes && (
                  <div>
                    <span className="text-slate-600">Notas:</span>
                    <p className="font-medium text-slate-800 text-xs">{asset.notes}</p>
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

export default Assets;
