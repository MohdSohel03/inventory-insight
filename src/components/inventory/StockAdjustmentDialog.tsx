import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Minus, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAdjustStock } from '@/hooks/useStockMovements';
import { Product } from '@/hooks/useInventoryData';
import { toast } from 'sonner';

const adjustmentSchema = z.object({
  adjustmentType: z.enum(['increase', 'decrease']),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  movementType: z.enum(['adjustment', 'sale', 'purchase', 'return']),
  notes: z.string().max(500).optional(),
});

type AdjustmentFormData = z.infer<typeof adjustmentSchema>;

interface StockAdjustmentDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const StockAdjustmentDialog = ({
  product,
  open,
  onOpenChange,
}: StockAdjustmentDialogProps) => {
  const adjustStock = useAdjustStock();

  const form = useForm<AdjustmentFormData>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      adjustmentType: 'increase',
      quantity: 1,
      movementType: 'adjustment',
      notes: '',
    },
  });

  const adjustmentType = form.watch('adjustmentType');
  const quantity = form.watch('quantity');

  const onSubmit = async (data: AdjustmentFormData) => {
    if (!product) return;

    const quantityChange = data.adjustmentType === 'increase' ? data.quantity : -data.quantity;
    const newQuantity = product.stock_quantity + quantityChange;

    if (newQuantity < 0) {
      toast.error('Stock cannot go below zero');
      return;
    }

    try {
      await adjustStock.mutateAsync({
        productId: product.id,
        quantityChange,
        currentQuantity: product.stock_quantity,
        movementType: data.movementType,
        notes: data.notes,
      });
      toast.success('Stock adjusted successfully');
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to adjust stock');
    }
  };

  const newQuantity = product
    ? adjustmentType === 'increase'
      ? product.stock_quantity + (quantity || 0)
      : product.stock_quantity - (quantity || 0)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adjust Stock</DialogTitle>
        </DialogHeader>
        {product && (
          <div className="mb-4 p-3 rounded-lg bg-muted">
            <p className="font-medium">{product.name}</p>
            <p className="text-sm text-muted-foreground">
              Current Stock: {product.stock_quantity} units
            </p>
          </div>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="adjustmentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adjustment Type</FormLabel>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={field.value === 'increase' ? 'default' : 'outline'}
                      className="flex-1"
                      onClick={() => field.onChange('increase')}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Increase
                    </Button>
                    <Button
                      type="button"
                      variant={field.value === 'decrease' ? 'destructive' : 'outline'}
                      className="flex-1"
                      onClick={() => field.onChange('decrease')}
                    >
                      <Minus className="h-4 w-4 mr-2" />
                      Decrease
                    </Button>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="movementType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select reason" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="adjustment">Manual Adjustment</SelectItem>
                      <SelectItem value="purchase">Purchase/Restock</SelectItem>
                      <SelectItem value="sale">Sale</SelectItem>
                      <SelectItem value="return">Return</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any notes about this adjustment..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="p-3 rounded-lg bg-muted">
              <p className="text-sm">
                New Stock:{' '}
                <span
                  className={
                    newQuantity < 0
                      ? 'text-destructive font-medium'
                      : 'font-medium'
                  }
                >
                  {newQuantity} units
                </span>
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={adjustStock.isPending || newQuantity < 0}>
                {adjustStock.isPending ? 'Saving...' : 'Save Adjustment'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
