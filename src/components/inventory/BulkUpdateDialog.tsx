import { useState, useEffect } from 'react';
import { Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBulkUpdateStock } from '@/hooks/useStockMovements';
import { Product } from '@/hooks/useInventoryData';
import { toast } from 'sonner';

interface BulkUpdateDialogProps {
  products: Product[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProductUpdate {
  productId: string;
  name: string;
  currentQuantity: number;
  newQuantity: number;
}

export const BulkUpdateDialog = ({
  products,
  open,
  onOpenChange,
}: BulkUpdateDialogProps) => {
  const [updates, setUpdates] = useState<ProductUpdate[]>([]);
  const [notes, setNotes] = useState('');
  const bulkUpdate = useBulkUpdateStock();

  useEffect(() => {
    if (open) {
      setUpdates(
        products.map((p) => ({
          productId: p.id,
          name: p.name,
          currentQuantity: p.stock_quantity,
          newQuantity: p.stock_quantity,
        }))
      );
      setNotes('');
    }
  }, [open, products]);

  const handleQuantityChange = (productId: string, value: string) => {
    const newQuantity = parseInt(value) || 0;
    setUpdates((prev) =>
      prev.map((u) =>
        u.productId === productId ? { ...u, newQuantity: Math.max(0, newQuantity) } : u
      )
    );
  };

  const changedProducts = updates.filter(
    (u) => u.newQuantity !== u.currentQuantity
  );

  const handleSubmit = async () => {
    if (changedProducts.length === 0) {
      toast.error('No changes to save');
      return;
    }

    try {
      await bulkUpdate.mutateAsync({
        updates: changedProducts.map((u) => ({
          productId: u.productId,
          newQuantity: u.newQuantity,
          currentQuantity: u.currentQuantity,
        })),
        notes,
      });
      toast.success(`Updated stock for ${changedProducts.length} products`);
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to update stock');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk Stock Update
          </DialogTitle>
          <DialogDescription>
            Update stock quantities for multiple products at once.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[350px] pr-4">
          <div className="space-y-3">
            {updates.map((update) => (
              <div
                key={update.productId}
                className="flex items-center justify-between gap-4 p-3 rounded-lg border"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{update.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Current: {update.currentQuantity}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    value={update.newQuantity}
                    onChange={(e) =>
                      handleQuantityChange(update.productId, e.target.value)
                    }
                    className="w-24"
                  />
                  {update.newQuantity !== update.currentQuantity && (
                    <span
                      className={`text-sm font-medium ${
                        update.newQuantity > update.currentQuantity
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {update.newQuantity > update.currentQuantity ? '+' : ''}
                      {update.newQuantity - update.currentQuantity}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="space-y-4 pt-4 border-t">
          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add notes for this bulk update..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1"
            />
          </div>

          {changedProducts.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {changedProducts.length} product(s) will be updated
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={bulkUpdate.isPending || changedProducts.length === 0}
            >
              {bulkUpdate.isPending ? 'Updating...' : 'Update Stock'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
