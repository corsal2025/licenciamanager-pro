
import { v4 as uuidv4 } from 'uuid';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Types for simulated Drive files
export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  webViewLink?: string;
  size?: number;
  parents?: string[];
  createdTime?: string;
}

export interface DriveFolder {
  id: string;
  name: string;
  files: DriveFile[];
  subfolders?: DriveFolder[];
}

const DRIVE_CONFIG_KEY = 'license_manager_drive_config';

// Folder Structure Constants
export const DRIVE_FOLDERS = {
  ROOT: 'LICENCIA_MANAGER_SYSTEM',
  PENDING: '01_ESCANEADAS_PENDIENTES',
  EXCEL: '02_BASE_DATOS_EXCEL',
  CONASET: '03_SUBIDAS_CONASET'
};

// Team Members for subfolders
export const TEAM_MEMBERS = ['JUAN_PEREZ', 'MARIA_GONZALEZ', 'PEDRO_SOTO', 'ANA_ROJAS'];

interface DriveConfig {
  clientId: string;
  apiKey: string;
  folderId?: string;
  isConnected: boolean;
}

export const googleDriveService = {

  getConfig: (): DriveConfig | null => {
    const stored = localStorage.getItem(DRIVE_CONFIG_KEY);
    return stored ? JSON.parse(stored) : null;
  },

  saveConfig: (config: DriveConfig) => {
    localStorage.setItem(DRIVE_CONFIG_KEY, JSON.stringify(config));
  },

  // Initialize Folder Structure (Mock)
  initializeStructure: async (): Promise<boolean> => {
    console.log("Initializing Drive Folder Structure...");
    // In a real implementation, this would check if folders exist and create them if not
    return new Promise(resolve => setTimeout(() => resolve(true), 1500));
  },

  // Get contents of the 3 main folders
  getSystemFolders: async (): Promise<{
    pending: DriveFolder;
    excel: DriveFolder;
    conaset: DriveFolder;
  }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          pending: {
            id: 'folder_pending_001',
            name: DRIVE_FOLDERS.PENDING,
            files: [],
            subfolders: TEAM_MEMBERS.map(member => ({
              id: `folder_${member.toLowerCase()}`,
              name: member,
              files: [
                { id: uuidv4(), name: `Scan_Licencia_${member}_001.pdf`, mimeType: 'application/pdf', size: 1024 * 1024 * 2, createdTime: new Date().toISOString() },
                { id: uuidv4(), name: `Scan_Licencia_${member}_002.pdf`, mimeType: 'application/pdf', size: 1024 * 1024 * 1.5, createdTime: new Date().toISOString() }
              ]
            }))
          },
          excel: {
            id: 'folder_excel_001',
            name: DRIVE_FOLDERS.EXCEL,
            files: [
              { id: 'excel_master_01', name: 'Base_Datos_Licencias_2024.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 50000, createdTime: new Date().toISOString() },
              { id: 'excel_master_02', name: 'Pendientes_Marzo.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 25000, createdTime: new Date().toISOString() }
            ]
          },
          conaset: {
            id: 'folder_conaset_001',
            name: DRIVE_FOLDERS.CONASET,
            files: [
              { id: 'processed_001', name: 'Licencia_Procesada_X1.pdf', mimeType: 'application/pdf', size: 1024 * 1024, createdTime: new Date(Date.now() - 86400000).toISOString() }
            ]
          }
        });
      }, 1000);
    });
  },

  // Move file to CONASET folder (Mock)
  moveToConaset: async (fileId: string, fileName: string): Promise<boolean> => {
    console.log(`Moving file ${fileName} (${fileId}) to ${DRIVE_FOLDERS.CONASET}`);
    return new Promise(resolve => setTimeout(() => resolve(true), 800));
  },

  // MOCK FUNCTION: Simulates fetching files from Google Drive
  // This is what powers the "Do it for me" automatic feel without needing complex OAuth immediately
  simulateScan: async (): Promise<File[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Generate dummy files to simulate a successful cloud scan
        const dummyFiles: File[] = [];

        // Helper to create a fake PDF blob
        const createFakePdf = (name: string) => {
          const content = "Simulated PDF Content for " + name;
          const blob = new Blob([content], { type: 'application/pdf' });
          return new File([blob], name, { type: 'application/pdf', lastModified: Date.now() });
        };

        // Add some random simulated files
        const names = [
          "Scan_Licencia_Juan_Perez.pdf",
          "Licencia_ClaseB_Maria_Gonzalez.pdf",
          "Pendiente_Pedro_Soto_Placilla.pdf",
          "Cambio_Domicilio_Ana_Rojas.pdf",
          "Control_2024_Luis_Torres.pdf"
        ];

        names.forEach(name => dummyFiles.push(createFakePdf(name)));

        resolve(dummyFiles);
      }, 2500); // 2.5s simulated delay
    });
  },

  // Placeholder for Real API Implementation
  // This would use gapi.client.drive.files.list in a real scenario with keys
  connectAndListFiles: async (token: string): Promise<any[]> => {
    console.log("Connecting to Real Drive API with token:", token);
    // In a browser-only environment without OAuth setup, we can't easily do this.
    // We return the simulation for now.
    return [];
  },

  // Upload file to Backend Simulation
  uploadFile: async (file: File, username: string): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('username', username);

    try {
      // Using the authService token if available, though currently the drive endpoint is open/authed
      // Ideally we would add headers authorization here
      const response = await fetch(`${API_URL}/drive/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  }
};
