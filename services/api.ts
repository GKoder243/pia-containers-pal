import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

export const api = axios.create({
  baseURL: API_URL,
});

console.log(`[API_SERVICE] L'URL de base de l'API est configurée sur: ${api.defaults.baseURL}`);

api.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

async function getToken() {
  try {
    const value = await AsyncStorage.getItem('@App:token');
    return value;
  } catch (e) {
    return null;
  }
}

export const uploadForPreview = async (formData: FormData) => {
  const response = await api.post('/import/preview', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data; // Renvoie la liste des en-têtes
};

export const processUploadedFile = async (formData: FormData) => {
  const response = await api.post('/import/process', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data; // Renvoie le message de succès et l'aperçu
};

export const getAdminDashboard = async () => {
  const response = await api.get('/dashboard/admin'); // 'api' est ton instance axios
  return response.data;
};

export const getCCDashboard = () => api.get('/dashboard/cc');
export const validateContainerExit = (containerId: number, truckMatricule: string) => api.put(`/containers/${containerId}/validate-exit`, { matricule: truckMatricule });
export const getPIADashboard = () => api.get('/dashboard/pia');
export const validateContainerArrival = (containerId: number) => {
  return api.put(`/containers/${containerId}/validate-arrival`);
};
export const validatePIADeparture = (containerId: number, departureData: any) => {
  return api.put(`/containers/${containerId}/validate-departure`, departureData);
};
export const getContainersAtPIA = () => api.get('/dashboard/at-pia');
export const getCheckpoints = () => api.get('/checkpoints');
export const getMovementHistory = (filters: { search?: string; date?: string }) => {
  return api.get('/reports', { params: filters });
};
export const getUsers = () => api.get('/users');
export const createUser = (userData: any) => api.post('/users', userData);
export const updateUser = (id: number, userData: any) => api.put(`/users/${id}`, userData);
export const deleteUser = (id: number) => api.delete(`/users/${id}`);
