from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, UploadFile, File
from fastapi.responses import FileResponse, StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image as RLImage
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch
from io import BytesIO
import base64
from PIL import Image


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-this')
JWT_ALGORITHM = 'HS256'


# ==================== MODELS ====================

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    role: str  # admin, technician, client
    company_id: Optional[str] = None  # For client role
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str
    company_id: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class Company(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    contact_person: str
    email: EmailStr
    phone: str
    address: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CompanyCreate(BaseModel):
    name: str
    contact_person: str
    email: EmailStr
    phone: str
    address: str

class Asset(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    
    # I. Información Básica
    asset_type: Optional[str] = None  # Tipo de Activo
    manufacturer: Optional[str] = None  # Fabricante
    model: Optional[str] = None  # Modelo
    serial_number: Optional[str] = None  # Número de Serie (S/N)
    host_name: Optional[str] = None  # Nombre Host
    
    # Credenciales Windows
    windows_user: Optional[str] = None
    windows_password: Optional[str] = None
    
    # Correos electrónicos
    email_accounts: Optional[str] = None  # Correos y contraseñas (JSON o texto)
    
    # Usuario Nube y Respaldo
    cloud_user: Optional[str] = None
    backup_folder: Optional[str] = None
    
    # II. Operación y Ubicación
    location: Optional[str] = None  # Ubicación Física
    status: str = "active"  # Estado del Activo (active, retired, in_repair)
    ip_address: Optional[str] = None  # Dirección IP
    operating_system: Optional[str] = None  # Sistema Operativo
    os_version: Optional[str] = None  # Versión SO
    
    # III. Especificaciones Técnicas (Hardware)
    cpu_processor: Optional[str] = None  # CPU/Procesador
    ram_gb: Optional[str] = None  # Memoria RAM (GB)
    storage_type_capacity: Optional[str] = None  # Almacenamiento (Tipo/Capacidad)
    graphics_card: Optional[str] = None  # Tarjeta Gráfica/GPU
    network_ports: Optional[str] = None  # Puertos de Red
    
    # IV. Gestión Financiera y Soporte
    purchase_date: Optional[str] = None  # Fecha de Compra
    purchase_value: Optional[str] = None  # Valor de Compra
    warranty_expiration: Optional[str] = None  # Fecha Vencimiento Garantía
    support_provider: Optional[str] = None  # Proveedor de Soporte
    estimated_life_months: Optional[int] = None  # Vida Útil Estimada (Meses)
    
    notes: Optional[str] = None  # Notas Adicionales
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AssetCreate(BaseModel):
    company_id: str
    
    # I. Información Básica
    asset_type: Optional[str] = None
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    host_name: Optional[str] = None
    
    # Credenciales Windows
    windows_user: Optional[str] = None
    windows_password: Optional[str] = None
    
    # Correos electrónicos
    email_accounts: Optional[str] = None
    
    # Usuario Nube y Respaldo
    cloud_user: Optional[str] = None
    backup_folder: Optional[str] = None
    
    # II. Operación y Ubicación
    location: Optional[str] = None
    status: str = "active"
    ip_address: Optional[str] = None
    operating_system: Optional[str] = None
    os_version: Optional[str] = None
    
    # III. Especificaciones Técnicas (Hardware)
    cpu_processor: Optional[str] = None
    ram_gb: Optional[str] = None
    storage_type_capacity: Optional[str] = None
    graphics_card: Optional[str] = None
    network_ports: Optional[str] = None
    
    # IV. Gestión Financiera y Soporte
    purchase_date: Optional[str] = None
    purchase_value: Optional[str] = None
    warranty_expiration: Optional[str] = None
    support_provider: Optional[str] = None
    estimated_life_months: Optional[int] = None
    
    notes: Optional[str] = None

class Ticket(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # Relaciones
    asset_id: Optional[str] = None  # ID_Activo_Afectado
    company_id: str  # Empresa_Cliente
    service_id: Optional[str] = None  # Servicio_Contratado_Afectado
    
    # Información del Ticket
    title: str  # Titulo_Ticket
    category: Optional[str] = None  # Categoria
    priority: Optional[str] = None  # Prioridad (Baja, Media, Alta, Crítica)
    status: str = "open"  # Estado (open, in_progress, resolved, closed)
    
    # Personas
    requester: Optional[str] = None  # Solicitante
    assigned_to: Optional[str] = None  # Asignado_a_Tecnico (User ID)
    created_by: str  # User ID
    
    # Descripciones
    description: str  # Descripcion_del_Problema
    maintenance_log: Optional[str] = None  # Bitacora_Mantenimiento
    final_resolution: Optional[str] = None  # Resolucion_Final
    
    # Fechas
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))  # Fecha_Creacion
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    resolved_at: Optional[datetime] = None  # Fecha_Hora_Resolucion

class TicketCreate(BaseModel):
    company_id: str
    asset_id: Optional[str] = None
    service_id: Optional[str] = None
    title: str
    category: Optional[str] = None
    priority: Optional[str] = None
    requester: Optional[str] = None
    assigned_to: Optional[str] = None
    description: str
    maintenance_log: Optional[str] = None

class TicketUpdate(BaseModel):
    status: Optional[str] = None
    assigned_to: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    requester: Optional[str] = None
    maintenance_log: Optional[str] = None
    final_resolution: Optional[str] = None

class TicketNote(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    ticket_id: str
    user_id: str
    note: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TicketNoteCreate(BaseModel):
    ticket_id: str
    note: str

class Service(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # Relaciones
    company_id: str  # Empresa_Cliente
    
    # Información del Servicio
    service_type: Optional[str] = None  # Tipo_de_Servicio (Web Hosting, VPS, Email, Licencias, etc.)
    service_name: str  # Nombre_Servicio_Específico
    description: Optional[str] = None  # Descripción_Detallada
    
    # Fechas y Facturación
    start_date: Optional[str] = None  # Fecha_Inicio_Contrato
    expiration_date: Optional[str] = None  # Fecha_Vencimiento_Contrato
    billing_period: Optional[str] = None  # Periodo_Facturacion (Mensual, Trimestral, Anual)
    cost: Optional[str] = None  # Costo_Mensual_o_Total
    
    # Proveedor y Acceso
    external_provider: Optional[str] = None  # Proveedor_Externo
    associated_domain: Optional[str] = None  # Dominio_Asociado
    panel_access_data: Optional[str] = None  # Datos_Acceso_Panel
    licenses_quantity: Optional[int] = None  # Licencias_Cantidad
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ServiceCreate(BaseModel):
    company_id: str
    service_type: Optional[str] = None
    service_name: str
    description: Optional[str] = None
    start_date: Optional[str] = None
    expiration_date: Optional[str] = None
    billing_period: Optional[str] = None
    cost: Optional[str] = None
    external_provider: Optional[str] = None
    associated_domain: Optional[str] = None
    panel_access_data: Optional[str] = None
    licenses_quantity: Optional[int] = None

class Contract(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    service_id: str
    start_date: str
    end_date: str
    sla_hours: int  # Response time in hours
    terms: str
    status: str  # active, expired, cancelled
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ContractCreate(BaseModel):
    company_id: str
    service_id: str
    start_date: str
    end_date: str
    sla_hours: int
    terms: str
    status: str

class SystemConfig(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "system_config"
    logo_base64: Optional[str] = None
    company_name: str = "ITSM System"
    custom_fields: Dict[str, Any] = Field(default_factory=dict)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SystemConfigUpdate(BaseModel):
    logo_base64: Optional[str] = None
    company_name: Optional[str] = None
    custom_fields: Optional[Dict[str, Any]] = None


# ==================== AUTH UTILITIES ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, role: str) -> str:
    payload = {
        'user_id': user_id,
        'role': role,
        'exp': datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        token = authorization.replace('Bearer ', '')
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload['user_id']}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return User(**user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_dict = user_data.model_dump()
    password = user_dict.pop('password')
    user_obj = User(**user_dict)
    
    doc = user_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['password_hash'] = hash_password(password)
    
    await db.users.insert_one(doc)
    
    token = create_token(user_obj.id, user_obj.role)
    return {"user": user_obj, "token": token}

@api_router.post("/auth/login")
async def login(login_data: LoginRequest):
    user = await db.users.find_one({"email": login_data.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(login_data.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user.pop('password_hash')
    if isinstance(user['created_at'], str):
        user['created_at'] = datetime.fromisoformat(user['created_at'])
    
    token = create_token(user['id'], user['role'])
    return {"user": User(**user), "token": token}

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


# ==================== COMPANY ROUTES ====================

@api_router.post("/companies", response_model=Company)
async def create_company(company_data: CompanyCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Only admins can create companies")
    
    company = Company(**company_data.model_dump())
    doc = company.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.companies.insert_one(doc)
    return company

@api_router.get("/companies", response_model=List[Company])
async def get_companies(current_user: User = Depends(get_current_user)):
    if current_user.role == 'client':
        companies = await db.companies.find({"id": current_user.company_id}, {"_id": 0}).to_list(1000)
    else:
        companies = await db.companies.find({}, {"_id": 0}).to_list(1000)
    
    for company in companies:
        if 'created_at' in company and isinstance(company['created_at'], str):
            company['created_at'] = datetime.fromisoformat(company['created_at'])
        elif 'created_at' not in company:
            company['created_at'] = datetime.now(timezone.utc)
    
    return companies

@api_router.get("/companies/{company_id}", response_model=Company)
async def get_company(company_id: str, current_user: User = Depends(get_current_user)):
    company = await db.companies.find_one({"id": company_id}, {"_id": 0})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    if isinstance(company['created_at'], str):
        company['created_at'] = datetime.fromisoformat(company['created_at'])
    
    return Company(**company)

@api_router.put("/companies/{company_id}", response_model=Company)
async def update_company(company_id: str, company_data: CompanyCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Only admins can update companies")
    
    result = await db.companies.update_one(
        {"id": company_id},
        {"$set": company_data.model_dump()}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Company not found")
    
    updated = await db.companies.find_one({"id": company_id}, {"_id": 0})
    if isinstance(updated['created_at'], str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    
    return Company(**updated)

@api_router.delete("/companies/{company_id}")
async def delete_company(company_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Only admins can delete companies")
    
    result = await db.companies.delete_one({"id": company_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Company not found")
    
    return {"message": "Company deleted successfully"}


# ==================== ASSET ROUTES ====================

@api_router.post("/assets", response_model=Asset)
async def create_asset(asset_data: AssetCreate, current_user: User = Depends(get_current_user)):
    if current_user.role not in ['admin', 'technician']:
        raise HTTPException(status_code=403, detail="Only admins and technicians can create assets")
    
    asset = Asset(**asset_data.model_dump())
    doc = asset.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.assets.insert_one(doc)
    return asset

@api_router.get("/assets", response_model=List[Asset])
async def get_assets(company_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {}
    if current_user.role == 'client':
        query['company_id'] = current_user.company_id
    elif company_id:
        query['company_id'] = company_id
    
    assets = await db.assets.find(query, {"_id": 0}).to_list(1000)
    
    for asset in assets:
        if isinstance(asset['created_at'], str):
            asset['created_at'] = datetime.fromisoformat(asset['created_at'])
    
    return assets

@api_router.get("/assets/{asset_id}", response_model=Asset)
async def get_asset(asset_id: str, current_user: User = Depends(get_current_user)):
    asset = await db.assets.find_one({"id": asset_id}, {"_id": 0})
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    if isinstance(asset['created_at'], str):
        asset['created_at'] = datetime.fromisoformat(asset['created_at'])
    
    return Asset(**asset)

@api_router.put("/assets/{asset_id}", response_model=Asset)
async def update_asset(asset_id: str, asset_data: AssetCreate, current_user: User = Depends(get_current_user)):
    if current_user.role not in ['admin', 'technician']:
        raise HTTPException(status_code=403, detail="Only admins and technicians can update assets")
    
    result = await db.assets.update_one(
        {"id": asset_id},
        {"$set": asset_data.model_dump()}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    updated = await db.assets.find_one({"id": asset_id}, {"_id": 0})
    if isinstance(updated['created_at'], str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    
    return Asset(**updated)

@api_router.delete("/assets/{asset_id}")
async def delete_asset(asset_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Only admins can delete assets")
    
    result = await db.assets.delete_one({"id": asset_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    return {"message": "Asset deleted successfully"}


# ==================== TICKET ROUTES ====================

@api_router.post("/tickets", response_model=Ticket)
async def create_ticket(ticket_data: TicketCreate, current_user: User = Depends(get_current_user)):
    ticket = Ticket(**ticket_data.model_dump(), created_by=current_user.id, status='open')
    doc = ticket.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    if doc['resolved_at']:
        doc['resolved_at'] = doc['resolved_at'].isoformat()
    
    await db.tickets.insert_one(doc)
    return ticket

@api_router.get("/tickets", response_model=List[Ticket])
async def get_tickets(
    company_id: Optional[str] = None,
    status: Optional[str] = None,
    ticket_type: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    query = {}
    if current_user.role == 'client':
        query['company_id'] = current_user.company_id
    elif current_user.role == 'technician':
        query['$or'] = [
            {'assigned_to': current_user.id},
            {'assigned_to': None}
        ]
    
    if company_id:
        query['company_id'] = company_id
    if status:
        query['status'] = status
    if ticket_type:
        query['ticket_type'] = ticket_type
    
    tickets = await db.tickets.find(query, {"_id": 0}).to_list(1000)
    
    for ticket in tickets:
        if isinstance(ticket['created_at'], str):
            ticket['created_at'] = datetime.fromisoformat(ticket['created_at'])
        if isinstance(ticket['updated_at'], str):
            ticket['updated_at'] = datetime.fromisoformat(ticket['updated_at'])
        if ticket.get('resolved_at') and isinstance(ticket['resolved_at'], str):
            ticket['resolved_at'] = datetime.fromisoformat(ticket['resolved_at'])
    
    return tickets

@api_router.get("/tickets/{ticket_id}", response_model=Ticket)
async def get_ticket(ticket_id: str, current_user: User = Depends(get_current_user)):
    ticket = await db.tickets.find_one({"id": ticket_id}, {"_id": 0})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    if isinstance(ticket['created_at'], str):
        ticket['created_at'] = datetime.fromisoformat(ticket['created_at'])
    if isinstance(ticket['updated_at'], str):
        ticket['updated_at'] = datetime.fromisoformat(ticket['updated_at'])
    if ticket.get('resolved_at') and isinstance(ticket['resolved_at'], str):
        ticket['resolved_at'] = datetime.fromisoformat(ticket['resolved_at'])
    
    return Ticket(**ticket)

@api_router.put("/tickets/{ticket_id}", response_model=Ticket)
async def update_ticket(ticket_id: str, ticket_data: TicketUpdate, current_user: User = Depends(get_current_user)):
    if current_user.role not in ['admin', 'technician']:
        raise HTTPException(status_code=403, detail="Only admins and technicians can update tickets")
    
    update_data = ticket_data.model_dump(exclude_unset=True)
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    if update_data.get('status') in ['resolved', 'closed']:
        update_data['resolved_at'] = datetime.now(timezone.utc).isoformat()
    
    result = await db.tickets.update_one(
        {"id": ticket_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    updated = await db.tickets.find_one({"id": ticket_id}, {"_id": 0})
    if isinstance(updated['created_at'], str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    if isinstance(updated['updated_at'], str):
        updated['updated_at'] = datetime.fromisoformat(updated['updated_at'])
    if updated.get('resolved_at') and isinstance(updated['resolved_at'], str):
        updated['resolved_at'] = datetime.fromisoformat(updated['resolved_at'])
    
    return Ticket(**updated)

@api_router.delete("/tickets/{ticket_id}")
async def delete_ticket(ticket_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Only admins can delete tickets")
    
    result = await db.tickets.delete_one({"id": ticket_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    return {"message": "Ticket deleted successfully"}


# ==================== TICKET NOTES ROUTES ====================

@api_router.post("/ticket-notes", response_model=TicketNote)
async def create_ticket_note(note_data: TicketNoteCreate, current_user: User = Depends(get_current_user)):
    note = TicketNote(**note_data.model_dump(), user_id=current_user.id)
    doc = note.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.ticket_notes.insert_one(doc)
    return note

@api_router.get("/ticket-notes/{ticket_id}", response_model=List[TicketNote])
async def get_ticket_notes(ticket_id: str, current_user: User = Depends(get_current_user)):
    notes = await db.ticket_notes.find({"ticket_id": ticket_id}, {"_id": 0}).to_list(1000)
    
    for note in notes:
        if isinstance(note['created_at'], str):
            note['created_at'] = datetime.fromisoformat(note['created_at'])
    
    return notes


# ==================== SERVICE ROUTES ====================

@api_router.post("/services", response_model=Service)
async def create_service(service_data: ServiceCreate, current_user: User = Depends(get_current_user)):
    if current_user.role not in ['admin', 'technician']:
        raise HTTPException(status_code=403, detail="Only admins and technicians can create services")
    
    service = Service(**service_data.model_dump())
    doc = service.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.services.insert_one(doc)
    return service

@api_router.get("/services", response_model=List[Service])
async def get_services(company_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {}
    if current_user.role == 'client':
        query['company_id'] = current_user.company_id
    elif company_id:
        query['company_id'] = company_id
    
    services = await db.services.find(query, {"_id": 0}).to_list(1000)
    
    for service in services:
        if isinstance(service['created_at'], str):
            service['created_at'] = datetime.fromisoformat(service['created_at'])
    
    return services

@api_router.get("/services/{service_id}", response_model=Service)
async def get_service(service_id: str, current_user: User = Depends(get_current_user)):
    service = await db.services.find_one({"id": service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    if isinstance(service['created_at'], str):
        service['created_at'] = datetime.fromisoformat(service['created_at'])
    
    return Service(**service)

@api_router.put("/services/{service_id}", response_model=Service)
async def update_service(service_id: str, service_data: ServiceCreate, current_user: User = Depends(get_current_user)):
    if current_user.role not in ['admin', 'technician']:
        raise HTTPException(status_code=403, detail="Only admins and technicians can update services")
    
    result = await db.services.update_one(
        {"id": service_id},
        {"$set": service_data.model_dump()}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    
    updated = await db.services.find_one({"id": service_id}, {"_id": 0})
    if isinstance(updated['created_at'], str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    
    return Service(**updated)

@api_router.delete("/services/{service_id}")
async def delete_service(service_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Only admins can delete services")
    
    result = await db.services.delete_one({"id": service_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    
    return {"message": "Service deleted successfully"}


# ==================== CONTRACT ROUTES ====================

@api_router.post("/contracts", response_model=Contract)
async def create_contract(contract_data: ContractCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Only admins can create contracts")
    
    contract = Contract(**contract_data.model_dump())
    doc = contract.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.contracts.insert_one(doc)
    return contract

@api_router.get("/contracts", response_model=List[Contract])
async def get_contracts(company_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {}
    if current_user.role == 'client':
        query['company_id'] = current_user.company_id
    elif company_id:
        query['company_id'] = company_id
    
    contracts = await db.contracts.find(query, {"_id": 0}).to_list(1000)
    
    for contract in contracts:
        if isinstance(contract['created_at'], str):
            contract['created_at'] = datetime.fromisoformat(contract['created_at'])
    
    return contracts

@api_router.put("/contracts/{contract_id}", response_model=Contract)
async def update_contract(contract_id: str, contract_data: ContractCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Only admins can update contracts")
    
    result = await db.contracts.update_one(
        {"id": contract_id},
        {"$set": contract_data.model_dump()}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    updated = await db.contracts.find_one({"id": contract_id}, {"_id": 0})
    if isinstance(updated['created_at'], str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    
    return Contract(**updated)

@api_router.delete("/contracts/{contract_id}")
async def delete_contract(contract_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Only admins can delete contracts")
    
    result = await db.contracts.delete_one({"id": contract_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    return {"message": "Contract deleted successfully"}


# ==================== SLA ALERTS ====================

@api_router.get("/alerts/sla")
async def get_sla_alerts(current_user: User = Depends(get_current_user)):
    # Get all open tickets
    query = {'status': {'$in': ['open', 'in_progress']}}
    if current_user.role == 'client':
        query['company_id'] = current_user.company_id
    
    tickets = await db.tickets.find(query, {"_id": 0}).to_list(1000)
    
    alerts = []
    for ticket in tickets:
        # Get company's contracts
        contracts = await db.contracts.find({
            'company_id': ticket['company_id'],
            'status': 'active'
        }, {"_id": 0}).to_list(100)
        
        for contract in contracts:
            created_at = datetime.fromisoformat(ticket['created_at']) if isinstance(ticket['created_at'], str) else ticket['created_at']
            sla_deadline = created_at + timedelta(hours=contract['sla_hours'])
            now = datetime.now(timezone.utc)
            
            # Check if approaching SLA or breached
            time_remaining = (sla_deadline - now).total_seconds() / 3600  # hours
            
            if time_remaining <= 0:
                alerts.append({
                    'ticket_id': ticket['id'],
                    'ticket_title': ticket['title'],
                    'company_id': ticket['company_id'],
                    'sla_hours': contract['sla_hours'],
                    'status': 'breached',
                    'hours_overdue': abs(time_remaining)
                })
            elif time_remaining <= contract['sla_hours'] * 0.2:  # 20% time remaining
                alerts.append({
                    'ticket_id': ticket['id'],
                    'ticket_title': ticket['title'],
                    'company_id': ticket['company_id'],
                    'sla_hours': contract['sla_hours'],
                    'status': 'warning',
                    'hours_remaining': time_remaining
                })
    
    return alerts


# ==================== DASHBOARD STATS ====================

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    query = {}
    if current_user.role == 'client':
        query['company_id'] = current_user.company_id
    
    # Ticket stats
    total_tickets = await db.tickets.count_documents(query)
    open_tickets = await db.tickets.count_documents({**query, 'status': 'open'})
    in_progress_tickets = await db.tickets.count_documents({**query, 'status': 'in_progress'})
    resolved_tickets = await db.tickets.count_documents({**query, 'status': {'$in': ['resolved', 'closed']}})
    
    # Asset stats
    total_assets = await db.assets.count_documents(query)
    active_assets = await db.assets.count_documents({**query, 'status': 'active'})
    in_repair_assets = await db.assets.count_documents({**query, 'status': 'in_repair'})
    
    # Company stats (admin only)
    total_companies = 0
    if current_user.role in ['admin', 'technician']:
        total_companies = await db.companies.count_documents({})
    
    # Ticket by type
    ticket_types = {}
    for t_type in ['incident', 'request', 'maintenance']:
        count = await db.tickets.count_documents({**query, 'ticket_type': t_type})
        ticket_types[t_type] = count
    
    # Recent activity (last 7 days)
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    recent_tickets = await db.tickets.find(
        {**query},
        {"_id": 0, "id": 1, "title": 1, "status": 1, "created_at": 1}
    ).sort('created_at', -1).limit(5).to_list(5)
    
    for ticket in recent_tickets:
        if isinstance(ticket['created_at'], str):
            ticket['created_at'] = datetime.fromisoformat(ticket['created_at'])
    
    return {
        'tickets': {
            'total': total_tickets,
            'open': open_tickets,
            'in_progress': in_progress_tickets,
            'resolved': resolved_tickets,
            'by_type': ticket_types
        },
        'assets': {
            'total': total_assets,
            'active': active_assets,
            'in_repair': in_repair_assets
        },
        'companies': total_companies,
        'recent_tickets': recent_tickets
    }


# ==================== PDF REPORT GENERATION ====================

@api_router.get("/reports/tickets/pdf")
async def generate_tickets_pdf(
    company_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    ticket_type: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    query = {}
    if current_user.role == 'client':
        query['company_id'] = current_user.company_id
    elif company_id:
        query['company_id'] = company_id
    
    if ticket_type:
        query['ticket_type'] = ticket_type
    
    # Date filtering
    if start_date and end_date:
        query['created_at'] = {
            '$gte': start_date,
            '$lte': end_date
        }
    
    tickets = await db.tickets.find(query, {"_id": 0}).to_list(1000)
    
    # Get system config for logo
    config = await db.system_config.find_one({"id": "system_config"}, {"_id": 0})
    
    # Create PDF
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    elements = []
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1a56db'),
        spaceAfter=30,
        alignment=1  # Center
    )
    
    # Add logo if exists
    if config and config.get('logo_base64'):
        try:
            img_data = base64.b64decode(config['logo_base64'].split(',')[1])
            img = Image.open(BytesIO(img_data))
            img_buffer = BytesIO()
            img.save(img_buffer, format='PNG')
            img_buffer.seek(0)
            logo = RLImage(img_buffer, width=2*inch, height=1*inch)
            elements.append(logo)
            elements.append(Spacer(1, 0.3*inch))
        except:
            pass
    
    # Title
    company_name = config.get('company_name', 'ITSM System') if config else 'ITSM System'
    title = Paragraph(f"{company_name}<br/>Reporte de Tickets", title_style)
    elements.append(title)
    elements.append(Spacer(1, 0.3*inch))
    
    # Date range
    if start_date and end_date:
        date_text = Paragraph(f"Período: {start_date} a {end_date}", styles['Normal'])
        elements.append(date_text)
        elements.append(Spacer(1, 0.2*inch))
    
    # Table data
    data = [['ID', 'Título', 'Tipo', 'Estado', 'Fecha Creación']]
    for ticket in tickets:
        created_at = ticket['created_at']
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at)
        
        data.append([
            ticket['id'][:8],
            ticket['title'][:30],
            ticket['ticket_type'],
            ticket['status'],
            created_at.strftime('%Y-%m-%d')
        ])
    
    table = Table(data, colWidths=[1*inch, 2.5*inch, 1*inch, 1*inch, 1.2*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a56db')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    elements.append(table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Summary
    summary = Paragraph(f"<b>Total de tickets:</b> {len(tickets)}", styles['Normal'])
    elements.append(summary)
    
    doc.build(elements)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=tickets_report.pdf"}
    )


@api_router.get("/reports/assets/pdf")
async def generate_assets_pdf(
    company_id: Optional[str] = None,
    status: Optional[str] = None,
    asset_type: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    query = {}
    if current_user.role == 'client':
        query['company_id'] = current_user.company_id
    elif company_id:
        query['company_id'] = company_id
    
    if status:
        query['status'] = status
    if asset_type:
        query['asset_type'] = asset_type
    
    assets = await db.assets.find(query, {"_id": 0}).to_list(1000)
    
    # Get companies info
    companies = {}
    company_ids = list(set([asset['company_id'] for asset in assets]))
    for cid in company_ids:
        company = await db.companies.find_one({"id": cid}, {"_id": 0})
        if company:
            companies[cid] = company['name']
    
    # Get system config for logo
    config = await db.system_config.find_one({"id": "system_config"}, {"_id": 0})
    
    # Create PDF
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    elements = []
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1a56db'),
        spaceAfter=30,
        alignment=1
    )
    
    # Add logo if exists
    if config and config.get('logo_base64'):
        try:
            img_data = base64.b64decode(config['logo_base64'].split(',')[1])
            img = Image.open(BytesIO(img_data))
            img_buffer = BytesIO()
            img.save(img_buffer, format='PNG')
            img_buffer.seek(0)
            logo = RLImage(img_buffer, width=2*inch, height=1*inch)
            elements.append(logo)
            elements.append(Spacer(1, 0.3*inch))
        except:
            pass
    
    # Title
    company_name = config.get('company_name', 'ITSM System') if config else 'ITSM System'
    title = Paragraph(f"{company_name}<br/>Reporte de Activos", title_style)
    elements.append(title)
    elements.append(Spacer(1, 0.3*inch))
    
    # Group assets by company
    assets_by_company = {}
    for asset in assets:
        cid = asset['company_id']
        if cid not in assets_by_company:
            assets_by_company[cid] = []
        assets_by_company[cid].append(asset)
    
    # Generate table for each company
    for cid, company_assets in assets_by_company.items():
        company_title = Paragraph(f"<b>Empresa: {companies.get(cid, 'Desconocida')}</b>", styles['Heading2'])
        elements.append(company_title)
        elements.append(Spacer(1, 0.2*inch))
        
        # Table data
        data = [['Tipo', 'Modelo', 'S/N', 'Host', 'Ubicación', 'Estado']]
        for asset in company_assets:
            data.append([
                (asset.get('asset_type') or '')[:15],
                (asset.get('model') or '')[:15],
                (asset.get('serial_number') or '')[:15],
                (asset.get('host_name') or '')[:15],
                (asset.get('location') or '')[:15],
                (asset.get('status') or '')[:10]
            ])
        
        table = Table(data, colWidths=[1*inch, 1.2*inch, 1.2*inch, 1.2*inch, 1.5*inch, 0.8*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a56db')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTSIZE', (0, 1), (-1, -1), 8)
        ]))
        
        elements.append(table)
        elements.append(Spacer(1, 0.3*inch))
        
        # Summary for this company
        summary = Paragraph(f"<b>Total de activos:</b> {len(company_assets)}", styles['Normal'])
        elements.append(summary)
        elements.append(Spacer(1, 0.5*inch))
    
    # Overall summary
    total_summary = Paragraph(f"<b>Total general de activos:</b> {len(assets)}", styles['Heading3'])
    elements.append(total_summary)
    
    doc.build(elements)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=assets_report.pdf"}
    )


# ==================== SYSTEM CONFIG ROUTES ====================

@api_router.get("/system/config", response_model=SystemConfig)
async def get_system_config(current_user: User = Depends(get_current_user)):
    config = await db.system_config.find_one({"id": "system_config"}, {"_id": 0})
    if not config:
        config = SystemConfig().model_dump()
        config['updated_at'] = config['updated_at'].isoformat()
        await db.system_config.insert_one(config)
    
    if isinstance(config['updated_at'], str):
        config['updated_at'] = datetime.fromisoformat(config['updated_at'])
    
    return SystemConfig(**config)

@api_router.put("/system/config", response_model=SystemConfig)
async def update_system_config(config_data: SystemConfigUpdate, current_user: User = Depends(get_current_user)):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Only admins can update system config")
    
    update_data = config_data.model_dump(exclude_unset=True)
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    result = await db.system_config.update_one(
        {"id": "system_config"},
        {"$set": update_data},
        upsert=True
    )
    
    updated = await db.system_config.find_one({"id": "system_config"}, {"_id": 0})
    if isinstance(updated['updated_at'], str):
        updated['updated_at'] = datetime.fromisoformat(updated['updated_at'])
    
    return SystemConfig(**updated)

@api_router.post("/system/upload-logo")
async def upload_logo(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Only admins can upload logo")
    
    contents = await file.read()
    base64_str = base64.b64encode(contents).decode('utf-8')
    logo_base64 = f"data:{file.content_type};base64,{base64_str}"
    
    await db.system_config.update_one(
        {"id": "system_config"},
        {"$set": {
            "logo_base64": logo_base64,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    return {"message": "Logo uploaded successfully", "logo_base64": logo_base64}


# ==================== USER MANAGEMENT ====================

@api_router.get("/users", response_model=List[User])
async def get_users(current_user: User = Depends(get_current_user)):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Only admins can view all users")
    
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    
    for user in users:
        if isinstance(user['created_at'], str):
            user['created_at'] = datetime.fromisoformat(user['created_at'])
    
    return users

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Only admins can delete users")
    
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User deleted successfully"}


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
