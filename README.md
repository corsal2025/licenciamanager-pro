# 🚗 Licencia Manager Pro

Sistema integral de gestión de licencias de conducir para municipalidades chilenas.

## 📋 Descripción

**Licencia Manager Pro** es una aplicación web full-stack diseñada para gestionar el proceso completo de emisión, seguimiento y entrega de licencias de conducir. Incluye:

- 📊 Dashboard con estadísticas en tiempo real
- 📁 Procesamiento de archivos Excel y XML
- 🤖 Análisis con IA (Gemini)
- 📅 Gestión de citas
- 💰 Módulo de compras
- 📧 Notificaciones (Email/WhatsApp)
- 👥 Gestión de usuarios con roles
- 🔐 Autenticación JWT

## 🛠️ Tecnologías

| Componente | Tecnología |
|------------|------------|
| **Frontend** | React + TypeScript + Vite |
| **Estilos** | TailwindCSS |
| **Backend** | Python + FastAPI |
| **Base de datos** | SQLite |
| **IA** | Google Gemini API |
| **Despliegue** | Vercel |

## 📁 Estructura del Proyecto

```
licenciamanager-pro/
├── backend/                 # API FastAPI
│   ├── main.py             # Entrada principal
│   ├── database.py         # Configuración SQLite
│   ├── models.py           # Modelos SQLAlchemy
│   ├── schemas.py          # Schemas Pydantic
│   └── routers/            # Endpoints por módulo
│       ├── auth.py         # Autenticación
│       ├── licenses.py     # CRUD de licencias
│       ├── ai.py           # Integración Gemini
│       ├── drive.py        # Google Drive
│       ├── logs.py         # Auditoría
│       ├── purchases.py    # Compras
│       └── appointments.py # Citas
├── components/             # Componentes React
│   ├── App.tsx            # Componente principal
│   ├── LoginScreen.tsx    # Autenticación
│   ├── LicenseTable.tsx   # Tabla de licencias
│   ├── UploadArea.tsx     # Carga de archivos
│   └── ...                # +15 componentes más
├── services/              # Servicios frontend
│   ├── api.ts            # Cliente HTTP
│   └── authService.ts    # Autenticación
└── types.ts              # Tipos TypeScript
```

## 🚀 Instalación

### Requisitos Previos
- Node.js >= 18
- Python >= 3.10
- pip

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
uvicorn backend.main:app --reload
```

### Frontend

```bash
npm install
npm run dev
```

## ⚙️ Variables de Entorno

Crear archivo `.env`:

```env
# Backend
SECRET_KEY=tu_clave_secreta
GEMINI_API_KEY=tu_api_key_gemini

# Frontend
VITE_API_URL=http://localhost:8000
```

## 🔗 URLs

- **Frontend (dev)**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Producción**: https://licenciamanager-pro.vercel.app

## 👥 Roles de Usuario

| Rol | Permisos |
|-----|----------|
| `admin` | Acceso completo, gestión de usuarios |
| `operator` | Gestión de licencias, sin admin |
| `viewer` | Solo lectura |

## 📄 Licencia

Proyecto privado - Municipalidad de Chile

---

> Desarrollado con ❤️ para automatizar procesos municipales
