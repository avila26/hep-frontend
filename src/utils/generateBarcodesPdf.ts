import jsPDF from 'jspdf';
import JsBarcode from 'jsbarcode';
import { Activo } from '../context/ActivosContext';

/**
 * Genera y descarga un PDF con los códigos de barras de los activos especificados.
 * Utiliza JsBarcode y jsPDF, organizando los códigos en una cuadrícula.
 */
export const generarPdfCodigosMasivos = async (activos: Activo[], referenciaActa: string) => {
    if (!activos || activos.length === 0) return;

    // Configuración de la etiqueta térmica: 50mm x 25mm
    const LABEL_WIDTH_MM = 50;
    const LABEL_HEIGHT_MM = 25;

    // Crear nuevo documento PDF con el tamaño exacto de la etiqueta
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [LABEL_WIDTH_MM, LABEL_HEIGHT_MM]
    });

    for (let i = 0; i < activos.length; i++) {
        const activo = activos[i];
        
        // Determinar valor del código de barras
        const barcodeValue = activo.codigoBarras || activo.numeroSerie || activo.codigoInstitucional || String(activo.idActivo);
        
        // Crear el código de barras como DataURL (PNG) de forma síncrona/promesa
        const pngDataUrl = await getBarcodeDataUrl(barcodeValue);

        if (!pngDataUrl) continue;

        // Si no es el primer activo, agregar una nueva página/etiqueta
        if (i > 0) {
            doc.addPage([LABEL_WIDTH_MM, LABEL_HEIGHT_MM], 'landscape');
        }

        // --- Dibujar contenido centrado en la etiqueta de 50x25 ---

        // 1. Imagen del código de barras (centrada en la etiqueta)
        // Como ya no hay texto descriptivo, aprovechamos mejor el espacio.
        const imgWidth = 46; 
        const imgHeight = 20; 
        const xImg = (LABEL_WIDTH_MM - imgWidth) / 2;
        const yImg = (LABEL_HEIGHT_MM - imgHeight) / 2;

        doc.addImage(pngDataUrl, 'PNG', xImg, yImg, imgWidth, imgHeight);
    }

    doc.save(`codigos-barras-${referenciaActa}.pdf`);
};

/**
 * Genera el base64 de un código de barras usando JsBarcode y un Canvas
 */
const getBarcodeDataUrl = (value: string): Promise<string | null> => {
    return new Promise((resolve) => {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        try {
            JsBarcode(svg, value, {
                format: 'CODE128',
                width: 2,
                height: 60,
                displayValue: true,
                fontSize: 14,
                fontOptions: 'bold',
                font: 'monospace',
                margin: 10
            });
        } catch (e) {
            console.error('Error generando JsBarcode:', e);
            resolve(null);
            return;
        }

        const svgString = new XMLSerializer().serializeToString(svg);
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const URL = window.URL || window.webkitURL || window;
        const blobURL = URL.createObjectURL(svgBlob);

        const image = new Image();
        image.onload = () => {
            const canvas = document.createElement('canvas');
            const svgWidth = Number(svg.getAttribute('width')) || 300;
            const svgHeight = Number(svg.getAttribute('height')) || 120;

            const scale = 2; // Mejor resolución
            canvas.width = svgWidth * scale;
            canvas.height = svgHeight * scale;

            const context = canvas.getContext('2d');
            if (context) {
                context.fillStyle = '#ffffff';
                context.fillRect(0, 0, canvas.width, canvas.height);
                context.scale(scale, scale);
                context.drawImage(image, 0, 0);

                try {
                    const pngUrl = canvas.toDataURL('image/png');
                    resolve(pngUrl);
                } catch (e) {
                    resolve(null);
                }
            } else {
                resolve(null);
            }
            URL.revokeObjectURL(blobURL);
        };

        image.onerror = () => {
            URL.revokeObjectURL(blobURL);
            resolve(null);
        };

        image.src = blobURL;
    });
};
