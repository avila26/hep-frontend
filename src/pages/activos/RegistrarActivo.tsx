import React, { useState, useRef, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Divider } from 'primereact/divider';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Message } from 'primereact/message';
import { useNavigate } from 'react-router-dom';
import { useActivos } from '../../context/ActivosContext';

interface Activo {
    idActivo?: number;
    codigoInstitucional: string;
    nombre: string;
    numeroSerie: string;
    descripcion: string;
    modelo: string;
    material: string;
    fechaAdquisicion: Date | null;
    responsableEntrega: string;
    dimension: string;
    numeroContrato: string;
    valorAdquisicion: number | null;
    valorUnitario: number | null;
    valorTotal: number | null;
    codigoSBYE: string;
    fechaDNS: string;
    tiempoVidaUtil: number | null;
    bloqueado: boolean;
    administradorDelProceso: string;
    itemPresupuestario: string;
    partidaPresupuestaria: string;
    numeroActa: string;
    marca: string;
    color: string;
    categoriaActivo: string;
    origenIngreso: string;
    motivoIngreso: string;
    unidadMedida: string;
    estadoActivo: string;
    condicionDepreciacion: string;
    ubicacion: string;
}

// Catálogos precargados
const CATALOGOS = {
    color: [
        { label: 'Blanco', value: 'Blanco' },
        { label: 'Negro', value: 'Negro' },
        { label: 'Gris', value: 'Gris' },
        { label: 'Azul', value: 'Azul' },
        { label: 'Rojo', value: 'Rojo' },
        { label: 'Verde', value: 'Verde' },
        { label: 'Amarillo', value: 'Amarillo' },
        { label: 'Plateado', value: 'Plateado' }
    ],
    origenIngreso: [
        { label: 'Compra', value: 'Compra' },
        { label: 'Donación', value: 'Donación' },
        { label: 'Transferencia', value: 'Transferencia' },
        { label: 'Comodato', value: 'Comodato' }
    ],
    categoriaActivo: [
        { label: 'Equipo Médico', value: 'Equipo Médico' },
        { label: 'Mobiliario', value: 'Mobiliario' },
        { label: 'Equipo de Cómputo', value: 'Equipo de Cómputo' },
        { label: 'Vehículo', value: 'Vehículo' },
        { label: 'Herramienta', value: 'Herramienta' },
        { label: 'Otros', value: 'Otros' }
    ],
    unidadMedida: [
        { label: 'Unidad', value: 'Unidad' },
        { label: 'Par', value: 'Par' },
        { label: 'Juego', value: 'Juego' },
        { label: 'Kit', value: 'Kit' }
    ],
    estadoActivo: [
        { label: 'Bueno', value: 'Bueno' },
        { label: 'Regular', value: 'Regular' },
        { label: 'Malo', value: 'Malo' },
        { label: 'En Reparación', value: 'En Reparación' },
        { label: 'Dado de Baja', value: 'Dado de Baja' }
    ],
    marca: [
        { label: 'Samsung', value: 'Samsung' },
        { label: 'LG', value: 'LG' },
        { label: 'HP', value: 'HP' },
        { label: 'Dell', value: 'Dell' },
        { label: 'Lenovo', value: 'Lenovo' },
        { label: 'Philips', value: 'Philips' },
        { label: 'GE', value: 'GE' },
        { label: 'Siemens', value: 'Siemens' },
        { label: 'Otros', value: 'Otros' }
    ],
    motivoIngreso: [
        { label: 'Adquisición Nueva', value: 'Adquisición Nueva' },
        { label: 'Reingreso', value: 'Reingreso' },
        { label: 'Transferencia Recibida', value: 'Transferencia Recibida' }
    ],
    condicionDepreciacion: [
        { label: 'Lineal', value: 'Lineal' },
        { label: 'Acelerada', value: 'Acelerada' },
        { label: 'No Aplica', value: 'No Aplica' }
    ],
    ubicacion: [
        { label: 'Consulta Externa', value: 'Consulta Externa' },
        { label: 'Emergencia', value: 'Emergencia' },
        { label: 'UCI', value: 'UCI' },
        { label: 'Quirófano', value: 'Quirófano' },
        { label: 'Bodega', value: 'Bodega' },
        { label: 'Administración', value: 'Administración' },
        { label: 'Laboratorio', value: 'Laboratorio' }
    ]
};

export const RegistrarActivo: React.FC = () => {
    const navigate = useNavigate();
    const toast = useRef<Toast>(null);
    const { activos, agregarActivo } = useActivos();

    const [formData, setFormData] = useState<Activo>({
        codigoInstitucional: '',
        nombre: '',
        numeroSerie: '',
        descripcion: '',
        modelo: '',
        material: '',
        fechaAdquisicion: null,
        responsableEntrega: '',
        dimension: '',
        numeroContrato: '',
        valorAdquisicion: null,
        valorUnitario: null,
        valorTotal: null,
        codigoSBYE: '',
        fechaDNS: '',
        tiempoVidaUtil: null,
        bloqueado: false,
        administradorDelProceso: '',
        itemPresupuestario: '',
        partidaPresupuestaria: '',
        numeroActa: '',
        marca: '',
        color: '',
        categoriaActivo: '',
        origenIngreso: '',
        motivoIngreso: '',
        unidadMedida: '',
        estadoActivo: '',
        condicionDepreciacion: '',
        ubicacion: ''
    });

    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Calcular ValorTotal cuando cambia ValorUnitario
    useEffect(() => {
        if (formData.valorUnitario) {
            setFormData(prev => ({
                ...prev,
                valorTotal: prev.valorUnitario
            }));
        }
    }, [formData.valorUnitario]);

    // Validar que número de serie sea único
    const validateForm = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.nombre.trim()) {
            newErrors.nombre = 'El nombre es obligatorio';
        }

        if (!formData.numeroSerie.trim()) {
            newErrors.numeroSerie = 'El número de serie es obligatorio';
        } else if (activos.some(a => a.numeroSerie === formData.numeroSerie)) {
            newErrors.numeroSerie = 'Este número de serie ya existe en el sistema';
        }

        if (!formData.marca) {
            newErrors.marca = 'La marca es obligatoria';
        }

        if (!formData.categoriaActivo) {
            newErrors.categoriaActivo = 'La categoría es obligatoria';
        }

        if (!formData.origenIngreso) {
            newErrors.origenIngreso = 'El origen de ingreso es obligatorio';
        }

        if (!formData.estadoActivo) {
            newErrors.estadoActivo = 'El estado del activo es obligatorio';
        }

        if (!formData.ubicacion) {
            newErrors.ubicacion = 'La ubicación es obligatoria';
        }

        if (!formData.fechaAdquisicion) {
            newErrors.fechaAdquisicion = 'La fecha de adquisición es obligatoria';
        } else {
            const fechaActual = new Date();
            if (formData.fechaAdquisicion > fechaActual) {
                newErrors.fechaAdquisicion = 'La fecha no puede ser futura';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Manejar cambios en inputs
    const handleInputChange = (field: keyof Activo, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        // Limpiar error del campo cuando se empieza a editar
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    // Guardar activo
    const handleGuardar = async () => {
        if (!validateForm()) {
            toast.current?.show({
                severity: 'error',
                summary: 'Errores de Validación',
                detail: 'Revise los campos obligatorios',
                life: 3000
            });
            return;
        }

        try {
            // Guardar en el contexto
            const { idActivo, ...datosActivo } = formData;
            agregarActivo(datosActivo);

            toast.current?.show({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Activo registrado correctamente',
                life: 3000
            });

            // Redirigir después de 2 segundos
            setTimeout(() => {
                navigate('/activos/consultar');
            }, 2000);
        } catch (error) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Ocurrió un error al guardar el activo',
                life: 3000
            });
        }
    };

    // Cancelar
    const handleCancelar = () => {
        navigate('/activos/consultar');
    };

    const getErrorClass = (field: keyof Activo) => {
        return errors[field] ? 'p-invalid' : '';
    };

    return (
        <div className="p-4">
            <Toast ref={toast} />

            <h1 className="text-3xl font-medium text-slate-800 dark:text-slate-100 mb-4">Registrar Activo</h1>

            {/* Mensaje informativo */}
            <Message
                severity="info"
                text="Cada activo se registra individualmente. Si recibió múltiples unidades del mismo bien, registre cada una por separado con su propio número de serie."
                className="mb-4 w-full"
            />

            <Card className="shadow-lg">
                {/* SECCIÓN 1: Información General */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <h3 className="col-span-1 md:col-span-2 text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Información General
                    </h3>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Nombre <span className="text-red-500">*</span>
                        </label>
                        <InputText
                            value={formData.nombre}
                            onChange={(e) => handleInputChange('nombre', e.target.value)}
                            placeholder="Ej: Monitor"
                            className={`w-full ${getErrorClass('nombre')}`}
                        />
                        {errors.nombre && <small className="text-red-500">{errors.nombre}</small>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Marca <span className="text-red-500">*</span>
                        </label>
                        <Dropdown
                            value={formData.marca}
                            onChange={(e: DropdownChangeEvent) => handleInputChange('marca', e.value)}
                            options={CATALOGOS.marca}
                            placeholder="Seleccione una marca"
                            className={`w-full ${getErrorClass('marca')}`}
                        />
                        {errors.marca && <small className="text-red-500">{errors.marca}</small>}
                    </div>

                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium mb-2">Descripción</label>
                        <InputTextarea
                            value={formData.descripcion}
                            onChange={(e) => handleInputChange('descripcion', e.target.value)}
                            placeholder="Descripción detallada del activo"
                            rows={3}
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Modelo</label>
                        <InputText
                            value={formData.modelo}
                            onChange={(e) => handleInputChange('modelo', e.target.value)}
                            placeholder="Ej: 24 pulgadas"
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Color</label>
                        <Dropdown
                            value={formData.color}
                            onChange={(e: DropdownChangeEvent) => handleInputChange('color', e.value)}
                            options={CATALOGOS.color}
                            placeholder="Seleccione un color"
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Material</label>
                        <InputText
                            value={formData.material}
                            onChange={(e) => handleInputChange('material', e.target.value)}
                            placeholder="Ej: Plástico"
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Dimensión</label>
                        <InputText
                            value={formData.dimension}
                            onChange={(e) => handleInputChange('dimension', e.target.value)}
                            placeholder="Ej: 50x30x20 cm"
                            className="w-full"
                        />
                    </div>
                </div>

                <Divider />

                {/* SECCIÓN 2: Identificación */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <h3 className="col-span-1 md:col-span-2 text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Identificación
                    </h3>

                    <div>
                        <label className="block text-sm font-medium mb-2">Código Institucional</label>
                        <InputText
                            value={formData.codigoInstitucional}
                            onChange={(e) => handleInputChange('codigoInstitucional', e.target.value)}
                            placeholder="Autogenerado"
                            disabled
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Número de Serie <span className="text-red-500">*</span>
                        </label>
                        <InputText
                            value={formData.numeroSerie}
                            onChange={(e) => handleInputChange('numeroSerie', e.target.value)}
                            placeholder="Ej: SN12345678"
                            className={`w-full ${getErrorClass('numeroSerie')}`}
                        />
                        {errors.numeroSerie && <small className="text-red-500">{errors.numeroSerie}</small>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Código SBYE</label>
                        <InputText
                            value={formData.codigoSBYE}
                            onChange={(e) => handleInputChange('codigoSBYE', e.target.value)}
                            placeholder="Código SBYE"
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Número de Acta</label>
                        <InputText
                            value={formData.numeroActa}
                            onChange={(e) => handleInputChange('numeroActa', e.target.value)}
                            placeholder="Ej: ACTA-2024-001"
                            className="w-full"
                        />
                    </div>
                </div>

                <Divider />

                {/* SECCIÓN 3: Clasificación */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <h3 className="col-span-1 md:col-span-2 text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Clasificación
                    </h3>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Categoría <span className="text-red-500">*</span>
                        </label>
                        <Dropdown
                            value={formData.categoriaActivo}
                            onChange={(e: DropdownChangeEvent) => handleInputChange('categoriaActivo', e.value)}
                            options={CATALOGOS.categoriaActivo}
                            placeholder="Seleccione una categoría"
                            className={`w-full ${getErrorClass('categoriaActivo')}`}
                        />
                        {errors.categoriaActivo && <small className="text-red-500">{errors.categoriaActivo}</small>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Origen de Ingreso <span className="text-red-500">*</span>
                        </label>
                        <Dropdown
                            value={formData.origenIngreso}
                            onChange={(e: DropdownChangeEvent) => handleInputChange('origenIngreso', e.value)}
                            options={CATALOGOS.origenIngreso}
                            placeholder="Seleccione origen"
                            className={`w-full ${getErrorClass('origenIngreso')}`}
                        />
                        {errors.origenIngreso && <small className="text-red-500">{errors.origenIngreso}</small>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Motivo de Ingreso</label>
                        <Dropdown
                            value={formData.motivoIngreso}
                            onChange={(e: DropdownChangeEvent) => handleInputChange('motivoIngreso', e.value)}
                            options={CATALOGOS.motivoIngreso}
                            placeholder="Seleccione motivo"
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Unidad de Medida</label>
                        <Dropdown
                            value={formData.unidadMedida}
                            onChange={(e: DropdownChangeEvent) => handleInputChange('unidadMedida', e.value)}
                            options={CATALOGOS.unidadMedida}
                            placeholder="Seleccione unidad"
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Estado del Activo <span className="text-red-500">*</span>
                        </label>
                        <Dropdown
                            value={formData.estadoActivo}
                            onChange={(e: DropdownChangeEvent) => handleInputChange('estadoActivo', e.value)}
                            options={CATALOGOS.estadoActivo}
                            placeholder="Seleccione estado"
                            className={`w-full ${getErrorClass('estadoActivo')}`}
                        />
                        {errors.estadoActivo && <small className="text-red-500">{errors.estadoActivo}</small>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Condición de Depreciación</label>
                        <Dropdown
                            value={formData.condicionDepreciacion}
                            onChange={(e: DropdownChangeEvent) => handleInputChange('condicionDepreciacion', e.value)}
                            options={CATALOGOS.condicionDepreciacion}
                            placeholder="Seleccione condición"
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Ubicación <span className="text-red-500">*</span>
                        </label>
                        <Dropdown
                            value={formData.ubicacion}
                            onChange={(e: DropdownChangeEvent) => handleInputChange('ubicacion', e.value)}
                            options={CATALOGOS.ubicacion}
                            placeholder="Seleccione ubicación"
                            className={`w-full ${getErrorClass('ubicacion')}`}
                        />
                        {errors.ubicacion && <small className="text-red-500">{errors.ubicacion}</small>}
                    </div>
                </div>

                <Divider />

                {/* SECCIÓN 4: Valores y Fechas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <h3 className="col-span-1 md:col-span-2 text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Valores y Fechas
                    </h3>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Fecha de Adquisición <span className="text-red-500">*</span>
                        </label>
                        <Calendar
                            value={formData.fechaAdquisicion}
                            onChange={(e) => handleInputChange('fechaAdquisicion', e.value)}
                            dateFormat="dd/mm/yy"
                            showIcon
                            className={`w-full ${getErrorClass('fechaAdquisicion')}`}
                        />
                        {errors.fechaAdquisicion && <small className="text-red-500">{errors.fechaAdquisicion}</small>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Valor de Adquisición</label>
                        <InputNumber
                            value={formData.valorAdquisicion}
                            onChange={(e) => handleInputChange('valorAdquisicion', e.value)}
                            mode="currency"
                            currency="USD"
                            locale="es-ES"
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Valor Unitario</label>
                        <InputNumber
                            value={formData.valorUnitario}
                            onChange={(e) => handleInputChange('valorUnitario', e.value)}
                            mode="currency"
                            currency="USD"
                            locale="es-ES"
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Valor Total</label>
                        <InputNumber
                            value={formData.valorTotal}
                            disabled
                            mode="currency"
                            currency="USD"
                            locale="es-ES"
                            className="w-full"
                        />
                        <small className="text-slate-500">Calculado automáticamente</small>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Tiempo de Vida Útil (años)</label>
                        <InputNumber
                            value={formData.tiempoVidaUtil}
                            onChange={(e) => handleInputChange('tiempoVidaUtil', e.value)}
                            placeholder="Ej: 5"
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Número de Contrato</label>
                        <InputText
                            value={formData.numeroContrato}
                            onChange={(e) => handleInputChange('numeroContrato', e.target.value)}
                            placeholder="Ej: CONTRATO-2024-001"
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Item Presupuestario</label>
                        <InputText
                            value={formData.itemPresupuestario}
                            onChange={(e) => handleInputChange('itemPresupuestario', e.target.value)}
                            placeholder="Item"
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Partida Presupuestaria</label>
                        <InputText
                            value={formData.partidaPresupuestaria}
                            onChange={(e) => handleInputChange('partidaPresupuestaria', e.target.value)}
                            placeholder="Partida"
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Fecha DNS</label>
                        <Calendar
                            value={formData.fechaDNS ? new Date(formData.fechaDNS) : null}
                            onChange={(e) => handleInputChange('fechaDNS', e.value?.toISOString())}
                            dateFormat="dd/mm/yy"
                            showIcon
                            className="w-full"
                        />
                    </div>
                </div>

                <Divider />

                {/* SECCIÓN 5: Responsables */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <h3 className="col-span-1 md:col-span-2 text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Responsables
                    </h3>

                    <div>
                        <label className="block text-sm font-medium mb-2">Responsable de Entrega</label>
                        <InputText
                            value={formData.responsableEntrega}
                            onChange={(e) => handleInputChange('responsableEntrega', e.target.value)}
                            placeholder="Nombre del responsable"
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Administrador del Proceso</label>
                        <InputText
                            value={formData.administradorDelProceso}
                            onChange={(e) => handleInputChange('administradorDelProceso', e.target.value)}
                            placeholder="Nombre del administrador"
                            className="w-full"
                        />
                    </div>
                </div>

                {/* BOTONES */}
                <div className="flex gap-3 justify-end pt-4">
                    <Button
                        label="Cancelar"
                        severity="secondary"
                        onClick={handleCancelar}
                        className="w-full md:w-auto"
                    />
                    <Button
                        label="Guardar"
                        severity="success"
                        onClick={handleGuardar}
                        className="w-full md:w-auto"
                    />
                </div>
            </Card>
        </div>
    );
};

export default RegistrarActivo;
