import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Shield, ShieldAlert, Loader2, Plus, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

type AppRole = 'admin' | 'moderator' | 'user';

interface UserWithRoles {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  email: string;
  roles: AppRole[];
}

export const UserManagement: React.FC = () => {
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<AppRole>('user');
  const [addingRole, setAddingRole] = useState<string | null>(null);
  const [removingRole, setRemovingRole] = useState<{ userId: string; role: AppRole } | null>(null);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url');

      if (profilesError) throw profilesError;

      // Fetch all user roles (admin can see all)
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const usersWithRoles: UserWithRoles[] = (profiles || []).map((profile) => {
        const userRoles = (roles || [])
          .filter((r) => r.user_id === profile.user_id)
          .map((r) => r.role as AppRole);

        return {
          user_id: profile.user_id,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          email: profile.display_name || profile.user_id.slice(0, 8),
          roles: userRoles,
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddRole = async (userId: string, role: AppRole) => {
    setAddingRole(userId);
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Role exists',
            description: 'User already has this role',
            variant: 'destructive',
          });
          return;
        }
        throw error;
      }

      toast({
        title: 'Role added',
        description: `Successfully added ${role} role`,
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add role',
        variant: 'destructive',
      });
    } finally {
      setAddingRole(null);
    }
  };

  const handleRemoveRole = async (userId: string, role: AppRole) => {
    setRemovingRole({ userId, role });
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);

      if (error) throw error;

      toast({
        title: 'Role removed',
        description: `Successfully removed ${role} role`,
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove role',
        variant: 'destructive',
      });
    } finally {
      setRemovingRole(null);
    }
  };

  const getRoleBadgeVariant = (role: AppRole) => {
    switch (role) {
      case 'admin':
        return 'default';
      case 'moderator':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getInitials = (name: string | null, id: string) => {
    if (name) return name.slice(0, 2).toUpperCase();
    return id.slice(0, 2).toUpperCase();
  };

  if (roleLoading || loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 py-8 text-muted-foreground">
          <ShieldAlert className="w-5 h-5" />
          <span>You need admin privileges to manage users</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          User Management
        </CardTitle>
        <CardDescription>
          Manage user roles and permissions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No users found</p>
            <p className="text-sm">Users will appear here once they create a profile</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead className="w-[200px]">Add Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.user_id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {getInitials(user.display_name, user.user_id)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {user.display_name || 'Unnamed User'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.user_id.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {user.roles.length === 0 ? (
                        <span className="text-sm text-muted-foreground">No roles</span>
                      ) : (
                        user.roles.map((role) => (
                          <AlertDialog key={role}>
                            <AlertDialogTrigger asChild>
                              <Badge
                                variant={getRoleBadgeVariant(role)}
                                className="cursor-pointer group flex items-center gap-1"
                              >
                                <Shield className="w-3 h-3" />
                                {role}
                                <Trash2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </Badge>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Role</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove the "{role}" role from this user?
                                  This will revoke their associated permissions.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRemoveRole(user.user_id, role)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {removingRole?.userId === user.user_id &&
                                  removingRole?.role === role ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    'Remove'
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Select
                        value={selectedRole}
                        onValueChange={(value: AppRole) => setSelectedRole(value)}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="moderator">Moderator</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        onClick={() => handleAddRole(user.user_id, selectedRole)}
                        disabled={addingRole === user.user_id || user.roles.includes(selectedRole)}
                      >
                        {addingRole === user.user_id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
