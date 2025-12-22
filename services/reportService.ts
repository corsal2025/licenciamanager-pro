import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LicenseData, ProcessStatus } from '../types';

// Extend jsPDF type to include lastAutoTable which is added by the plugin
declare module 'jspdf' {
    interface jsPDF {
        lastAutoTable: {
            finalY: number;
        };
    }
}

// Helper: Linear Regression for Projections
const calculateTrend = (data: { x: number, y: number }[]) => {
    const n = data.length;
    if (n === 0) return { m: 0, b: 0, nextPrediction: 0 };

    const sumX = data.reduce((acc, p) => acc + p.x, 0);
    const sumY = data.reduce((acc, p) => acc + p.y, 0);
    const sumXY = data.reduce((acc, p) => acc + (p.x * p.y), 0);
    const sumXX = data.reduce((acc, p) => acc + (p.x * p.x), 0);

    const m = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const b = (sumY - m * sumX) / n;

    const nextX = data[n - 1].x + 1;
    const nextPrediction = m * nextX + b;

    return { m, b, nextPrediction: Math.max(0, nextPrediction) };
};

// Helper: Draw Scatter Plot with Trend Line
const drawScatterPlot = (doc: jsPDF, title: string, data: { label: string, value: number, x: number }[], startY: number) => {
    const margin = 20;
    const width = 170;
    const height = 60;
    const endY = startY + height;

    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.text(title, margin, startY - 5);

    // Axes
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, endY, margin + width, endY); // X Axis
    doc.line(margin, startY, margin, endY); // Y Axis

    if (data.length < 2) {
        doc.text("Insuficientes datos para proyección", margin + 10, startY + 30);
        return endY + 10;
    }

    // Scaling
    const maxY = Math.max(...data.map(d => d.value)) * 1.2; // +20% buffer
    const minX = Math.min(...data.map(d => d.x));
    const maxX = Math.max(...data.map(d => d.x));
    const rangeX = maxX - minX || 1;

    // Plot Points
    doc.setFillColor(59, 130, 246); // Blue 500
    data.forEach(point => {
        const cx = margin + ((point.x - minX) / rangeX) * (width - 20) + 10;
        const cy = endY - (point.value / maxY) * height;
        doc.circle(cx, cy, 1.5, 'F');
        // Label X (simplified)
        doc.setFontSize(7);
        doc.setTextColor(100);
        doc.text(point.label.split('-')[1], cx - 2, endY + 4);
    });

    // Trend Line
    const trend = calculateTrend(data.map(d => ({ x: d.x, y: d.value })));
    const startLineY = endY - ((trend.m * minX + trend.b) / maxY) * height;
    const endLineY = endY - ((trend.m * maxX + trend.b) / maxY) * height;

    doc.setDrawColor(239, 68, 68); // Red 500
    doc.setLineWidth(0.5);
    doc.line(margin + 10, startLineY, margin + width - 10, endLineY);

    // Forecast Annotation
    const forecastVal = Math.round(trend.nextPrediction);
    doc.setTextColor(239, 68, 68);
    doc.text(`Proyección Mes Siguiente: ~${forecastVal} atenciones`, margin + width - 60, startY + 5);

    return endY + 20;
};

// Helper: Draw Histogram
const drawHistogram = (doc: jsPDF, title: string, data: { label: string, value: number }[], startY: number) => {
    const margin = 20;
    const width = 170;
    const height = 50;
    const endY = startY + height;

    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.text(title, margin, startY - 5);

    // Axes
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, endY, margin + width, endY); // X Axis
    doc.line(margin, startY, margin, endY); // Y Axis

    const maxY = Math.max(...data.map(d => d.value));
    const barWidth = (width / data.length) * 0.6;
    const gap = (width / data.length) * 0.4;

    let x = margin + gap / 2;
    data.forEach((d, i) => {
        const barHeight = (d.value / maxY) * height;
        const y = endY - barHeight;

        // Color based on index to differentiate
        const colors = [[59, 130, 246], [16, 185, 129], [245, 158, 11]]; // Blue, Green, Amber
        const color = colors[i % colors.length];
        doc.setFillColor(color[0], color[1], color[2]);

        doc.rect(x, y, barWidth, barHeight, 'F');

        // Label
        doc.setFontSize(8);
        doc.setTextColor(80);
        doc.text(d.label, x + barWidth / 2 - 2, endY + 4);

        // Value
        doc.setFontSize(7);
        doc.setTextColor(50);
        doc.text(d.value.toString(), x + barWidth / 2 - 2, y - 2);

        x += barWidth + gap;
    });

    return endY + 15;
};

export const reportService = {
    generateMonthlyReport: (licenses: LicenseData[]) => {
        const doc = new jsPDF();
        const today = new Date();
        const month = today.toLocaleString('es-CL', { month: 'long', year: 'numeric' });

        // HEADER
        doc.setFillColor(30, 58, 138); // Blue 900
        doc.rect(0, 0, 210, 35, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.text(`Reporte de Gestión y Proyección`, 15, 15);
        doc.setFontSize(12);
        doc.text(`Departamento de Tránsito - ${month}`, 15, 25);
        doc.setFontSize(9);
        doc.text(`Generado el: ${today.toLocaleDateString()} ${today.toLocaleTimeString()}`, 15, 32);

        let finalY = 45;

        // 1. STATS SUMMARY
        const total = licenses.length;
        const delivered = licenses.filter(l => l.processStatus === ProcessStatus.DELIVERED).length;
        const ready = licenses.filter(l => l.processStatus === ProcessStatus.READY_FOR_PICKUP).length;

        autoTable(doc, {
            startY: finalY,
            head: [['Métrica General', 'Cantidad']],
            body: [
                ['Total Licencias Procesadas', total],
                ['Entregadas Terminadas', delivered],
                ['Pendientes de Retiro', ready],
            ],
            theme: 'grid',
            headStyles: { fillColor: [30, 58, 138] },
            styles: { fontSize: 9, cellPadding: 2 }
        });

        finalY = doc.lastAutoTable.finalY + 15;

        // 2. DATA PROCESSING FOR GRAPHS

        // A. Monthly Evolution (for Trend & Scatter)
        const monthsData: Record<string, number> = {};
        licenses.forEach(l => {
            const date = new Date(l.uploadDate * 1000); // Assuming uploadDate is seconds timestamp? Or milliseconds?
            // In App.tsx: new Date(l.uploadDate).toLocaleDateString...
            // Wait, models.py says uploadDate is Integer (likely timestamp).
            // Let's assume input timestamp is robust.

            // To be safe regarding timestamp unit (sec vs ms), check if year is 1970
            let d = new Date(l.uploadDate);
            if (d.getFullYear() === 1970) d = new Date(l.uploadDate * 1000);

            const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
            monthsData[key] = (monthsData[key] || 0) + 1;
        });

        const sortedMonths = Object.keys(monthsData).sort();
        const scatterData = sortedMonths.map((m, i) => ({
            label: m,
            value: monthsData[m],
            x: i + 1 // Simply 1, 2, 3...
        }));

        // B. Category Distribution (for Histogram)
        const catData: Record<string, number> = {};
        licenses.forEach(l => {
            const c = l.category || 'N/A';
            catData[c] = (catData[c] || 0) + 1;
        });
        const histogramData = Object.entries(catData)
            .map(([label, value]) => ({ label, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8); // Top 8 categories


        // 3. DRAW GRAPHS

        // Draw Scatter Plot
        finalY = drawScatterPlot(doc, "Tendencia Mensual y Proyección de Atenciones", scatterData, finalY);

        // Draw Histogram
        finalY = drawHistogram(doc, "Distribución por Tipo de Licencia (Histograma)", histogramData, finalY);


        // 4. DETAILED LIST (Top 20 most recent to save space)
        doc.setFontSize(11);
        doc.setTextColor(0);
        doc.text(`Últimas 20 Tramitaciones:`, 15, finalY + 5);

        const sortedLicenses = [...licenses].sort((a, b) => b.uploadDate - a.uploadDate).slice(0, 20);

        autoTable(doc, {
            startY: finalY + 10,
            head: [['Nombre', 'RUT', 'Clase', 'Estado', 'Fecha']],
            body: sortedLicenses.map(l => [
                l.fullName,
                l.rut,
                l.category,
                l.processStatus,
                new Date(l.uploadDate * 1000).toLocaleDateString() // Adjust if needed
            ]),
            styles: { fontSize: 8 },
            headStyles: { fillColor: [75, 85, 99] }
        });

        doc.save(`Reporte_Analitico_${today.toISOString().split('T')[0]}.pdf`);
    },

    generateDeliveryList: (readyLicenses: LicenseData[]) => {
        const doc = new jsPDF();
        const today = new Date().toLocaleDateString();

        // HEADER
        doc.setFontSize(18);
        doc.text(`Nómina de Entrega de Licencias`, 20, 20);
        doc.setFontSize(12);
        doc.text(`Fecha Generación: ${today}`, 20, 30);

        // TABLE
        autoTable(doc, {
            startY: 40,
            head: [['Nombre', 'RUT', 'Clase', 'Check Firma']],
            body: readyLicenses.map(l => [
                l.fullName,
                l.rut,
                l.category,
                '_______________'
            ]),
            theme: 'grid',
            styles: { cellPadding: 5 }
        });

        doc.save(`Nomina_Entrega_${today}.pdf`);
    }
};
