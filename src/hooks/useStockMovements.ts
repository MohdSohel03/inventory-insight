import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StockMovement {
  id: string;
  product_id: string;
  quantity_change: number;
  previous_quantity: number;
  new_quantity: number;
  movement_type: 'adjustment' | 'bulk_update' | 'sale' | 'purchase' | 'return';
  notes: string | null;
  created_at: string;
  created_by: string | null;
  product?: {
    id: string;
    name: string;
    sku: string | null;
  };
}

export const useStockMovements = (productId?: string) => {
  return useQuery({
    queryKey: ['stock_movements', productId],
    queryFn: async (): Promise<StockMovement[]> => {
      let query = supabase
        .from('stock_movements')
        .select(`
          *,
          product:products(id, name, sku)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (productId) {
        query = query.eq('product_id', productId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as StockMovement[];
    },
  });
};

interface AdjustStockParams {
  productId: string;
  quantityChange: number;
  currentQuantity: number;
  movementType: StockMovement['movement_type'];
  notes?: string;
}

export const useAdjustStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, quantityChange, currentQuantity, movementType, notes }: AdjustStockParams) => {
      const newQuantity = currentQuantity + quantityChange;

      // Update product stock
      const { error: productError } = await supabase
        .from('products')
        .update({ stock_quantity: newQuantity })
        .eq('id', productId);

      if (productError) throw productError;

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Record movement
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          product_id: productId,
          quantity_change: quantityChange,
          previous_quantity: currentQuantity,
          new_quantity: newQuantity,
          movement_type: movementType,
          notes: notes || null,
          created_by: user?.id || null,
        });

      if (movementError) throw movementError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock_movements'] });
    },
  });
};

interface BulkUpdateParams {
  updates: Array<{
    productId: string;
    newQuantity: number;
    currentQuantity: number;
  }>;
  notes?: string;
}

export const useBulkUpdateStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ updates, notes }: BulkUpdateParams) => {
      const { data: { user } } = await supabase.auth.getUser();

      for (const update of updates) {
        const quantityChange = update.newQuantity - update.currentQuantity;

        // Update product stock
        const { error: productError } = await supabase
          .from('products')
          .update({ stock_quantity: update.newQuantity })
          .eq('id', update.productId);

        if (productError) throw productError;

        // Record movement
        const { error: movementError } = await supabase
          .from('stock_movements')
          .insert({
            product_id: update.productId,
            quantity_change: quantityChange,
            previous_quantity: update.currentQuantity,
            new_quantity: update.newQuantity,
            movement_type: 'bulk_update',
            notes: notes || null,
            created_by: user?.id || null,
          });

        if (movementError) throw movementError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock_movements'] });
    },
  });
};
