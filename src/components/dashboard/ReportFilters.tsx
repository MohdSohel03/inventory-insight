import React from 'react';
import { cn } from '@/lib/utils';

export type ReportType = 'inventory' | 'category' | 'value';
export type DateRange = 'all' | '30days' | '7days';

interface ReportFiltersProps {
  reportType: ReportType;
  onReportTypeChange: (type: ReportType) => void;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

export const ReportFilters: React.FC<ReportFiltersProps> = ({
  reportType,
  onReportTypeChange,
  dateRange,
  onDateRangeChange,
}) => {
  const reportTypes: { value: ReportType; label: string }[] = [
    { value: 'inventory', label: 'Inventory' },
    { value: 'category', label: 'Category' },
    { value: 'value', label: 'Value' },
  ];

  const dateRanges: { value: DateRange; label: string }[] = [
    { value: 'all', label: 'All Time' },
    { value: '30days', label: 'Last 30 Days' },
    { value: '7days', label: 'Last 7 Days' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-6 p-4 bg-card rounded-xl border border-border">
      {/* Report Type */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">
          Report Type:
        </span>
        <div className="flex gap-2">
          {reportTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => onReportTypeChange(type.value)}
              className={cn(
                'filter-button',
                reportType === type.value
                  ? 'filter-button-active'
                  : 'filter-button-inactive'
              )}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-border hidden sm:block" />

      {/* Date Range */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">
          Date Range:
        </span>
        <div className="flex gap-2">
          {dateRanges.map((range) => (
            <button
              key={range.value}
              onClick={() => onDateRangeChange(range.value)}
              className={cn(
                'filter-button',
                dateRange === range.value
                  ? 'filter-button-active'
                  : 'filter-button-inactive'
              )}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
