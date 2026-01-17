import React from 'react';
import { ArrowUpDown, Edit, Trash2, AlertTriangle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/hooks/useInventoryData';

export type SortField = 'name' | 'sku' | 'category' | 'cost_price' | 'selling_price' | 'stock_quantity';
export type SortDirection = 'asc' | 'desc';

interface ProductsTableProps {
  products: Product[];
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export const ProductsTable: React.FC<ProductsTableProps> = ({
  products,
  sortField,
  sortDirection,
  onSort,
  onEdit,
  onDelete,
}) => {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const SortableHeader: React.FC<{ field: SortField; children: React.ReactNode }> = ({
    field,
    children,
  }) => (
    <Button
      variant="ghost"
      className="h-auto p-0 font-medium hover:bg-transparent"
      onClick={() => onSort(field)}
    >
      {children}
      <ArrowUpDown
        className={`ml-2 h-4 w-4 ${
          sortField === field ? 'text-primary' : 'text-muted-foreground'
        }`}
      />
    </Button>
  );

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No products found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <SortableHeader field="name">Product</SortableHeader>
            </TableHead>
            <TableHead>
              <SortableHeader field="sku">SKU</SortableHeader>
            </TableHead>
            <TableHead>
              <SortableHeader field="category">Category</SortableHeader>
            </TableHead>
            <TableHead className="text-right">
              <SortableHeader field="cost_price">Cost</SortableHeader>
            </TableHead>
            <TableHead className="text-right">
              <SortableHeader field="selling_price">Price</SortableHeader>
            </TableHead>
            <TableHead className="text-right">
              <SortableHeader field="stock_quantity">Stock</SortableHeader>
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const isLowStock = product.stock_quantity < product.low_stock_threshold;
            return (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {product.sku || '-'}
                </TableCell>
                <TableCell>
                  {product.category?.name ? (
                    <Badge variant="secondary">{product.category.name}</Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(product.cost_price)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(product.selling_price)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {isLowStock && (
                      <AlertTriangle className="w-4 h-4 text-warning" />
                    )}
                    <Badge variant={isLowStock ? 'destructive' : 'secondary'}>
                      {product.stock_quantity}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(product)}
                      className="h-8 w-8"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(product)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
