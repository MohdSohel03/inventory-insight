import { useState } from 'react';
import { History, Package, Upload } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InventoryTable } from '@/components/inventory/InventoryTable';
import { StockAdjustmentDialog } from '@/components/inventory/StockAdjustmentDialog';
import { BulkUpdateDialog } from '@/components/inventory/BulkUpdateDialog';
import { StockMovementHistory } from '@/components/inventory/StockMovementHistory';
import { useProducts, Product } from '@/hooks/useInventoryData';

const Inventory = () => {
  const { data: products, isLoading } = useProducts();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);

  const handleAdjustStock = (product: Product) => {
    setSelectedProduct(product);
    setAdjustDialogOpen(true);
  };

  const lowStockProducts = products?.filter(
    (p) => p.stock_quantity < p.low_stock_threshold
  );

  const outOfStockProducts = products?.filter((p) => p.stock_quantity === 0);

  return (
    <DashboardLayout title="Inventory" subtitle="Manage stock levels and view movement history">
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button onClick={() => setBulkDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Bulk Update
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Products
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
              <Package className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {lowStockProducts?.length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
              <Package className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {outOfStockProducts?.length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="stock" className="space-y-4">
          <TabsList>
            <TabsTrigger value="stock" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Stock Levels
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Movement History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stock">
            <Card>
              <CardHeader>
                <CardTitle>Stock Levels</CardTitle>
              </CardHeader>
              <CardContent>
                <InventoryTable
                  products={products}
                  isLoading={isLoading}
                  onAdjustStock={handleAdjustStock}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Stock Movement History</CardTitle>
              </CardHeader>
              <CardContent>
                <StockMovementHistory />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <StockAdjustmentDialog
        product={selectedProduct}
        open={adjustDialogOpen}
        onOpenChange={setAdjustDialogOpen}
      />

      <BulkUpdateDialog
        products={products || []}
        open={bulkDialogOpen}
        onOpenChange={setBulkDialogOpen}
      />
    </DashboardLayout>
  );
};

export default Inventory;
