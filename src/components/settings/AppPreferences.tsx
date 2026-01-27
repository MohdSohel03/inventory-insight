import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Moon, Sun, Bell, LayoutGrid } from 'lucide-react';

interface Preferences {
  theme: 'light' | 'dark' | 'system';
  lowStockNotifications: boolean;
  compactView: boolean;
  itemsPerPage: string;
}

const defaultPreferences: Preferences = {
  theme: 'light',
  lowStockNotifications: true,
  compactView: false,
  itemsPerPage: '10',
};

export const AppPreferences: React.FC = () => {
  const [preferences, setPreferences] = useState<Preferences>(() => {
    const saved = localStorage.getItem('app-preferences');
    return saved ? JSON.parse(saved) : defaultPreferences;
  });

  useEffect(() => {
    localStorage.setItem('app-preferences', JSON.stringify(preferences));
    
    // Apply theme
    const root = document.documentElement;
    if (preferences.theme === 'dark') {
      root.classList.add('dark');
    } else if (preferences.theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [preferences]);

  const updatePreference = <K extends keyof Preferences>(
    key: K,
    value: Preferences[K]
  ) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Preferences
        </CardTitle>
        <CardDescription>
          Customize your application experience
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Theme Selection */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {preferences.theme === 'dark' ? (
              <Moon className="w-5 h-5 text-muted-foreground" />
            ) : (
              <Sun className="w-5 h-5 text-muted-foreground" />
            )}
            <div>
              <Label htmlFor="theme" className="text-base">Theme</Label>
              <p className="text-sm text-muted-foreground">
                Choose your preferred color scheme
              </p>
            </div>
          </div>
          <Select
            value={preferences.theme}
            onValueChange={(value: 'light' | 'dark' | 'system') =>
              updatePreference('theme', value)
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Low Stock Notifications */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <div>
              <Label htmlFor="notifications" className="text-base">
                Low Stock Alerts
              </Label>
              <p className="text-sm text-muted-foreground">
                Show notifications for low stock items
              </p>
            </div>
          </div>
          <Switch
            id="notifications"
            checked={preferences.lowStockNotifications}
            onCheckedChange={(checked) =>
              updatePreference('lowStockNotifications', checked)
            }
          />
        </div>

        {/* Compact View */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LayoutGrid className="w-5 h-5 text-muted-foreground" />
            <div>
              <Label htmlFor="compactView" className="text-base">
                Compact View
              </Label>
              <p className="text-sm text-muted-foreground">
                Use a more condensed layout for tables
              </p>
            </div>
          </div>
          <Switch
            id="compactView"
            checked={preferences.compactView}
            onCheckedChange={(checked) =>
              updatePreference('compactView', checked)
            }
          />
        </div>

        {/* Items Per Page */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="itemsPerPage" className="text-base">
              Items Per Page
            </Label>
            <p className="text-sm text-muted-foreground">
              Number of items to display in tables
            </p>
          </div>
          <Select
            value={preferences.itemsPerPage}
            onValueChange={(value) => updatePreference('itemsPerPage', value)}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};
