# 🏗️ Arquitectura del Sistema

## Visión General

```mermaid
graph TB
    subgraph Frontend["Frontend (React + Vite)"]
        UI[Componentes UI]
        API[api.ts]
        Auth[authService.ts]
    end

    subgraph Backend["Backend (FastAPI)"]
        Main[main.py]
        Routers[Routers]
        Models[Models]
        DB[(SQLite)]
    end

    subgraph External["Servicios Externos"]
        Gemini[Google Gemini AI]
        Drive[Google Drive]
        Email[Email SMTP]
    end

    UI --> API
    API --> Auth
    Auth --> Main
    Main --> Routers
    Routers --> Models
    Models --> DB
    Routers --> Gemini
    Routers --> Drive
    Routers --> Email
```

## Módulos del Backend

### Routers (Endpoints)

| Router | Ruta Base | Descripción |
|--------|-----------|-------------|
| `auth.py` | `/auth` | Login, registro, tokens JWT |
| `licenses.py` | `/licenses` | CRUD completo de licencias |
| `ai.py` | `/ai` | Análisis con Gemini |
| `drive.py` | `/drive` | Sincronización Google Drive |
| `logs.py` | `/logs` | Auditoría de acciones |
| `purchases.py` | `/purchases` | Gestión de compras |
| `appointments.py` | `/appointments` | Citas y turnos |
| `public.py` | `/public` | Portal público |

### Modelos de Datos

```mermaid
erDiagram
    User {
        int id PK
        string username UK
        string password_hash
        string role
        string email
        datetime created_at
    }
    
    License {
        int id PK
        string rut UK
        string nombre
        string tipo_licencia
        string estado
        datetime fecha_solicitud
        datetime fecha_emision
    }
    
    Purchase {
        int id PK
        string descripcion
        float monto
        string estado
        int user_id FK
    }
    
    AuditLog {
        int id PK
        string action
        string details
        int user_id FK
        datetime timestamp
    }
    
    User ||--o{ Purchase : "crea"
    User ||--o{ AuditLog : "genera"
```

## Flujo de Autenticación

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend
    participant B as Backend
    participant DB as Database

    U->>F: Ingresa credenciales
    F->>B: POST /auth/login
    B->>DB: Verificar usuario
    DB-->>B: Usuario válido
    B->>B: Generar JWT
    B-->>F: Token + datos usuario
    F->>F: Guardar en localStorage
    F-->>U: Redirigir a Dashboard
```

## Componentes Frontend

### Principales

| Componente | Descripción |
|------------|-------------|
| `App.tsx` | Enrutamiento y layout principal |
| `LoginScreen.tsx` | Autenticación de usuarios |
| `LicenseTable.tsx` | Tabla principal con filtros |
| `UploadArea.tsx` | Carga de Excel/XML |
| `AnalyticsDashboard.tsx` | Gráficos y estadísticas |

### Módulos Especiales

| Componente | Función |
|------------|---------|
| `Module12.tsx` | Entrega de licencias |
| `Module16.tsx` | Resolución de problemas |
| `DriveSyncArea.tsx` | Sincronización con Drive |
| `PurchasesManagement.tsx` | Gestión de compras |

## Estados de Licencia

```mermaid
stateDiagram-v2
    [*] --> PENDIENTE: Solicitud recibida
    PENDIENTE --> EN_PROCESO: Iniciar trámite
    EN_PROCESO --> APROBADA: Aprobar
    EN_PROCESO --> RECHAZADA: Rechazar
    APROBADA --> LISTA_PARA_ENTREGA: Imprimir
    LISTA_PARA_ENTREGA --> ENTREGADA: Entregar
    ENTREGADA --> [*]
    RECHAZADA --> [*]
```

## Seguridad

- **JWT**: Tokens con expiración de 24 horas
- **Bcrypt**: Hash de contraseñas
- **CORS**: Configurado para dominios permitidos
- **Roles**: Control de acceso por rol (admin/operator/viewer)

## Despliegue

```mermaid
graph LR
    GitHub[GitHub Repo] --> Vercel[Vercel]
    Vercel --> Frontend[Frontend Build]
    Vercel --> Backend[Backend API]
    Backend --> SQLite[(SQLite DB)]
```

---

> Última actualización: Enero 2026
