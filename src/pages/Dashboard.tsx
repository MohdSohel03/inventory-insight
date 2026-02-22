import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useProducts, useInventoryStats } from '@/hooks/useInventoryData';
import { useStockMovements } from '@/hooks/useStockMovements';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Package, 
  DollarSign, 
  AlertTriangle, 
  TrendingUp,
  ArrowUpCircle,
  ArrowDownCircle,
  Clock,
  ChevronRight,
  Mail,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

export default function Dashboard() {
  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: movements, isLoading: movementsLoading } = useStockMovements();
  const stats = useInventoryStats(products);
  const { toast } = useToast();
  const [sendingAlert, setSendingAlert] = useState(false);

  const handleSendLowStockAlert = async () => {
    setSendingAlert(true);
    try {
      const { data, error } = await supabase.functions.invoke('low-stock-alert');
      if (error) throw error;
      if (data?.success) {
        toast({ title: 'Alert sent!', description: data.message });
      } else {
        throw new Error(data?.error || 'Failed to send alert');
      }
    } catch (err: any) {
      toast({
        title: 'Failed to send alert',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setSendingAlert(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const lowStockProducts = products?.filter(
    (p) => p.stock_quantity <= p.low_stock_threshold && p.stock_quantity > 0
  ) || [];

  const outOfStockProducts = products?.filter((p) => p.stock_quantity === 0) || [];

  const recentMovements = movements?.slice(0, 5) || [];

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'purchase':
      case 'return':
        return <ArrowUpCircle className="w-4 h-4 text-green-500" />;
      case 'sale':
        return <ArrowDownCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getMovementBadgeVariant = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'default';
      case 'sale':
        return 'secondary';
      case 'return':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <DashboardLayout title="Dashboard" subtitle="Overview of your inventory">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {productsLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </>
        ) : (
          <>
            <StatCard
              title="Total Products"
              value={products?.length || 0}
              subtitle="Active items in inventory"
              icon={Package}
              variant="primary"
            />
            <StatCard
              title="Inventory Value"
              value={formatCurrency(stats.totalValue)}
              subtitle="Total cost value"
              icon={DollarSign}
              variant="success"
            />
            <StatCard
              title="Potential Revenue"
              value={formatCurrency(stats.potentialRevenue)}
              subtitle="At current prices"
              icon={TrendingUp}
              variant="info"
            />
            <StatCard
              title="Low Stock Alerts"
              value={stats.lowStockCount}
              subtitle={outOfStockProducts.length > 0 ? `${outOfStockProducts.length} out of stock` : 'Items need attention'}
              icon={AlertTriangle}
              variant="warning"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/inventory" className="flex items-center gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {movementsLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-14" />
                ))}
              </div>
            ) : recentMovements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentMovements.map((movement) => (
                  <div
                    key={movement.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {getMovementIcon(movement.movement_type)}
                      <div>
                        <p className="font-medium text-sm">
                          {movement.product?.name || 'Unknown Product'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(movement.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-medium ${movement.quantity_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {movement.quantity_change > 0 ? '+' : ''}{movement.quantity_change}
                      </span>
                      <Badge variant={getMovementBadgeVariant(movement.movement_type)}>
                        {movement.movement_type}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Low Stock Alerts</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/reports" className="flex items-center gap-1">
                View Report <ChevronRight className="w-4 h-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-14" />
                ))}
              </div>
            ) : [...outOfStockProducts, ...lowStockProducts].length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>All products are well stocked</p>
              </div>
            ) : (
              <div className="space-y-4">
                {[...outOfStockProducts, ...lowStockProducts].slice(0, 5).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <AlertTriangle className={`w-4 h-4 ${product.stock_quantity === 0 ? 'text-destructive' : 'text-yellow-500'}`} />
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.sku || 'No SKU'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">
                        {product.stock_quantity} / {product.low_stock_threshold}
                      </span>
                      <Badge variant={product.stock_quantity === 0 ? 'destructive' : 'secondary'}>
                        {product.stock_quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/products">
                <Package className="w-4 h-4 mr-2" />
                Manage Products
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/inventory">
                <TrendingUp className="w-4 h-4 mr-2" />
                Update Stock
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/reports">
                <DollarSign className="w-4 h-4 mr-2" />
                View Reports
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={handleSendLowStockAlert}
              disabled={sendingAlert}
            >
              {sendingAlert ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Mail className="w-4 h-4 mr-2" />
              )}
              Send Low Stock Alert
            </Button>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
