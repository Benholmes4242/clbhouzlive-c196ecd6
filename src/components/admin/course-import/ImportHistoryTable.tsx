import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { History, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export interface ImportHistoryEntry {
  id: string;
  fileName: string;
  date: Date;
  totalRecords: number;
  successCount: number;
  failedCount: number;
  skippedCount: number;
  status: 'completed' | 'partial' | 'failed';
}

interface ImportHistoryTableProps {
  history: ImportHistoryEntry[];
  onViewDetails?: (entry: ImportHistoryEntry) => void;
}

const ImportHistoryTable: React.FC<ImportHistoryTableProps> = ({
  history,
  onViewDetails,
}) => {
  const getStatusBadge = (status: ImportHistoryEntry['status']) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="default" className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case 'partial':
        return (
          <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
            <Clock className="h-3 w-3 mr-1" />
            Partial
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
    }
  };

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5" />
            Import History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No import history yet</p>
            <p className="text-sm">Your import history will appear here after your first import</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="h-5 w-5" />
          Import History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Date</th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">File</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Total</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Success</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Skipped</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Failed</th>
                <th className="text-center py-2 px-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b last:border-0 hover:bg-muted/50 cursor-pointer"
                  onClick={() => onViewDetails?.(entry)}
                >
                  <td className="py-2 px-3">
                    {format(entry.date, 'MMM d, yyyy h:mm a')}
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate max-w-[200px]">{entry.fileName}</span>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-right font-medium">{entry.totalRecords}</td>
                  <td className="py-2 px-3 text-right text-green-600">{entry.successCount}</td>
                  <td className="py-2 px-3 text-right text-amber-600">{entry.skippedCount}</td>
                  <td className="py-2 px-3 text-right text-red-600">{entry.failedCount}</td>
                  <td className="py-2 px-3 text-center">{getStatusBadge(entry.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImportHistoryTable;
