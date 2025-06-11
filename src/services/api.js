import axios from 'axios';

const api = axios.create({
  baseURL: 'https://backend-380x.onrender.com',
});

export const uploadFiles = async (files, sortBy, sortOrder, minSize, maxSize) => {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));
  formData.append('sortBy', sortBy);
  formData.append('sortOrder', sortOrder);
  formData.append('minSize', minSize);
  formData.append('maxSize', maxSize);

  const response = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getStats = async () => {
  const response = await api.get('/stats');
  return response.data;
};

export const downloadCategory = async (category) => {
  const response = await api.get(`/download/${category}`, {
    responseType: 'blob',
  });
  return response;
};

export const clearFiles = async () => {
  const response = await api.delete('/clear');
  return response.data;
};