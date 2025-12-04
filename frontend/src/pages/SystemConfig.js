import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Settings, Upload, Save } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SystemConfig = () => {
  const { getAuthHeader } = useAuth();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [logoPreview, setLogoPreview] = useState(null);
  const [customFields, setCustomFields] = useState({});
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await axios.get(`${API}/system/config`, {
        headers: getAuthHeader()
      });
      setConfig(response.data);
      setCompanyName(response.data.company_name || '');
      setLogoPreview(response.data.logo_base64 || null);
      setCustomFields(response.data.custom_fields || {});
    } catch (error) {
      toast.error('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API}/system/upload-logo`, formData, {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'multipart/form-data'
        }
      });
      setLogoPreview(response.data.logo_base64);
      toast.success('Logo actualizado exitosamente');
    } catch (error) {
      toast.error('Error al subir logo');
    }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/system/config`, {
        company_name: companyName,
        custom_fields: customFields
      }, {
        headers: getAuthHeader()
      });
      toast.success('Configuración guardada exitosamente');
      fetchConfig();
    } catch (error) {
      toast.error('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleAddCustomField = () => {
    if (!newFieldName.trim() || !newFieldValue.trim()) {
      toast.error('Complete ambos campos');
      return;
    }
    
    setCustomFields({
      ...customFields,
      [newFieldName]: newFieldValue
    });
    setNewFieldName('');
    setNewFieldValue('');
    toast.success('Campo personalizado agregado');
  };

  const handleRemoveCustomField = (fieldName) => {
    const updatedFields = { ...customFields };
    delete updatedFields[fieldName];
    setCustomFields(updatedFields);
    toast.success('Campo eliminado');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-600 text-lg">Cargando configuración...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Configuración del Sistema
        </h1>
        <p className="text-slate-600 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
          Personaliza la apariencia y campos del sistema
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Logo Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Upload className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Logo de la Empresa
            </h2>
          </div>
          
          {logoPreview && (
            <div className="mb-6">
              <img
                src={logoPreview}
                alt="Logo"
                className="max-w-xs max-h-40 object-contain border border-slate-200 rounded-lg p-4 bg-white"
              />
            </div>
          )}
          
          <div>
            <Label htmlFor="logo-upload">Subir Nuevo Logo</Label>
            <Input
              id="logo-upload"
              data-testid="logo-upload-input"
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="mt-2"
            />
            <p className="text-xs text-slate-500 mt-2">
              Formatos aceptados: PNG, JPG, GIF. Tamaño recomendado: 200x100px
            </p>
          </div>
        </div>

        {/* Company Name Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Información de la Empresa
            </h2>
          </div>
          
          <div>
            <Label htmlFor="company-name">Nombre de la Empresa</Label>
            <Input
              id="company-name"
              data-testid="company-name-input"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="ITSM System"
              className="mt-2"
            />
            <p className="text-xs text-slate-500 mt-2">
              Este nombre aparecerá en los reportes PDF y en el sistema
            </p>
          </div>
        </div>
      </div>

      {/* Custom Fields Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Campos Personalizados
        </h2>
        
        <div className="space-y-4 mb-6">
          {Object.keys(customFields).length === 0 ? (
            <p className="text-slate-600 text-sm">No hay campos personalizados aún</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(customFields).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-slate-800">{key}</p>
                    <p className="text-sm text-slate-600">{value}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveCustomField(key)}
                    data-testid={`remove-field-${key}`}
                    className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <Label htmlFor="field-name">Nombre del Campo</Label>
            <Input
              id="field-name"
              data-testid="custom-field-name-input"
              value={newFieldName}
              onChange={(e) => setNewFieldName(e.target.value)}
              placeholder="ej. Horario de Atención"
            />
          </div>
          <div>
            <Label htmlFor="field-value">Valor</Label>
            <Input
              id="field-value"
              data-testid="custom-field-value-input"
              value={newFieldValue}
              onChange={(e) => setNewFieldValue(e.target.value)}
              placeholder="ej. Lunes a Viernes 9:00-18:00"
            />
          </div>
        </div>
        <Button
          onClick={handleAddCustomField}
          data-testid="add-custom-field-button"
          variant="outline"
          className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
        >
          Agregar Campo Personalizado
        </Button>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSaveConfig}
          data-testid="save-config-button"
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Guardando...' : 'Guardar Configuración'}
        </Button>
      </div>
    </div>
  );
};

export default SystemConfig;
