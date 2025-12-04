import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Plus, Pencil, Trash2, HardDrive, AlertCircle, CheckCircle, Download, Building2 } from 'lucide-react';

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
    asset_type: '',
    manufacturer: '',
    model: '',
    serial_number: '',
    host_name: '',
    windows_user: '',
    windows_password: '',
    email_accounts: '',
    cloud_user: '',
    backup_folder: '',
    location: '',
    status: 'active',
    ip_address: '',
    operating_system: '',
    os_version: '',
    cpu_processor: '',
    ram_gb: '',
    storage_type_capacity: '',
    graphics_card: '',
    network_ports: '',
    purchase_date: '',
    purchase_value: '',
    warranty_expiration: '',
    support_provider: '',
    estimated_life_months: '',
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
      asset_type: asset.asset_type || '',
      manufacturer: asset.manufacturer || '',
      model: asset.model || '',
      serial_number: asset.serial_number || '',
      host_name: asset.host_name || '',
      windows_user: asset.windows_user || '',
      windows_password: asset.windows_password || '',
      email_accounts: asset.email_accounts || '',
      cloud_user: asset.cloud_user || '',
      backup_folder: asset.backup_folder || '',
      location: asset.location || '',
      status: asset.status,
      ip_address: asset.ip_address || '',
      operating_system: asset.operating_system || '',
      os_version: asset.os_version || '',
      cpu_processor: asset.cpu_processor || '',
      ram_gb: asset.ram_gb || '',
      storage_type_capacity: asset.storage_type_capacity || '',
      graphics_card: asset.graphics_card || '',
      network_ports: asset.network_ports || '',
      purchase_date: asset.purchase_date || '',
      purchase_value: asset.purchase_value || '',
      warranty_expiration: asset.warranty_expiration || '',
      support_provider: asset.support_provider || '',
      estimated_life_months: asset.estimated_life_months || '',
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
      asset_type: '',
      manufacturer: '',
      model: '',
      serial_number: '',
      host_name: '',
      windows_user: '',
      windows_password: '',
      email_accounts: '',
      cloud_user: '',
      backup_folder: '',
      location: '',
      status: 'active',
      ip_address: '',
      operating_system: '',
      os_version: '',
      cpu_processor: '',
      ram_gb: '',
      storage_type_capacity: '',
      graphics_card: '',
      network_ports: '',
      purchase_date: '',
      purchase_value: '',
      warranty_expiration: '',
      support_provider: '',
      estimated_life_months: '',
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

  const handleDownloadPDF = async () => {
    try {
      const response = await axios.get(`${API}/reports/assets/pdf`, {
        headers: getAuthHeader(),
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'reporte_activos.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Reporte descargado exitosamente');
    } catch (error) {
      toast.error('Error al generar reporte');
    }
  };

  // Group assets by company
  const assetsByCompany = assets.reduce((acc, asset) => {
    const companyId = asset.company_id;
    if (!acc[companyId]) {
      acc[companyId] = [];
    }
    acc[companyId].push(asset);
    return acc;
  }, {});

  const getCompanyName = (companyId) => {
    const company = companies.find(c => c.id === companyId);
    return company ? company.name : 'Empresa Desconocida';
  };

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
        <div className="flex space-x-3">
          <Button 
            onClick={handleDownloadPDF}
            data-testid="download-assets-pdf-button" 
            variant="outline" 
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Descargar PDF
          </Button>
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
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingAsset ? 'Editar Activo' : 'Nuevo Activo'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="basic">Básico</TabsTrigger>
                    <TabsTrigger value="operation">Operación</TabsTrigger>
                    <TabsTrigger value="hardware">Hardware</TabsTrigger>
                    <TabsTrigger value="financial">Financiero</TabsTrigger>
                  </TabsList>

                  {/* BASIC TAB */}
                  <TabsContent value="basic" className="space-y-4">
                    <div>
                      <Label htmlFor="company_id">Empresa *</Label>
                      <select
                        id="company_id"
                        data-testid="asset-company-select"
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
                        <Label htmlFor="asset_type">Tipo de Activo</Label>
                        <Input
                          id="asset_type"
                          value={formData.asset_type}
                          onChange={(e) => setFormData({ ...formData, asset_type: e.target.value })}
                          placeholder="ej. Laptop, Servidor, Router"
                        />
                      </div>
                      <div>
                        <Label htmlFor="manufacturer">Fabricante</Label>
                        <Input
                          id="manufacturer"
                          value={formData.manufacturer}
                          onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                          placeholder="ej. Dell, HP, Lenovo"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="model">Modelo</Label>
                        <Input
                          id="model"
                          data-testid="asset-model-input"
                          value={formData.model}
                          onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                          placeholder="ej. PowerEdge R740"
                        />
                      </div>
                      <div>
                        <Label htmlFor="serial_number">Número de Serie (S/N)</Label>
                        <Input
                          id="serial_number"
                          data-testid="asset-serial-input"
                          value={formData.serial_number}
                          onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="host_name">Nombre Host</Label>
                        <Input
                          id="host_name"
                          value={formData.host_name}
                          onChange={(e) => setFormData({ ...formData, host_name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="windows_user">Usuario Windows</Label>
                        <Input
                          id="windows_user"
                          value={formData.windows_user}
                          onChange={(e) => setFormData({ ...formData, windows_user: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="windows_password">Contraseña Windows</Label>
                      <Input
                        id="windows_password"
                        type="password"
                        value={formData.windows_password}
                        onChange={(e) => setFormData({ ...formData, windows_password: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email_accounts">Correos Electrónicos y Contraseñas</Label>
                      <textarea
                        id="email_accounts"
                        value={formData.email_accounts}
                        onChange={(e) => setFormData({ ...formData, email_accounts: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg min-h-[80px]"
                        placeholder="ej. correo1@example.com: password1"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="cloud_user">Usuario Nube</Label>
                        <Input
                          id="cloud_user"
                          value={formData.cloud_user}
                          onChange={(e) => setFormData({ ...formData, cloud_user: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="backup_folder">Carpeta Respaldo</Label>
                        <Input
                          id="backup_folder"
                          value={formData.backup_folder}
                          onChange={(e) => setFormData({ ...formData, backup_folder: e.target.value })}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {/* OPERATION TAB */}
                  <TabsContent value="operation" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="location">Ubicación Física</Label>
                        <Input
                          id="location"
                          data-testid="asset-location-input"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="status">Estado del Activo</Label>
                        <select
                          id="status"
                          data-testid="asset-status-select"
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                          className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg"
                        >
                          <option value="active">Activo</option>
                          <option value="in_repair">En Reparación</option>
                          <option value="retired">Retirado</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="ip_address">Dirección IP</Label>
                        <Input
                          id="ip_address"
                          value={formData.ip_address}
                          onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                          placeholder="ej. 192.168.1.100"
                        />
                      </div>
                      <div>
                        <Label htmlFor="operating_system">Sistema Operativo</Label>
                        <Input
                          id="operating_system"
                          value={formData.operating_system}
                          onChange={(e) => setFormData({ ...formData, operating_system: e.target.value })}
                          placeholder="ej. Windows Server 2022"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="os_version">Versión SO</Label>
                      <Input
                        id="os_version"
                        value={formData.os_version}
                        onChange={(e) => setFormData({ ...formData, os_version: e.target.value })}
                        placeholder="ej. 21H2"
                      />
                    </div>
                  </TabsContent>

                  {/* HARDWARE TAB */}
                  <TabsContent value="hardware" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="cpu_processor">CPU/Procesador</Label>
                        <Input
                          id="cpu_processor"
                          value={formData.cpu_processor}
                          onChange={(e) => setFormData({ ...formData, cpu_processor: e.target.value })}
                          placeholder="ej. Intel Xeon E5-2680 v4"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ram_gb">Memoria RAM (GB)</Label>
                        <Input
                          id="ram_gb"
                          value={formData.ram_gb}
                          onChange={(e) => setFormData({ ...formData, ram_gb: e.target.value })}
                          placeholder="ej. 32 GB"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="storage_type_capacity">Almacenamiento (Tipo/Capacidad)</Label>
                      <Input
                        id="storage_type_capacity"
                        value={formData.storage_type_capacity}
                        onChange={(e) => setFormData({ ...formData, storage_type_capacity: e.target.value })}
                        placeholder="ej. SSD 1TB + HDD 4TB"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="graphics_card">Tarjeta Gráfica/GPU</Label>
                        <Input
                          id="graphics_card"
                          value={formData.graphics_card}
                          onChange={(e) => setFormData({ ...formData, graphics_card: e.target.value })}
                          placeholder="ej. NVIDIA RTX 3080"
                        />
                      </div>
                      <div>
                        <Label htmlFor="network_ports">Puertos de Red</Label>
                        <Input
                          id="network_ports"
                          value={formData.network_ports}
                          onChange={(e) => setFormData({ ...formData, network_ports: e.target.value })}
                          placeholder="ej. 4x Gigabit Ethernet"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {/* FINANCIAL TAB */}
                  <TabsContent value="financial" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="purchase_date">Fecha de Compra</Label>
                        <Input
                          id="purchase_date"
                          type="date"
                          value={formData.purchase_date}
                          onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="purchase_value">Valor de Compra</Label>
                        <Input
                          id="purchase_value"
                          value={formData.purchase_value}
                          onChange={(e) => setFormData({ ...formData, purchase_value: e.target.value })}
                          placeholder="ej. $2500 USD"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="warranty_expiration">Fecha Vencimiento Garantía</Label>
                        <Input
                          id="warranty_expiration"
                          type="date"
                          value={formData.warranty_expiration}
                          onChange={(e) => setFormData({ ...formData, warranty_expiration: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="support_provider">Proveedor de Soporte</Label>
                        <Input
                          id="support_provider"
                          value={formData.support_provider}
                          onChange={(e) => setFormData({ ...formData, support_provider: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="estimated_life_months">Vida Útil Estimada (Meses)</Label>
                      <Input
                        id="estimated_life_months"
                        type="number"
                        value={formData.estimated_life_months}
                        onChange={(e) => setFormData({ ...formData, estimated_life_months: e.target.value })}
                        placeholder="ej. 60"
                      />
                    </div>
                    <div>
                      <Label htmlFor="notes">Notas Adicionales</Label>
                      <textarea
                        id="notes"
                        data-testid="asset-notes-input"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg min-h-[100px]"
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
        <div className="space-y-8">
          {Object.keys(assetsByCompany).map((companyId) => (
            <div key={companyId} className="space-y-4">
              {/* Company Header */}
              <div className="flex items-center space-x-3 pb-3 border-b border-slate-200">
                <Building2 className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-slate-800" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {getCompanyName(companyId)}
                </h2>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {assetsByCompany[companyId].length} activo(s)
                </span>
              </div>
              
              {/* Assets Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assetsByCompany[companyId].map((asset) => (
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
                      {asset.asset_type || asset.model || 'Activo'}
                    </h3>
                    <p className="text-xs text-slate-600">{asset.manufacturer} {asset.model}</p>
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
                {asset.serial_number && (
                  <div>
                    <span className="text-slate-600">S/N:</span>
                    <p className="font-medium text-slate-800">{asset.serial_number}</p>
                  </div>
                )}
                {asset.host_name && (
                  <div>
                    <span className="text-slate-600">Host:</span>
                    <p className="font-medium text-slate-800">{asset.host_name}</p>
                  </div>
                )}
                {asset.location && (
                  <div>
                    <span className="text-slate-600">Ubicación:</span>
                    <p className="font-medium text-slate-800">{asset.location}</p>
                  </div>
                )}
                {asset.ip_address && (
                  <div>
                    <span className="text-slate-600">IP:</span>
                    <p className="font-medium text-slate-800">{asset.ip_address}</p>
                  </div>
                )}
                {asset.operating_system && (
                  <div>
                    <span className="text-slate-600">SO:</span>
                    <p className="font-medium text-slate-800">{asset.operating_system}</p>
                  </div>
                )}
                <div>
                  <span className="text-slate-600">Estado:</span>
                  <p className={`font-medium inline-block px-2 py-1 rounded-full text-xs ml-2 ${
                    asset.status === 'active' ? 'bg-green-100 text-green-800' :
                    asset.status === 'in_repair' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {getStatusLabel(asset.status)}
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

export default Assets;
