import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchApps, fetchCampaign, subscribeNewsletter, submitContact } from '../lib/api';

export const useApps = (filters) => {
  return useQuery({
    queryKey: ['apps', filters],
    queryFn: () => fetchApps(filters),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCampaign = () => {
  return useQuery({
    queryKey: ['campaign'],
    queryFn: fetchCampaign,
    refetchInterval: 60000,
  });
};

export const useSubscribe = () => {
  return useMutation({
    mutationFn: ({ email, name }) => subscribeNewsletter(email, name),
  });
};

export const useContact = () => {
  return useMutation({
    mutationFn: submitContact,
  });
};
