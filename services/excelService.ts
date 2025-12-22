import * as XLSX from 'xlsx';
import { LicenseData, ProcessStatus, LicenseStatus } from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface ExcelRow {
  [key: string]: any;
}

export const excelService = {
  parseExcelFile: async (file: File): Promise<LicenseData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(sheet);
          
          const parsedLicenses: LicenseData[] = jsonData.map(row => {
            // Intentar mapear columnas comunes (flexible)
            const rut = row['RUT'] || row['rut'] || row['Rut'] || '';
            const fullName = row['NOMBRE'] || row['Nombre'] || row['nombre'] || row['NOMBRE COMPLETO'] || '';
            const statusRaw = row['ESTADO'] || row['Estado'] || '';
            
            // Mapeo básico de estados
            let processStatus = ProcessStatus.PENDING;
            if (String(statusRaw).toUpperCase().includes('CONASET')) processStatus = ProcessStatus.CONASET;
            if (String(statusRaw).toUpperCase().includes('PLACILLA')) processStatus = ProcessStatus.AGENDA_PLACILLA;
            
            return {
              id: uuidv4(),
              fullName: String(fullName).trim(),
              rut: String(rut).trim(),
              licenseNumber: '', // Generalmente no viene en la lista madre inicial
              category: row['CLASE'] || row['Clase'] || '',
              lastControlDate: row['FECHA'] || '',
              status: LicenseStatus.VALID, // Asumimos vigente por defecto al importar
              processStatus: processStatus,
              uploadDate: Date.now(),
              uploadedBy: 'EXCEL_IMPORT'
            };
          }).filter(l => l.rut && l.rut.length > 3); // Filtrar filas vacías

          resolve(parsedLicenses);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = (error) => reject(error);
      reader.readAsBinaryString(file);
    });
  },

  exportToExcel: (licenses: LicenseData[], filename: string = 'licencias.xlsx') => {
    const ws = XLSX.utils.json_to_sheet(licenses.map(l => ({
      RUT: l.rut,
      NOMBRE: l.fullName,
      CLASE: l.category,
      ESTADO_PROCESO: l.processStatus,
      FECHA_SUBIDA: new Date(l.uploadDate).toLocaleDateString()
    })));
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Licencias");
    XLSX.writeFile(wb, filename);
  }
};
