import React, { createContext, useContext, useState, useEffect } from 'react';

/* ------------------------------------------------------------------ */
/*  Interfaces                                                        */
/* ------------------------------------------------------------------ */
export interface PermisoModulo {
  modulo: 'Activos' | 'Traslados' | 'Mantenimientos' | 'Bajas' | 'Reportes' | 'Administracion';
  ver: boolean;
  crear: boolean;
  editar: boolean;
  eliminar: boolean;
}

export interface RolHEP {
  id: string;
  nombre: string;
  descripcion: string;
  esRolBase: boolean;
  permisos: PermisoModulo[];
  fechaCreacion: string;
}

export interface UsuarioHEP {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  cedula: string;
  rolId: string;
  rolNombre: string;
  departamento: string;
  estado: 'Activo' | 'Inactivo' | 'Bloqueado';
  ultimoAcceso: string;
  creadoPor: string;
  fechaCreacion: string;
}

export interface CatalogoItem {
  id: string;
  tipo: 'Categoria' | 'Ubicacion' | 'Motivo';
  nombre: string;
  descripcion: string;
  activo: boolean;
  fechaCreacion: string;
}

export interface EventoAuditoria {
  id: string;
  fecha: string;
  usuario: string;
  rol: string;
  accion: string;
  modulo: string;
  detalle: string;
  ipOrigen: string;
  resultado: 'Exitoso' | 'Fallido';
}

/* ------------------------------------------------------------------ */
/*  Mocks Iniciales                                                    */
/* ------------------------------------------------------------------ */
const MOCK_ROLES_INICIALES: RolHEP[] = [
  {
    id: 'rol-base-adm-ges',
    nombre: 'Gestión Administrativa',
    descripcion: 'Rol de consulta y supervisión para personal administrativo.',
    esRolBase: true,
    fechaCreacion: '2026-06-01T08:00:00.000Z',
    permisos: [
      { modulo: 'Activos', ver: true, crear: false, editar: false, eliminar: false },
      { modulo: 'Traslados', ver: true, crear: false, editar: false, eliminar: false },
      { modulo: 'Mantenimientos', ver: true, crear: false, editar: false, eliminar: false },
      { modulo: 'Bajas', ver: true, crear: false, editar: false, eliminar: false },
      { modulo: 'Reportes', ver: true, crear: false, editar: false, eliminar: false },
      { modulo: 'Administracion', ver: false, crear: false, editar: false, eliminar: false }
    ]
  },
  {
    id: 'rol-base-fin',
    nombre: 'Gestión Financiera',
    descripcion: 'Rol de supervisión de presupuestos y depreciación.',
    esRolBase: true,
    fechaCreacion: '2026-06-01T08:00:00.000Z',
    permisos: [
      { modulo: 'Activos', ver: true, crear: false, editar: false, eliminar: false },
      { modulo: 'Traslados', ver: true, crear: false, editar: false, eliminar: false },
      { modulo: 'Mantenimientos', ver: true, crear: false, editar: false, eliminar: false },
      { modulo: 'Bajas', ver: true, crear: false, editar: false, eliminar: false },
      { modulo: 'Reportes', ver: true, crear: false, editar: false, eliminar: false },
      { modulo: 'Administracion', ver: false, crear: false, editar: false, eliminar: false }
    ]
  },
  {
    id: 'rol-base-act',
    nombre: 'Activo Fijo',
    descripcion: 'Personal encargado de la gestión global del inventario y ciclo de activos.',
    esRolBase: true,
    fechaCreacion: '2026-06-01T08:00:00.000Z',
    permisos: [
      { modulo: 'Activos', ver: true, crear: true, editar: true, eliminar: true },
      { modulo: 'Traslados', ver: true, crear: true, editar: true, eliminar: false },
      { modulo: 'Mantenimientos', ver: true, crear: true, editar: true, eliminar: false },
      { modulo: 'Bajas', ver: true, crear: true, editar: true, eliminar: false },
      { modulo: 'Reportes', ver: true, crear: true, editar: true, eliminar: false },
      { modulo: 'Administracion', ver: true, crear: false, editar: false, eliminar: false }
    ]
  },
  {
    id: 'rol-base-tic',
    nombre: 'TICs',
    descripcion: 'Administrador técnico global con control de usuarios y configuraciones.',
    esRolBase: true,
    fechaCreacion: '2026-06-01T08:00:00.000Z',
    permisos: [
      { modulo: 'Activos', ver: true, crear: true, editar: true, eliminar: true },
      { modulo: 'Traslados', ver: true, crear: true, editar: true, eliminar: true },
      { modulo: 'Mantenimientos', ver: true, crear: true, editar: true, eliminar: true },
      { modulo: 'Bajas', ver: true, crear: true, editar: true, eliminar: true },
      { modulo: 'Reportes', ver: true, crear: true, editar: true, eliminar: true },
      { modulo: 'Administracion', ver: true, crear: true, editar: true, eliminar: true }
    ]
  },
  {
    id: 'rol-base-maint',
    nombre: 'Mantenimiento',
    descripcion: 'Personal técnico de la unidad de soporte físico y electromecánico.',
    esRolBase: true,
    fechaCreacion: '2026-06-01T08:00:00.000Z',
    permisos: [
      { modulo: 'Activos', ver: true, crear: false, editar: false, eliminar: false },
      { modulo: 'Traslados', ver: false, crear: false, editar: false, eliminar: false },
      { modulo: 'Mantenimientos', ver: true, crear: true, editar: true, eliminar: false },
      { modulo: 'Bajas', ver: false, crear: false, editar: false, eliminar: false },
      { modulo: 'Reportes', ver: false, crear: false, editar: false, eliminar: false },
      { modulo: 'Administracion', ver: false, crear: false, editar: false, eliminar: false }
    ]
  },
  {
    id: 'rol-base-admin',
    nombre: 'Administrador',
    descripcion: 'Rol administrativo de control total para personal de soporte del hospital.',
    esRolBase: true,
    fechaCreacion: '2026-06-01T08:00:00.000Z',
    permisos: [
      { modulo: 'Activos', ver: true, crear: true, editar: true, eliminar: true },
      { modulo: 'Traslados', ver: true, crear: true, editar: true, eliminar: true },
      { modulo: 'Mantenimientos', ver: true, crear: true, editar: true, eliminar: true },
      { modulo: 'Bajas', ver: true, crear: true, editar: true, eliminar: true },
      { modulo: 'Reportes', ver: true, crear: true, editar: true, eliminar: true },
      { modulo: 'Administracion', ver: true, crear: true, editar: true, eliminar: true }
    ]
  }
];

const MOCK_USUARIOS_INICIALES: UsuarioHEP[] = [
  {
    id: 'usr-mock-1',
    nombres: 'Ing. Carlos',
    apellidos: 'Ortega',
    email: 'carlos.ortega@hospital.gob.ec',
    cedula: '1312345678',
    rolId: 'rol-base-tic',
    rolNombre: 'TICs',
    departamento: 'Tecnologías de la Información',
    estado: 'Activo',
    ultimoAcceso: '2026-06-20T09:45:00.000Z',
    creadoPor: 'Sistema',
    fechaCreacion: '2026-06-01T08:30:00.000Z'
  },
  {
    id: 'usr-mock-2',
    nombres: 'Lcda. Sofía',
    apellidos: 'Ponce',
    email: 'sofia.ponce@hospital.gob.ec',
    cedula: '1318765432',
    rolId: 'rol-base-admin',
    rolNombre: 'Administrador',
    departamento: 'Soporte Administrativo',
    estado: 'Activo',
    ultimoAcceso: '2026-06-19T14:20:00.000Z',
    creadoPor: 'Sistema',
    fechaCreacion: '2026-06-01T08:35:00.000Z'
  },
  {
    id: 'usr-mock-3',
    nombres: 'Ing. Marcos',
    apellidos: 'Silva',
    email: 'marcos.silva@hospital.gob.ec',
    cedula: '1319988776',
    rolId: 'rol-base-act',
    rolNombre: 'Activo Fijo',
    departamento: 'Control de Activos',
    estado: 'Activo',
    ultimoAcceso: '2026-06-20T08:10:00.000Z',
    creadoPor: 'Ing. Carlos Ortega',
    fechaCreacion: '2026-06-02T10:00:00.000Z'
  },
  {
    id: 'usr-mock-4',
    nombres: 'Ing. Juan',
    apellidos: 'Pérez',
    email: 'juan.perez@hospital.gob.ec',
    cedula: '1311122334',
    rolId: 'rol-base-maint',
    rolNombre: 'Mantenimiento',
    departamento: 'Ingeniería Clínica',
    estado: 'Activo',
    ultimoAcceso: '2026-06-20T07:30:00.000Z',
    creadoPor: 'Lcda. Sofía Ponce',
    fechaCreacion: '2026-06-03T11:00:00.000Z'
  },
  {
    id: 'usr-mock-5',
    nombres: 'Dra. Elena',
    apellidos: 'Larrea',
    email: 'elena.larrea@hospital.gob.ec',
    cedula: '1315566778',
    rolId: 'rol-base-adm-ges',
    rolNombre: 'Gestión Administrativa',
    departamento: 'Dirección Médica',
    estado: 'Activo',
    ultimoAcceso: '2026-06-18T16:40:00.000Z',
    creadoPor: 'Ing. Carlos Ortega',
    fechaCreacion: '2026-06-04T09:15:00.000Z'
  },
  {
    id: 'usr-mock-6',
    nombres: 'Lcda. María',
    apellidos: 'Gómez',
    email: 'maria.gomez@hospital.gob.ec',
    cedula: '1313344556',
    rolId: 'rol-base-fin',
    rolNombre: 'Gestión Financiera',
    departamento: 'Financiero',
    estado: 'Activo',
    ultimoAcceso: '2026-06-19T11:00:00.000Z',
    creadoPor: 'Lcda. Sofía Ponce',
    fechaCreacion: '2026-06-05T14:20:00.000Z'
  },
  {
    id: 'usr-mock-7',
    nombres: 'Dr. Héctor',
    apellidos: 'Salas',
    email: 'hector.salas@hospital.gob.ec',
    cedula: '1314455667',
    rolId: 'rol-base-act',
    rolNombre: 'Activo Fijo',
    departamento: 'Bodega General',
    estado: 'Inactivo',
    ultimoAcceso: '2026-06-10T10:00:00.000Z',
    creadoPor: 'Ing. Carlos Ortega',
    fechaCreacion: '2026-06-02T10:30:00.000Z'
  },
  {
    id: 'usr-mock-8',
    nombres: 'Mgs. Belén',
    apellidos: 'Villao',
    email: 'belen.villao@hospital.gob.ec',
    cedula: '1316677889',
    rolId: 'rol-base-maint',
    rolNombre: 'Mantenimiento',
    departamento: 'Servicios Generales',
    estado: 'Bloqueado',
    ultimoAcceso: '',
    creadoPor: 'Lcda. Sofía Ponce',
    fechaCreacion: '2026-06-08T15:00:00.000Z'
  }
];

const MOCK_CATALOGOS_INICIALES: CatalogoItem[] = [
  // 5 Categorías
  {
    id: 'cat-mock-1',
    tipo: 'Categoria',
    nombre: 'Equipos Médicos',
    descripcion: 'Dispositivos y maquinarias de uso clínico y quirúrgico.',
    activo: true,
    fechaCreacion: '2026-06-01T08:00:00.000Z'
  },
  {
    id: 'cat-mock-2',
    tipo: 'Categoria',
    nombre: 'Mobiliario',
    descripcion: 'Muebles de oficina, consultorios y hospitalización.',
    activo: true,
    fechaCreacion: '2026-06-01T08:00:00.000Z'
  },
  {
    id: 'cat-mock-3',
    tipo: 'Categoria',
    nombre: 'Equipos de Cómputo',
    descripcion: 'Computadoras, servidores, impresoras y accesorios.',
    activo: true,
    fechaCreacion: '2026-06-01T08:00:00.000Z'
  },
  {
    id: 'cat-mock-4',
    tipo: 'Categoria',
    nombre: 'Vehículos',
    descripcion: 'Ambulancias y unidades de logística interna.',
    activo: true,
    fechaCreacion: '2026-06-01T08:00:00.000Z'
  },
  {
    id: 'cat-mock-5',
    tipo: 'Categoria',
    nombre: 'Equipos de Monitoreo',
    descripcion: 'Monitores de signos vitales, telemetría y sensores.',
    activo: true,
    fechaCreacion: '2026-06-01T08:00:00.000Z'
  },
  // 4 Ubicaciones
  {
    id: 'cat-mock-6',
    tipo: 'Ubicacion',
    nombre: 'UCI',
    descripcion: 'Unidad de Cuidados Intensivos.',
    activo: true,
    fechaCreacion: '2026-06-01T08:00:00.000Z'
  },
  {
    id: 'cat-mock-7',
    tipo: 'Ubicacion',
    nombre: 'Quirófano A',
    descripcion: 'Sala de cirugía mayor ambulatoria.',
    activo: true,
    fechaCreacion: '2026-06-01T08:00:00.000Z'
  },
  {
    id: 'cat-mock-8',
    tipo: 'Ubicacion',
    nombre: 'Emergencias',
    descripcion: 'Sala de urgencias médicas y triaje.',
    activo: true,
    fechaCreacion: '2026-06-01T08:00:00.000Z'
  },
  {
    id: 'cat-mock-9',
    tipo: 'Ubicacion',
    nombre: 'TICs',
    descripcion: 'Departamento de desarrollo y soporte técnico.',
    activo: true,
    fechaCreacion: '2026-06-01T08:00:00.000Z'
  },
  // 3 Motivos
  {
    id: 'cat-mock-10',
    tipo: 'Motivo',
    nombre: 'Reasignación',
    descripcion: 'Cambio definitivo del custodio o ubicación física.',
    activo: true,
    fechaCreacion: '2026-06-01T08:00:00.000Z'
  },
  {
    id: 'cat-mock-11',
    tipo: 'Motivo',
    nombre: 'Mantenimiento',
    descripcion: 'Traslado provisional al taller técnico.',
    activo: true,
    fechaCreacion: '2026-06-01T08:00:00.000Z'
  },
  {
    id: 'cat-mock-12',
    tipo: 'Motivo',
    nombre: 'Préstamo Temporal',
    descripcion: 'Cesión transitoria entre departamentos clínicos.',
    activo: true,
    fechaCreacion: '2026-06-01T08:00:00.000Z'
  }
];

const MOCK_AUDITORIA_INICIALES: EventoAuditoria[] = [
  {
    id: 'aud-mock-15',
    fecha: '2026-06-20T09:45:00.000Z',
    usuario: 'carlos.ortega@hospital.gob.ec',
    rol: 'TICs',
    accion: 'Inicio de sesión',
    modulo: 'Administracion',
    detalle: 'Ingreso exitoso al sistema vía Web.',
    ipOrigen: '192.168.1.45',
    resultado: 'Exitoso'
  },
  {
    id: 'aud-mock-14',
    fecha: '2026-06-20T08:50:00.000Z',
    usuario: 'marcos.silva@hospital.gob.ec',
    rol: 'Activo Fijo',
    accion: 'Registró un activo',
    modulo: 'Activos',
    detalle: 'Registro de nuevo activo Ventilador Mecánico (Código: ACT-0001).',
    ipOrigen: '192.168.1.80',
    resultado: 'Exitoso'
  },
  {
    id: 'aud-mock-13',
    fecha: '2026-06-20T07:45:00.000Z',
    usuario: 'juan.perez@hospital.gob.ec',
    rol: 'Mantenimiento',
    accion: 'Inició mantenimiento',
    modulo: 'Mantenimientos',
    detalle: 'Cambio de estado a "En Proceso" para el mantenimiento MP-2026-0001.',
    ipOrigen: '192.168.2.115',
    resultado: 'Exitoso'
  },
  {
    id: 'aud-mock-12',
    fecha: '2026-06-19T14:35:00.000Z',
    usuario: 'sofia.ponce@hospital.gob.ec',
    rol: 'Administrador',
    accion: 'Aprobó traslado',
    modulo: 'Traslados',
    detalle: 'Aprobó ejecución de traslado TR-2026-0004.',
    ipOrigen: '192.168.1.12',
    resultado: 'Exitoso'
  },
  {
    id: 'aud-mock-11',
    fecha: '2026-06-19T10:15:00.000Z',
    usuario: 'carlos.ortega@hospital.gob.ec',
    rol: 'TICs',
    accion: 'Creación de usuario',
    modulo: 'Administracion',
    detalle: 'Creación de nuevo usuario Dra. Elena Larrea.',
    ipOrigen: '192.168.1.45',
    resultado: 'Exitoso'
  },
  {
    id: 'aud-mock-10',
    fecha: '2026-06-19T09:00:00.000Z',
    usuario: 'carlos.ortega@hospital.gob.ec',
    rol: 'TICs',
    accion: 'Intento fallido de acceso',
    modulo: 'Administracion',
    detalle: 'Intento de acceso fallido con contraseña incorrecta para usuario: admin@hospital.gob.ec.',
    ipOrigen: '192.168.1.189',
    resultado: 'Fallido'
  },
  {
    id: 'aud-mock-9',
    fecha: '2026-06-18T15:30:00.000Z',
    usuario: 'marcos.silva@hospital.gob.ec',
    rol: 'Activo Fijo',
    accion: 'Generación de reporte Excel',
    modulo: 'Reportes',
    detalle: 'Descarga de reporte de Activos consolidado.',
    ipOrigen: '192.168.1.80',
    resultado: 'Exitoso'
  },
  {
    id: 'aud-mock-8',
    fecha: '2026-06-18T11:20:00.000Z',
    usuario: 'elena.larrea@hospital.gob.ec',
    rol: 'Gestión Administrativa',
    accion: 'Inicio de sesión',
    modulo: 'Administracion',
    detalle: 'Ingreso al sistema.',
    ipOrigen: '192.168.3.10',
    resultado: 'Exitoso'
  },
  {
    id: 'aud-mock-7',
    fecha: '2026-06-17T16:00:00.000Z',
    usuario: 'sofia.ponce@hospital.gob.ec',
    rol: 'Administrador',
    accion: 'Edición de rol',
    modulo: 'Administracion',
    detalle: 'Modificación de permisos del rol base "Mantenimiento".',
    ipOrigen: '192.168.1.12',
    resultado: 'Exitoso'
  },
  {
    id: 'aud-mock-6',
    fecha: '2026-06-16T14:40:00.000Z',
    usuario: 'marcos.silva@hospital.gob.ec',
    rol: 'Activo Fijo',
    accion: 'Registró traslado',
    modulo: 'Traslados',
    detalle: 'Registro de solicitud de traslado para ACT-0002.',
    ipOrigen: '192.168.1.80',
    resultado: 'Exitoso'
  },
  {
    id: 'aud-mock-5',
    fecha: '2026-06-15T11:30:00.000Z',
    usuario: 'maria.gomez@hospital.gob.ec',
    rol: 'Gestión Financiera',
    accion: 'Consulta de depreciación',
    modulo: 'Reportes',
    detalle: 'Consulta del reporte financiero de depreciación de activos del periodo.',
    ipOrigen: '192.168.1.99',
    resultado: 'Exitoso'
  },
  {
    id: 'aud-mock-4',
    fecha: '2026-06-14T10:00:00.000Z',
    usuario: 'carlos.ortega@hospital.gob.ec',
    rol: 'TICs',
    accion: 'Cambio de estado usuario',
    modulo: 'Administracion',
    detalle: 'Usuario Dr. Héctor Salas marcado como Inactivo.',
    ipOrigen: '192.168.1.45',
    resultado: 'Exitoso'
  },
  {
    id: 'aud-mock-3',
    fecha: '2026-06-12T16:15:00.000Z',
    usuario: 'marcos.silva@hospital.gob.ec',
    rol: 'Activo Fijo',
    accion: 'Aprobó informe de baja',
    modulo: 'Bajas',
    detalle: 'Aprobación del informe técnico para baja de electrocardiógrafo.',
    ipOrigen: '192.168.1.80',
    resultado: 'Exitoso'
  },
  {
    id: 'aud-mock-2',
    fecha: '2026-06-10T14:00:00.000Z',
    usuario: 'sofia.ponce@hospital.gob.ec',
    rol: 'Administrador',
    accion: 'Agregar ítem catálogo',
    modulo: 'Administracion',
    detalle: 'Se agrega la categoría: "Equipos de Monitoreo".',
    ipOrigen: '192.168.1.12',
    resultado: 'Exitoso'
  },
  {
    id: 'aud-mock-1',
    fecha: '2026-06-09T09:10:00.000Z',
    usuario: 'marcos.silva@hospital.gob.ec',
    rol: 'Activo Fijo',
    accion: 'Edición de activo',
    modulo: 'Activos',
    detalle: 'Edición de datos descriptivos del activo ACT-0005.',
    ipOrigen: '192.168.1.80',
    resultado: 'Exitoso'
  }
];

/* ------------------------------------------------------------------ */
/*  Tipado del Contexto                                               */
/* ------------------------------------------------------------------ */
interface AdministracionContextType {
  // ROLES
  roles: RolHEP[];
  actualizarPermisosRol: (rolId: string, permisos: PermisoModulo[]) => void;
  crearRol: (data: Omit<RolHEP, 'id' | 'esRolBase' | 'fechaCreacion'>) => void;
  obtenerRolPorId: (id: string) => RolHEP | undefined;

  // USUARIOS
  usuarios: UsuarioHEP[];
  crearUsuario: (data: Omit<UsuarioHEP, 'id' | 'fechaCreacion' | 'ultimoAcceso' | 'rolNombre'>) => void;
  actualizarUsuario: (usuario: UsuarioHEP) => void;
  cambiarEstadoUsuario: (id: string, estado: 'Activo' | 'Inactivo' | 'Bloqueado') => void;
  obtenerUsuarioPorId: (id: string) => UsuarioHEP | undefined;

  // CATÁLOGOS
  catalogos: CatalogoItem[];
  catalogosPorTipo: (tipo: 'Categoria' | 'Ubicacion' | 'Motivo') => CatalogoItem[];
  agregarCatalogoItem: (data: Omit<CatalogoItem, 'id' | 'fechaCreacion'>) => void;
  actualizarCatalogoItem: (item: CatalogoItem) => void;
  eliminarCatalogoItem: (id: string) => void;

  // AUDITORIA
  eventosAuditoria: EventoAuditoria[];
  registrarEvento: (data: Omit<EventoAuditoria, 'id' | 'fecha'>) => void;
}

const AdministracionContext = createContext<AdministracionContextType | undefined>(undefined);

/* ------------------------------------------------------------------ */
/*  Provider del Contexto                                             */
/* ------------------------------------------------------------------ */
export const AdministracionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Cargar desde localStorage
  const [roles, setRoles] = useState<RolHEP[]>(() => {
    const stored = localStorage.getItem('admin_roles_hep');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Error al parsear admin_roles_hep:', e);
      }
    }
    localStorage.setItem('admin_roles_hep', JSON.stringify(MOCK_ROLES_INICIALES));
    return MOCK_ROLES_INICIALES;
  });

  const [usuarios, setUsuarios] = useState<UsuarioHEP[]>(() => {
    const stored = localStorage.getItem('admin_usuarios_hep');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Error al parsear admin_usuarios_hep:', e);
      }
    }
    localStorage.setItem('admin_usuarios_hep', JSON.stringify(MOCK_USUARIOS_INICIALES));
    return MOCK_USUARIOS_INICIALES;
  });

  const [catalogos, setCatalogos] = useState<CatalogoItem[]>(() => {
    const stored = localStorage.getItem('admin_catalogos_hep');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Error al parsear admin_catalogos_hep:', e);
      }
    }
    localStorage.setItem('admin_catalogos_hep', JSON.stringify(MOCK_CATALOGOS_INICIALES));
    return MOCK_CATALOGOS_INICIALES;
  });

  const [eventosAuditoria, setEventosAuditoria] = useState<EventoAuditoria[]>(() => {
    const stored = localStorage.getItem('admin_auditoria_hep');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Error al parsear admin_auditoria_hep:', e);
      }
    }
    localStorage.setItem('admin_auditoria_hep', JSON.stringify(MOCK_AUDITORIA_INICIALES));
    return MOCK_AUDITORIA_INICIALES;
  });

  // Persistir en localStorage cuando cambien los estados
  useEffect(() => {
    localStorage.setItem('admin_roles_hep', JSON.stringify(roles));
  }, [roles]);

  useEffect(() => {
    localStorage.setItem('admin_usuarios_hep', JSON.stringify(usuarios));
  }, [usuarios]);

  useEffect(() => {
    localStorage.setItem('admin_catalogos_hep', JSON.stringify(catalogos));
  }, [catalogos]);

  useEffect(() => {
    localStorage.setItem('admin_auditoria_hep', JSON.stringify(eventosAuditoria));
  }, [eventosAuditoria]);

  /* ------------------------------------------------------------------ */
  /*  Acciones de ROLES                                                 */
  /* ------------------------------------------------------------------ */
  const actualizarPermisosRol = (rolId: string, permisos: PermisoModulo[]) => {
    setRoles(prev =>
      prev.map(r => (r.id === rolId ? { ...r, permisos } : r))
    );
  };

  const crearRol = (data: Omit<RolHEP, 'id' | 'esRolBase' | 'fechaCreacion'>) => {
    const nuevoRol: RolHEP = {
      ...data,
      id: crypto.randomUUID(),
      esRolBase: false,
      fechaCreacion: new Date().toISOString()
    };
    setRoles(prev => [...prev, nuevoRol]);
  };

  const obtenerRolPorId = (id: string): RolHEP | undefined => {
    return roles.find(r => r.id === id);
  };

  /* ------------------------------------------------------------------ */
  /*  Acciones de USUARIOS                                              */
  /* ------------------------------------------------------------------ */
  const crearUsuario = (data: Omit<UsuarioHEP, 'id' | 'fechaCreacion' | 'ultimoAcceso' | 'rolNombre'>) => {
    const rol = roles.find(r => r.id === data.rolId);
    const rolNombre = rol ? rol.nombre : 'Sin Rol';

    const nuevoUsuario: UsuarioHEP = {
      ...data,
      id: crypto.randomUUID(),
      rolNombre,
      ultimoAcceso: '',
      fechaCreacion: new Date().toISOString()
    };
    setUsuarios(prev => [...prev, nuevoUsuario]);
  };

  const actualizarUsuario = (usuario: UsuarioHEP) => {
    const rol = roles.find(r => r.id === usuario.rolId);
    const rolNombre = rol ? rol.nombre : 'Sin Rol';

    setUsuarios(prev =>
      prev.map(u =>
        u.id === usuario.id
          ? { ...usuario, rolNombre }
          : u
      )
    );
  };

  const cambiarEstadoUsuario = (id: string, estado: 'Activo' | 'Inactivo' | 'Bloqueado') => {
    setUsuarios(prev =>
      prev.map(u => (u.id === id ? { ...u, estado } : u))
    );
  };

  const obtenerUsuarioPorId = (id: string): UsuarioHEP | undefined => {
    return usuarios.find(u => u.id === id);
  };

  /* ------------------------------------------------------------------ */
  /*  Acciones de CATÁLOGOS                                             */
  /* ------------------------------------------------------------------ */
  const catalogosPorTipo = (tipo: 'Categoria' | 'Ubicacion' | 'Motivo'): CatalogoItem[] => {
    return catalogos.filter(item => item.tipo === tipo);
  };

  const agregarCatalogoItem = (data: Omit<CatalogoItem, 'id' | 'fechaCreacion'>) => {
    const nuevoItem: CatalogoItem = {
      ...data,
      id: crypto.randomUUID(),
      fechaCreacion: new Date().toISOString()
    };
    setCatalogos(prev => [...prev, nuevoItem]);
  };

  const actualizarCatalogoItem = (item: CatalogoItem) => {
    setCatalogos(prev =>
      prev.map(c => (c.id === item.id ? item : c))
    );
  };

  const eliminarCatalogoItem = (id: string) => {
    setCatalogos(prev => prev.filter(c => c.id !== id));
  };

  /* ------------------------------------------------------------------ */
  /*  Acciones de AUDITORIA                                             */
  /* ------------------------------------------------------------------ */
  const registrarEvento = (data: Omit<EventoAuditoria, 'id' | 'fecha'>) => {
    const nuevoEvento: EventoAuditoria = {
      ...data,
      id: crypto.randomUUID(),
      fecha: new Date().toISOString()
    };
    setEventosAuditoria(prev => [nuevoEvento, ...prev]);
  };

  return (
    <AdministracionContext.Provider
      value={{
        roles,
        actualizarPermisosRol,
        crearRol,
        obtenerRolPorId,

        usuarios,
        crearUsuario,
        actualizarUsuario,
        cambiarEstadoUsuario,
        obtenerUsuarioPorId,

        catalogos,
        catalogosPorTipo,
        agregarCatalogoItem,
        actualizarCatalogoItem,
        eliminarCatalogoItem,

        eventosAuditoria,
        registrarEvento
      }}
    >
      {children}
    </AdministracionContext.Provider>
  );
};

/* ------------------------------------------------------------------ */
/*  Hook de Consumo                                                   */
/* ------------------------------------------------------------------ */
export const useAdministracionContext = () => {
  const context = useContext(AdministracionContext);
  if (!context) {
    throw new Error('useAdministracionContext debe usarse dentro de AdministracionProvider');
  }
  return context;
};
