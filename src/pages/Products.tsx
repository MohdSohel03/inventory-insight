import React, { useState, useMemo } from 'react';
import { Plus, Search, ShieldAlert } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useProducts, useCategories, Product } from '@/hooks/useInventoryData';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { ProductsTable, SortField, SortDirection } from '@/components/products/ProductsTable';
import { ProductFormDialog } from '@/components/products/ProductFormDialog';
import { DeleteProductDialog } from '@/components/products/DeleteProductDialog';
import { useUserRole } from '@/hooks/useUserRole';

const ITEMS_PER_PAGE = 10;

export default function Products() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: categories = [] } = useCategories();
  const { isAdmin, isLoading: roleLoading } = useUserRole();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Dialog states
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter, sort, and paginate products
  const processedProducts = useMemo(() => {
    if (!products) return { items: [], totalPages: 0, totalItems: 0 };

    let filtered = products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory =
        categoryFilter === 'all' || product.category_id === categoryFilter;
      return matchesSearch && matchesCategory;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'sku':
          aValue = (a.sku || '').toLowerCase();
          bValue = (b.sku || '').toLowerCase();
          break;
        case 'category':
          aValue = (a.category?.name || '').toLowerCase();
          bValue = (b.category?.name || '').toLowerCase();
          break;
        case 'cost_price':
          aValue = a.cost_price;
          bValue = b.cost_price;
          break;
        case 'selling_price':
          aValue = a.selling_price;
          bValue = b.selling_price;
          break;
        case 'stock_quantity':
          aValue = a.stock_quantity;
          bValue = b.stock_quantity;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const items = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    return { items, totalPages, totalItems };
  }, [products, searchQuery, categoryFilter, sortField, sortDirection, currentPage]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setFormOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setFormOpen(true);
  };

  const handleDeleteProduct = (product: Product) => {
    setSelectedProduct(product);
    setDeleteOpen(true);
  };

  const handleFormSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      if (selectedProduct) {
        // Update
        const { error } = await supabase
          .from('products')
          .update({
            name: data.name,
            sku: data.sku || null,
            category_id: data.category_id || null,
            cost_price: data.cost_price,
            selling_price: data.selling_price,
            stock_quantity: data.stock_quantity,
            low_stock_threshold: data.low_stock_threshold,
          })
          .eq('id', selectedProduct.id);

        if (error) throw error;
        toast({ title: 'Product updated successfully' });
      } else {
        // Insert
        const { error } = await supabase.from('products').insert({
          name: data.name,
          sku: data.sku || null,
          category_id: data.category_id || null,
          cost_price: data.cost_price,
          selling_price: data.selling_price,
          stock_quantity: data.stock_quantity,
          low_stock_threshold: data.low_stock_threshold,
        });

        if (error) throw error;
        toast({ title: 'Product added successfully' });
      }

      await queryClient.invalidateQueries({ queryKey: ['products'] });
      setFormOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProduct) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', selectedProduct.id);

      if (error) throw error;

      toast({ title: 'Product deleted successfully' });
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      setDeleteOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (productsLoading || roleLoading) {
    return (
      <DashboardLayout title="Products" subtitle="Manage your inventory">
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Products" subtitle="Manage your inventory">
      {/* Admin-only notice */}
      {!isAdmin && (
        <Alert className="mb-6">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            You have read-only access. Contact an administrator to manage products.
          </AlertDescription>
        </Alert>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 flex-1">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products or SKU..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>
          <Select
            value={categoryFilter}
            onValueChange={(value) => {
              setCategoryFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {isAdmin && (
          <Button onClick={handleAddProduct} className="gap-2 w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm">
        <ProductsTable
          products={processedProducts.items}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          onEdit={handleEditProduct}
          onDelete={handleDeleteProduct}
          isAdmin={isAdmin}
        />

        {/* Pagination */}
        {processedProducts.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-4 border-t border-border gap-3">
            <p className="text-sm text-muted-foreground text-center sm:text-left">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
              {Math.min(currentPage * ITEMS_PER_PAGE, processedProducts.totalItems)} of{' '}
              {processedProducts.totalItems} products
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: processedProducts.totalPages }, (_, i) => i + 1)
                  .filter(
                    (page) =>
                      page === 1 ||
                      page === processedProducts.totalPages ||
                      Math.abs(page - currentPage) <= 1
                  )
                  .map((page, index, array) => (
                    <React.Fragment key={page}>
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="px-2 text-muted-foreground">...</span>
                      )}
                      <Button
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-8"
                      >
                        {page}
                      </Button>
                    </React.Fragment>
                  ))}
              </div>
              <span className="sm:hidden text-sm text-muted-foreground">
                {currentPage}/{processedProducts.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(processedProducts.totalPages, p + 1))}
                disabled={currentPage === processedProducts.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <ProductFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        product={selectedProduct}
        categories={categories}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
      />

      <DeleteProductDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        productName={selectedProduct?.name || ''}
        onConfirm={handleDeleteConfirm}
        isLoading={isSubmitting}
      />
    </DashboardLayout>
  );
}
