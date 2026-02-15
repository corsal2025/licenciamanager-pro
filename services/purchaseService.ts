import { api } from './api';
import { Purchase, PurchaseStatus } from '../types';

export const purchaseService = {
    getAll: async (showDeleted: boolean = false): Promise<Purchase[]> => {
        // Pass show_deleted as query param (snake_case for python)
        return await api.get(`/purchases/?show_deleted=${showDeleted}`);
    },

    create: async (data: Omit<Purchase, 'id' | 'requestDate' | 'status' | 'isDeleted' | 'requestedBy'>, username: string): Promise<Purchase> => {
        return await api.post(`/purchases/?username=${username}`, data); // Sending username in query or body as per backend definition
    },

    update: async (id: string, data: Partial<Purchase>, username: string): Promise<Purchase> => {
        return await api.put(`/purchases/${id}?username=${username}`, data);
    },

    delete: async (id: string, username: string): Promise<void> => {
        return await api.delete(`/purchases/${id}?username=${username}`);
    },

    restore: async (id: string, username: string): Promise<void> => {
        return await api.post(`/purchases/${id}/restore?username=${username}`, {});
    }
};
