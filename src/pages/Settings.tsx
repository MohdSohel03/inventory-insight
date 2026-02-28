import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { AppPreferences } from '@/components/settings/AppPreferences';
import { UserManagement } from '@/components/settings/UserManagement';
import { Separator } from '@/components/ui/separator';
import { useUserRole } from '@/hooks/useUserRole';

const Settings: React.FC = () => {
  const { isAdmin } = useUserRole();

  return (
    <DashboardLayout title="Settings" subtitle="Manage your profile and application preferences">
      <div className="max-w-3xl space-y-6 sm:space-y-8">
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
    </DashboardLayout>
  );
};

export default Settings;
