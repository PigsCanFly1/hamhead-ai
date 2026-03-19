import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;

export const fetchApps = async (filters = {}) => {
  const { category, page = 1 } = filters;
  const params = new URLSearchParams();
  if (category && category !== 'ALL') params.append('category', category);
  params.append('page', page);

  const { data } = await api.get(`/apps?${params.toString()}`);
  return data;
};

export const fetchCampaign = async () => {
  const { data } = await api.get('/campaign');
  return data;
};

export const subscribeNewsletter = async (email, name) => {
  const { data } = await api.post('/subscribers', { email, name });
  return data;
};

export const submitContact = async (formData) => {
  const { data } = await api.post('/contact', formData);
  return data;
};
