import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface Project {
  id: string;
  title: string;
  description?: string;
  client_name?: string;
  client_email?: string;
  status: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  project_name?: string;
  booking_id?: string;
  client_id?: string;
  project_type?: string;
  shoot_date?: string;
  delivery_date?: string;
}

export function useProject(projectId: string | undefined) {
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      
      const { data, error } = await api.getProjects();
      if (error) throw new Error(error);
      
      // Find the specific project
      const project = data?.find((p: Project) => p.id === projectId);
      return project || null;
    },
    enabled: !!projectId,
  });
}
