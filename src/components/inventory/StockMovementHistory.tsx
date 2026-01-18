import { format } from 'date-fns';
import { ArrowDown, ArrowUp, Clock } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { StockMovement, useStockMovements } from '@/hooks/useStockMovements';

interface StockMovementHistoryProps {
  productId?: string;
}

const movementTypeLabels: Record<StockMovement['movement_type'], string> = {
  adjustment: 'Adjustment',
  bulk_update: 'Bulk Update',
  sale: 'Sale',
  purchase: 'Purchase',
  return: 'Return',
};

const movementTypeColors: Record<StockMovement['movement_type'], string> = {
  adjustment: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  bulk_update: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  sale: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  purchase: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  return: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
};

export const StockMovementHistory = ({ productId }: StockMovementHistoryProps) => {
  const { data: movements, isLoading } = useStockMovements(productId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!movements || movements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Clock className="h-12 w-12 mb-4" />
        <p>No stock movements recorded yet</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[500px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            {!productId && <TableHead>Product</TableHead>}
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Change</TableHead>
            <TableHead className="text-right">Before</TableHead>
            <TableHead className="text-right">After</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.map((movement) => (
            <TableRow key={movement.id}>
              <TableCell className="whitespace-nowrap">
                {format(new Date(movement.created_at), 'MMM d, yyyy HH:mm')}
              </TableCell>
              {!productId && (
                <TableCell>
                  <div>
                    <p className="font-medium">{movement.product?.name}</p>
                    {movement.product?.sku && (
                      <p className="text-xs text-muted-foreground">
                        {movement.product.sku}
                      </p>
                    )}
                  </div>
                </TableCell>
              )}
              <TableCell>
                <Badge
                  variant="secondary"
                  className={movementTypeColors[movement.movement_type]}
                >
                  {movementTypeLabels[movement.movement_type]}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <span
                  className={`inline-flex items-center gap-1 font-medium ${
                    movement.quantity_change > 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {movement.quantity_change > 0 ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
                  )}
                  {movement.quantity_change > 0 ? '+' : ''}
                  {movement.quantity_change}
                </span>
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {movement.previous_quantity}
              </TableCell>
              <TableCell className="text-right font-medium">
                {movement.new_quantity}
              </TableCell>
              <TableCell className="max-w-[200px] truncate text-muted-foreground">
                {movement.notes || '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
};
