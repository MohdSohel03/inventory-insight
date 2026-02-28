import { useState } from 'react';
import { ArrowUpDown, Edit, Search } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Product } from '@/hooks/useInventoryData';

interface InventoryTableProps {
  products: Product[] | undefined;
  isLoading: boolean;
  onAdjustStock: (product: Product) => void;
}

type SortField = 'name' | 'stock_quantity' | 'category';
type SortDirection = 'asc' | 'desc';

export const InventoryTable = ({
  products,
  isLoading,
  onAdjustStock,
}: InventoryTableProps) => {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredProducts = products
    ?.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku?.toLowerCase().includes(search.toLowerCase()) ||
        p.category?.name.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'stock_quantity':
          comparison = a.stock_quantity - b.stock_quantity;
          break;
        case 'category':
          comparison = (a.category?.name || '').localeCompare(
            b.category?.name || ''
          );
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  const getStockStatus = (product: Product) => {
    if (product.stock_quantity === 0) {
      return { label: 'Out of Stock', variant: 'destructive' as const };
    }
    if (product.stock_quantity < product.low_stock_threshold) {
      return { label: 'Low Stock', variant: 'secondary' as const };
    }
    return { label: 'In Stock', variant: 'default' as const };
  };

  const getStockPercentage = (product: Product) => {
    const maxStock = Math.max(product.low_stock_threshold * 3, 100);
    return Math.min((product.stock_quantity / maxStock) * 100, 100);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('name')}
                  className="-ml-3"
                >
                  Product
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="hidden md:table-cell">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('category')}
                  className="-ml-3"
                >
                  Category
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('stock_quantity')}
                  className="-ml-3"
                >
                  Stock
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead className="w-[80px] sm:w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <p className="text-muted-foreground">No products found</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts?.map((product) => {
                const status = getStockStatus(product);
                const stockPercentage = getStockPercentage(product);

                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        {product.sku && (
                          <p className="text-sm text-muted-foreground">
                            SKU: {product.sku}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {product.category?.name || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {product.stock_quantity}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Min: {product.low_stock_threshold}
                          </span>
                        </div>
                        <Progress
                          value={stockPercentage}
                          className={`h-2 ${
                            status.variant === 'destructive'
                              ? '[&>div]:bg-destructive'
                              : status.variant === 'secondary'
                              ? '[&>div]:bg-yellow-500'
                              : '[&>div]:bg-green-500'
                          }`}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onAdjustStock(product)}
                        className="px-2 sm:px-3"
                      >
                        <Edit className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Adjust</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
