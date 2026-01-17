import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Product {
  id: string;
  name: string;
  category_id: string | null;
  cost_price: number;
  selling_price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  sku: string | null;
  created_at: string;
  updated_at: string;
  category?: {
    id: string;
    name: string;
  };
}

export interface Category {
  id: string;
  name: string;
  created_at: string;
}

export interface InventoryStats {
  totalValue: number;
  potentialRevenue: number;
  potentialProfit: number;
  lowStockCount: number;
}

export interface CategoryInventory {
  category: string;
  quantity: number;
  value: number;
}

export interface TopProduct {
  name: string;
  value: number;
}

export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        cost_price: Number(item.cost_price),
        selling_price: Number(item.selling_price),
      }));
    },
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });
};

export const useInventoryStats = (products: Product[] | undefined) => {
  if (!products) {
    return {
      totalValue: 0,
      potentialRevenue: 0,
      potentialProfit: 0,
      lowStockCount: 0,
    };
  }

  const totalValue = products.reduce(
    (sum, p) => sum + p.cost_price * p.stock_quantity,
    0
  );

  const potentialRevenue = products.reduce(
    (sum, p) => sum + p.selling_price * p.stock_quantity,
    0
  );

  const potentialProfit = potentialRevenue - totalValue;

  const lowStockCount = products.filter(
    (p) => p.stock_quantity < p.low_stock_threshold
  ).length;

  return {
    totalValue,
    potentialRevenue,
    potentialProfit,
    lowStockCount,
  };
};

export const useCategoryInventory = (
  products: Product[] | undefined,
  categories: Category[] | undefined
): CategoryInventory[] => {
  if (!products || !categories) return [];

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const inventoryByCategory = products.reduce((acc, product) => {
    const categoryName = product.category?.name || 'Uncategorized';
    if (!acc[categoryName]) {
      acc[categoryName] = { quantity: 0, value: 0 };
    }
    acc[categoryName].quantity += product.stock_quantity;
    acc[categoryName].value += product.cost_price * product.stock_quantity;
    return acc;
  }, {} as Record<string, { quantity: number; value: number }>);

  return Object.entries(inventoryByCategory).map(([category, data]) => ({
    category,
    quantity: data.quantity,
    value: data.value,
  }));
};

export const useTopProducts = (
  products: Product[] | undefined,
  limit: number = 5
): TopProduct[] => {
  if (!products) return [];

  return products
    .map((p) => ({
      name: p.name,
      value: p.selling_price * p.stock_quantity,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
};
