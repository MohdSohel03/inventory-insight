import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { DollarSign, TrendingUp, PiggyBank, AlertTriangle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { ReportFilters, ReportType, DateRange } from '@/components/dashboard/ReportFilters';
import { InventoryBarChart } from '@/components/charts/InventoryBarChart';
import { TopProductsPieChart } from '@/components/charts/TopProductsPieChart';
import { LowStockTable } from '@/components/dashboard/LowStockTable';
import { Button } from '@/components/ui/button';
import {
  useProducts,
  useCategories,
  useInventoryStats,
  useCategoryInventory,
  useTopProducts,
} from '@/hooks/useInventoryData';
import { exportProductsToCsv } from '@/utils/exportCsv';
import { Skeleton } from '@/components/ui/skeleton';

export default function Reports() {
  const [reportType, setReportType] = useState<ReportType>('inventory');
  const [dateRange, setDateRange] = useState<DateRange>('all');

  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: categories } = useCategories();

  const stats = useInventoryStats(products);
  const categoryInventory = useCategoryInventory(products, categories);
  const topProducts = useTopProducts(products, 5);


  if (productsLoading) {
    return (
      <DashboardLayout title="Reports" subtitle="Inventory analytics and insights">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Reports" subtitle="Inventory analytics and insights">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Inventory Value"
          value={formatCurrency(stats.totalValue)}
          icon={DollarSign}
          variant="primary"
        />
        <StatCard
          title="Potential Revenue"
          value={formatCurrency(stats.potentialRevenue)}
          icon={TrendingUp}
          variant="success"
        />
        <StatCard
          title="Potential Profit"
          value={formatCurrency(stats.potentialProfit)}
          icon={PiggyBank}
          variant="info"
        />
        <StatCard
          title="Low Stock Items"
          value={stats.lowStockCount}
          subtitle="Need attention"
          icon={AlertTriangle}
          variant="warning"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <ReportFilters
          reportType={reportType}
          onReportTypeChange={setReportType}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
        <Button onClick={() => products && exportProductsToCsv(products)} className="gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <InventoryBarChart
          data={categoryInventory}
          dataKey={reportType === 'value' ? 'value' : 'quantity'}
        />
        <TopProductsPieChart data={topProducts.map(p => ({ ...p, id: p.name }))} />
      </div>

      {/* Low Stock Table */}
      {products && <LowStockTable products={products} />}
    </DashboardLayout>
  );
}
