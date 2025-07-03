import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/theme-provider';
import { Monitor, Moon, Sun } from 'lucide-react';

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  const themes = [
    {
      name: 'Light',
      value: 'light' as const,
      icon: Sun,
      description: 'Light theme'
    },
    {
      name: 'Dark', 
      value: 'dark' as const,
      icon: Moon,
      description: 'Dark theme'
    },
    {
      name: 'System',
      value: 'system' as const, 
      icon: Monitor,
      description: 'Use system preference'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Moon className="h-5 w-5" />
          Appearance
        </CardTitle>
        <CardDescription>
          Customize how clbhouz looks on your device
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {themes.map((themeOption) => {
            const Icon = themeOption.icon;
            const isSelected = theme === themeOption.value;
            
            return (
              <Button
                key={themeOption.value}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme(themeOption.value)}
                className={`h-auto p-4 flex flex-col items-center gap-2 ${
                  isSelected ? 'ring-2 ring-primary ring-offset-2' : ''
                }`}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs font-medium">{themeOption.name}</span>
              </Button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          Choose how clbhouz looks. Select a single theme, or sync with your system and automatically switch between day and night themes.
        </p>
      </CardContent>
    </Card>
  );
};

export default ThemeToggle;