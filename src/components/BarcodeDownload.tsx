import React, { useRef, useEffect } from 'react';
import JsBarcode from 'jsbarcode';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Activo } from '../context/ActivosContext';

interface BarcodeDownloadProps {
    activo: Activo;
    compact?: boolean;
}

/**
 * Función auxiliar exportada para descargar un código de barras como PNG sin necesidad
 * de montar un componente visible, útil para la descarga masiva y secuencial.
 */
export const downloadBarcodeAsPng = (activo: Activo): Promise<void> => {
    return new Promise((resolve) => {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const barcodeValue = activo.codigoInstitucional || String(activo.idActivo);

        try {
            JsBarcode(svg, barcodeValue, {
                format: 'CODE128',
                width: 2,
                height: 60,
                displayValue: true,
                fontSize: 14,
                fontOptions: 'bold',
                font: 'monospace',
                margin: 10
            });
        } catch (err) {
            console.error('Error al generar código de barras con JsBarcode:', err);
            resolve();
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

            // Escalar para mayor resolución en impresión (2x)
            const scale = 2;
            canvas.width = svgWidth * scale;
            canvas.height = svgHeight * scale;

            const context = canvas.getContext('2d');
            if (context) {
                // Rellenar fondo blanco
                context.fillStyle = '#ffffff';
                context.fillRect(0, 0, canvas.width, canvas.height);

                // Aplicar escala y dibujar
                context.scale(scale, scale);
                context.drawImage(image, 0, 0);

                try {
                    const pngUrl = canvas.toDataURL('image/png');
                    const downloadLink = document.createElement('a');
                    const filename = `barcode-${activo.codigoInstitucional || activo.idActivo}.png`;
                    downloadLink.href = pngUrl;
                    downloadLink.download = filename;
                    document.body.appendChild(downloadLink);
                    downloadLink.click();
                    document.body.removeChild(downloadLink);
                } catch (e) {
                    console.error('Error al generar URL de descarga:', e);
                }
            }
            URL.revokeObjectURL(blobURL);
            resolve();
        };

        image.onerror = (err) => {
            console.error('Error al cargar la imagen SVG:', err);
            URL.revokeObjectURL(blobURL);
            resolve();
        };

        image.src = blobURL;
    });
};

export const BarcodeDownload: React.FC<BarcodeDownloadProps> = ({ activo, compact = false }) => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (svgRef.current && activo) {
            const barcodeValue = activo.codigoInstitucional || String(activo.idActivo);
            try {
                JsBarcode(svgRef.current, barcodeValue, {
                    format: 'CODE128',
                    width: 2,
                    height: 60,
                    displayValue: true,
                    fontSize: 14,
                    fontOptions: 'bold',
                    font: 'monospace',
                    margin: 10
                });
            } catch (err) {
                console.error('Error al renderizar código de barras:', err);
            }
        }
    }, [activo]);

    const handleDownload = () => {
        downloadBarcodeAsPng(activo);
    };

    if (compact) {
        return (
            <Button
                icon="pi pi-download"
                rounded
                outlined
                severity="secondary"
                onClick={handleDownload}
                title="Descargar código de barras (PNG)"
                aria-label="Descargar código de barras"
            />
        );
    }

    return (
        <Card className="flex flex-col items-center justify-center p-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <div className="flex flex-col items-center">
                <div className="bg-white p-3 rounded-md border border-slate-100 mb-4 flex justify-center items-center">
                    <svg ref={svgRef} className="max-w-full h-auto" style={{ display: 'block' }}></svg>
                </div>
                <div className="text-center mb-4">
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Código de barras</p>
                    <p className="text-base font-mono font-bold text-slate-800 dark:text-slate-200">
                        {activo.codigoInstitucional || activo.idActivo}
                    </p>
                </div>
                <Button
                    label="Descargar PNG"
                    icon="pi pi-download"
                    onClick={handleDownload}
                    className="w-full"
                />
            </div>
        </Card>
    );
};

export default BarcodeDownload;
