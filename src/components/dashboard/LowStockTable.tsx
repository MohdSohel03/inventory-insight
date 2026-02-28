import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Product } from '@/hooks/useInventoryData';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface LowStockTableProps {
  products: Product[];
}

export const LowStockTable: React.FC<LowStockTableProps> = ({ products }) => {
  const lowStockProducts = products
    .filter((p) => p.stock_quantity < p.low_stock_threshold)
    .sort((a, b) => a.stock_quantity - b.stock_quantity);

  if (lowStockProducts.length === 0) {
    return (
      <div className="chart-container">
        <h3 className="text-lg font-semibold text-foreground mb-6">
          Low Stock Alerts
        </h3>
        <div className="py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-success" />
          </div>
          <p className="text-muted-foreground">All products are well stocked!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">
          Low Stock Alerts
        </h3>
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="w-3 h-3" />
          {lowStockProducts.length} items
        </Badge>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="hidden sm:table-cell">SKU</TableHead>
              <TableHead className="hidden md:table-cell">Category</TableHead>
              <TableHead className="text-right">In Stock</TableHead>
              <TableHead className="text-right">Threshold</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lowStockProducts.slice(0, 5).map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell className="text-muted-foreground hidden sm:table-cell">
                  {product.sku || '-'}
                </TableCell>
                <TableCell className="hidden md:table-cell">{product.category?.name || 'Uncategorized'}</TableCell>
                <TableCell className="text-right">
                  <Badge
                    variant={
                      product.stock_quantity === 0 ? 'destructive' : 'secondary'
                    }
                  >
                    {product.stock_quantity}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {product.low_stock_threshold}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
