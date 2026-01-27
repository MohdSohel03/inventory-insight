import React from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { AppPreferences } from '@/components/settings/AppPreferences';
import { UserManagement } from '@/components/settings/UserManagement';
import { Separator } from '@/components/ui/separator';
import { useUserRole } from '@/hooks/useUserRole';

const Settings: React.FC = () => {
  const { isAdmin } = useUserRole();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-64 p-8">
        <div className="max-w-3xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground mt-1">
              Manage your profile and application preferences
            </p>
          </div>

          <div className="space-y-8">
            <ProfileSettings />
            <Separator />
            <AppPreferences />
            {isAdmin && (
              <>
                <Separator />
                <UserManagement />
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
