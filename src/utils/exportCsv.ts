import { Product } from '@/hooks/useInventoryData';

export const exportProductsToCsv = (products: Product[]) => {
  const headers = [
    'Name',
    'SKU',
    'Category',
    'Cost Price',
    'Selling Price',
    'Stock Quantity',
    'Low Stock Threshold',
    'Inventory Value',
    'Potential Revenue',
  ];

  const rows = products.map((product) => [
    product.name,
    product.sku || '',
    product.category?.name || 'Uncategorized',
    product.cost_price.toFixed(2),
    product.selling_price.toFixed(2),
    product.stock_quantity,
    product.low_stock_threshold,
    (product.cost_price * product.stock_quantity).toFixed(2),
    (product.selling_price * product.stock_quantity).toFixed(2),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `inventory-report-${new Date().toISOString().split('T')[0]}.csv`
  );
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
