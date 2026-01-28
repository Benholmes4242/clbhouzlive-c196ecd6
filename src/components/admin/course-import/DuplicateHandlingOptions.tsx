import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Copy, RefreshCw, Plus } from 'lucide-react';

export type DuplicateHandling = 'skip' | 'update' | 'create';

interface DuplicateHandlingOptionsProps {
  value: DuplicateHandling;
  onChange: (value: DuplicateHandling) => void;
}

const DuplicateHandlingOptions: React.FC<DuplicateHandlingOptionsProps> = ({
  value,
  onChange,
}) => {
  const options = [
    {
      value: 'skip' as const,
      label: 'Skip duplicates',
      description: 'If a course with the same name and country exists, skip it',
      icon: Copy,
      recommended: true,
    },
    {
      value: 'update' as const,
      label: 'Update existing',
      description: 'If a course exists, update it with new data from the import',
      icon: RefreshCw,
    },
    {
      value: 'create' as const,
      label: 'Create all',
      description: 'Create new entries for all courses, even if duplicates exist',
      icon: Plus,
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Duplicate Handling</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup value={value} onValueChange={(v) => onChange(v as DuplicateHandling)}>
          <div className="space-y-2">
            {options.map((option) => (
              <div
                key={option.value}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  value === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/50'
                }`}
                onClick={() => onChange(option.value)}
              >
                <RadioGroupItem value={option.value} id={option.value} className="mt-0.5" />
                <div className="flex-1 min-w-0">
                  <Label htmlFor={option.value} className="font-medium cursor-pointer flex items-center gap-2">
                    <option.icon className="h-4 w-4" />
                    {option.label}
                    {option.recommended && (
                      <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 px-1.5 py-0.5 rounded">
                        Recommended
                      </span>
                    )}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{option.description}</p>
                </div>
              </div>
            ))}
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
};

export default DuplicateHandlingOptions;
