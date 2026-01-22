import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export type AppRole = 'admin' | 'moderator' | 'user';

interface RoleRow {
  role: AppRole;
}

export const useUserRole = () => {
  const { user } = useAuth();

  const { data: roles, isLoading } = useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: async (): Promise<AppRole[]> => {
      if (!user?.id) return [];
      
      // Cast to bypass type checking since user_roles isn't in generated types yet
      const client = supabase as unknown as {
        from: (table: string) => {
          select: (columns: string) => {
            eq: (column: string, value: string) => Promise<{ data: RoleRow[] | null; error: any }>;
          };
        };
      };

      const { data, error } = await client
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching user roles:', error);
        return [];
      }

      return data?.map(r => r.role) ?? [];
    },
    enabled: !!user?.id,
  });

  const isAdmin = roles?.includes('admin') ?? false;
  const isModerator = roles?.includes('moderator') ?? false;

  return {
    roles: roles ?? [],
    isAdmin,
    isModerator,
    isLoading,
  };
};
