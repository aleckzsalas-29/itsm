import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Plus, Download, MessageSquare, FileText } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Tickets = () => {
  const { getAuthHeader, user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [assets, setAssets] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketNotes, setTicketNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [formData, setFormData] = useState({
    company_id: '',
    asset_id: '',
    title: '',
    description: '',
    ticket_type: 'incident',
    assigned_to: ''
  });
  const [filterType, setFilterType] = useState('all');
  const [pdfFilter, setPdfFilter] = useState({
    company_id: '',
    start_date: '',
    end_date: '',
    ticket_type: ''
  });

  useEffect(() => {
    fetchTickets();
    if (user?.role !== 'client') {
      fetchCompanies();
      fetchUsers();
    }
    fetchAssets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await axios.get(`${API}/tickets`, {
        headers: getAuthHeader()
      });
      setTickets(response.data);
    } catch (error) {
      toast.error('Error al cargar tickets');
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

  const fetchAssets = async () => {
    try {
      const response = await axios.get(`${API}/assets`, {
        headers: getAuthHeader()
      });
      setAssets(response.data);
    } catch (error) {
      console.error('Error fetching assets:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/users`, {
        headers: getAuthHeader()
      });
      setUsers(response.data.filter(u => u.role === 'technician'));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchTicketNotes = async (ticketId) => {
    try {
      const response = await axios.get(`${API}/ticket-notes/${ticketId}`, {
        headers: getAuthHeader()
      });
      setTicketNotes(response.data);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/tickets`, formData, {
        headers: getAuthHeader()
      });
      toast.success('Ticket creado exitosamente');
      setDialogOpen(false);
      resetForm();
      fetchTickets();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al crear ticket');
    }
  };

  const handleUpdateStatus = async (ticketId, status) => {
    try {
      await axios.put(`${API}/tickets/${ticketId}`, { status }, {
        headers: getAuthHeader()
      });
      toast.success('Estado actualizado');
      fetchTickets();
    } catch (error) {
      toast.error('Error al actualizar estado');
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    try {
      await axios.post(`${API}/ticket-notes`, {
        ticket_id: selectedTicket.id,
        note: newNote
      }, {
        headers: getAuthHeader()
      });
      toast.success('Nota agregada');
      setNewNote('');
      fetchTicketNotes(selectedTicket.id);
    } catch (error) {
      toast.error('Error al agregar nota');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const params = new URLSearchParams();
      if (pdfFilter.company_id) params.append('company_id', pdfFilter.company_id);
      if (pdfFilter.start_date) params.append('start_date', pdfFilter.start_date);
      if (pdfFilter.end_date) params.append('end_date', pdfFilter.end_date);
      if (pdfFilter.ticket_type) params.append('ticket_type', pdfFilter.ticket_type);
      
      const response = await axios.get(`${API}/reports/tickets/pdf?${params.toString()}`, {
        headers: getAuthHeader(),
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'reporte_tickets.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Reporte descargado exitosamente');
    } catch (error) {
      toast.error('Error al generar reporte');
    }
  };

  const resetForm = () => {
    setFormData({
      company_id: '',
      asset_id: '',
      title: '',
      description: '',
      ticket_type: 'incident',
      assigned_to: ''
    });
  };

  const openTicketDetail = async (ticket) => {
    setSelectedTicket(ticket);
    await fetchTicketNotes(ticket.id);
    setDetailDialogOpen(true);
  };

  const filteredTickets = tickets.filter(ticket => {
    if (filterType === 'all') return true;
    return ticket.status === filterType;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'closed': return 'bg-slate-100 text-slate-800 border-slate-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'incident': return 'Incidente';
      case 'request': return 'Solicitud';
      case 'maintenance': return 'Mantenimiento';
      default: return type;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'open': return 'Abierto';
      case 'in_progress': return 'En Progreso';
      case 'resolved': return 'Resuelto';
      case 'closed': return 'Cerrado';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-600 text-lg">Cargando tickets...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Tickets
          </h1>
          <p className="text-slate-600 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            Gestiona incidentes y solicitudes
          </p>
        </div>
        <div className="flex space-x-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button data-testid="download-pdf-button" variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                <Download className="w-4 h-4 mr-2" />
                Descargar PDF
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generar Reporte PDF</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {user?.role !== 'client' && (
                  <div>
                    <Label>Empresa (Opcional)</Label>
                    <select
                      value={pdfFilter.company_id}
                      onChange={(e) => setPdfFilter({ ...pdfFilter, company_id: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg"
                    >
                      <option value="">Todas las empresas</option>
                      {companies.map((company) => (
                        <option key={company.id} value={company.id}>{company.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Fecha Inicio</Label>
                    <Input
                      type="date"
                      value={pdfFilter.start_date}
                      onChange={(e) => setPdfFilter({ ...pdfFilter, start_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Fecha Fin</Label>
                    <Input
                      type="date"
                      value={pdfFilter.end_date}
                      onChange={(e) => setPdfFilter({ ...pdfFilter, end_date: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Tipo (Opcional)</Label>
                  <select
                    value={pdfFilter.ticket_type}
                    onChange={(e) => setPdfFilter({ ...pdfFilter, ticket_type: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="">Todos los tipos</option>
                    <option value="incident">Incidente</option>
                    <option value="request">Solicitud</option>
                    <option value="maintenance">Mantenimiento</option>
                  </select>
                </div>
                <Button onClick={handleDownloadPDF} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Generar Reporte
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button data-testid="add-ticket-button" className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nuevo Ticket</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {user?.role !== 'client' && (
                  <div>
                    <Label htmlFor="company_id">Empresa</Label>
                    <select
                      id="company_id"
                      data-testid="ticket-company-select"
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
                )}
                <div>
                  <Label htmlFor="asset_id">Activo (Opcional)</Label>
                  <select
                    id="asset_id"
                    data-testid="ticket-asset-select"
                    value={formData.asset_id}
                    onChange={(e) => setFormData({ ...formData, asset_id: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="">Sin activo asociado</option>
                    {assets.map((asset) => (
                      <option key={asset.id} value={asset.id}>{asset.name} - {asset.serial_number}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    data-testid="ticket-title-input"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <textarea
                    id="description"
                    data-testid="ticket-description-input"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg min-h-[120px]"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ticket_type">Tipo</Label>
                    <select
                      id="ticket_type"
                      data-testid="ticket-type-select"
                      value={formData.ticket_type}
                      onChange={(e) => setFormData({ ...formData, ticket_type: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg"
                      required
                    >
                      <option value="incident">Incidente</option>
                      <option value="request">Solicitud</option>
                      <option value="maintenance">Mantenimiento</option>
                    </select>
                  </div>
                  {user?.role !== 'client' && (
                    <div>
                      <Label htmlFor="assigned_to">Asignar a (Opcional)</Label>
                      <select
                        id="assigned_to"
                        data-testid="ticket-assigned-select"
                        value={formData.assigned_to}
                        onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg"
                      >
                        <option value="">Sin asignar</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" data-testid="ticket-submit-button" className="bg-blue-600 hover:bg-blue-700 text-white">
                    Crear Ticket
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={filterType} onValueChange={setFilterType}>
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="open">Abiertos</TabsTrigger>
          <TabsTrigger value="in_progress">En Progreso</TabsTrigger>
          <TabsTrigger value="resolved">Resueltos</TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredTickets.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">No hay tickets</h3>
          <p className="text-slate-600">Comienza creando tu primer ticket</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              data-testid={`ticket-card-${ticket.id}`}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-lg transition-all cursor-pointer"
              onClick={() => openTicketDetail(ticket)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-slate-800" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {ticket.title}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                      {getStatusLabel(ticket.status)}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {getTypeLabel(ticket.ticket_type)}
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm mb-3">{ticket.description}</p>
                  <div className="flex items-center space-x-4 text-xs text-slate-500">
                    <span>ID: {ticket.id.substring(0, 8)}</span>
                    <span>•</span>
                    <span>
                      {new Date(ticket.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
                {user?.role !== 'client' && (
                  <div className="flex space-x-2">
                    <select
                      value={ticket.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleUpdateStatus(ticket.id, e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    >
                      <option value="open">Abierto</option>
                      <option value="in_progress">En Progreso</option>
                      <option value="resolved">Resuelto</option>
                      <option value="closed">Cerrado</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ticket Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedTicket.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-slate-800 mb-2">Descripción</h4>
                  <p className="text-slate-600">{selectedTicket.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600">Estado:</span>
                    <p className="font-medium text-slate-800">{getStatusLabel(selectedTicket.status)}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Tipo:</span>
                    <p className="font-medium text-slate-800">{getTypeLabel(selectedTicket.ticket_type)}</p>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-slate-800">Notas / Bitácora</h4>
                    <MessageSquare className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                    {ticketNotes.map((note) => (
                      <div key={note.id} className="bg-slate-50 rounded-lg p-4">
                        <p className="text-slate-800">{note.note}</p>
                        <p className="text-xs text-slate-500 mt-2">
                          {new Date(note.created_at).toLocaleString('es-ES')}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Agregar nota..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
                    />
                    <Button onClick={handleAddNote} className="bg-blue-600 hover:bg-blue-700 text-white">
                      Agregar
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tickets;
