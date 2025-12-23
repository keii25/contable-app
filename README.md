
# Aplicación Contable

Una aplicación web para gestión contable con autenticación de usuarios y control de transacciones.

## 🚀 Características

- **Autenticación de usuarios** con roles (admin, editor, lector)
- **Gestión de transacciones** (ingresos y egresos)
- **Dashboard** con estadísticas y gráficos
- **Reportes** y análisis financiero
- **Exportación a PDF**
- **Base de datos Supabase** para persistencia de datos

## 📋 Prerrequisitos

- Node.js 16+
- Un proyecto en [Supabase](https://supabase.com)

## 🛠️ Configuración

### 1. Clona el repositorio
```bash
git clone <url-del-repositorio>
cd aplicacion-contable
```

### 2. Instala las dependencias
```bash
npm install
```

### 3. Configura Supabase

#### a. Crea un proyecto en Supabase
1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Espera a que se configure completamente

#### b. Ejecuta las migraciones de base de datos
1. Ve a la sección "SQL Editor" en tu proyecto de Supabase
2. Copia y pega el contenido del archivo `supabase-migrations.sql`
3. Ejecuta el script para crear las tablas

#### c. Configura las variables de entorno
1. Copia el archivo `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edita el archivo `.env` con tus credenciales de Supabase:
   ```
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key
   ```

   Puedes encontrar estas credenciales en:
   - **URL**: Settings → API → Project URL
   - **Anon Key**: Settings → API → Project API keys → anon public

### 4. Inicia la aplicación
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5174`

## �️ Modo Local (Sin Supabase)

Si no tienes configurado Supabase, la aplicación funcionará automáticamente en **modo local** usando `localStorage`:

### Características del Modo Local:
- ✅ Autenticación con localStorage
- ✅ Gestión de usuarios
- ✅ Almacenamiento de transacciones
- ✅ Todas las funcionalidades disponibles
- ❌ Sin sincronización entre dispositivos
- ❌ Sin respaldo en la nube

### Credenciales por Defecto (Modo Local):
- **Usuario:** `admin`
- **Contraseña:** `admin123*`

### Para Usar Modo Local:
1. **No configures** las variables de entorno de Supabase
2. **O deja vacío** el archivo `.env`
3. La aplicación detectará automáticamente y usará localStorage

### Cambiar entre Modos:
- **Modo Supabase:** Configura `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
- **Modo Local:** Deja las variables vacías o elimina el archivo `.env`

## 📁 Estructura del proyecto

```
src/
├── components/          # Componentes reutilizables
├── context/            # Contextos de React (Auth)
├── lib/               # Utilidades y configuración
├── pages/             # Páginas de la aplicación
├── routes/            # Rutas principales
├── services/          # Servicios (API calls)
├── store/             # Estado global (Redux)
└── types.ts           # Definiciones de tipos
```

## 🔧 Tecnologías utilizadas

- **Frontend:** React 18, TypeScript, Tailwind CSS
- **Estado:** Redux Toolkit
- **Backend:** Supabase (PostgreSQL)
- **Build:** Vite
- **PDF:** jsPDF
- **Gráficos:** SVG nativo

## 📊 Funcionalidades

### Autenticación
- Login/logout
- Control de acceso basado en roles
- Gestión de usuarios (solo admin)

### Transacciones
- Agregar ingresos y egresos
- Editar y eliminar transacciones
- Filtros por fecha, cuenta, etc.
- Validaciones de datos

### Dashboard
- Estadísticas generales
- Gráficos de ingresos vs egresos
- Saldos por período

### Reportes
- Análisis detallado
- Exportación a PDF

## 🔒 Seguridad

- Autenticación basada en JWT (Supabase)
- Row Level Security (RLS) en base de datos
- Validación de datos en frontend y backend
- Control de acceso basado en roles

## 🚀 Despliegue

### Build de producción
```bash
npm run build
```

### Preview del build
```bash
npm run preview
```

Los archivos de producción estarán en la carpeta `dist/`.

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.
