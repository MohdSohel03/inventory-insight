-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  cost_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  selling_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 10,
  sku TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories (authenticated users can read, admins can modify)
CREATE POLICY "Authenticated users can view categories"
  ON public.categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert categories"
  ON public.categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update categories"
  ON public.categories FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete categories"
  ON public.categories FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for products
CREATE POLICY "Authenticated users can view products"
  ON public.products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert products"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update products"
  ON public.products FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete products"
  ON public.products FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default categories
INSERT INTO public.categories (name) VALUES
  ('Electronics'),
  ('Clothing'),
  ('Food & Beverages'),
  ('Office Supplies'),
  ('Furniture');

-- Insert sample products
INSERT INTO public.products (name, category_id, cost_price, selling_price, stock_quantity, low_stock_threshold, sku) VALUES
  ('Wireless Mouse', (SELECT id FROM public.categories WHERE name = 'Electronics'), 15.00, 29.99, 150, 20, 'ELEC-001'),
  ('Mechanical Keyboard', (SELECT id FROM public.categories WHERE name = 'Electronics'), 45.00, 89.99, 75, 15, 'ELEC-002'),
  ('USB-C Hub', (SELECT id FROM public.categories WHERE name = 'Electronics'), 25.00, 49.99, 5, 10, 'ELEC-003'),
  ('Cotton T-Shirt', (SELECT id FROM public.categories WHERE name = 'Clothing'), 8.00, 24.99, 200, 30, 'CLTH-001'),
  ('Denim Jeans', (SELECT id FROM public.categories WHERE name = 'Clothing'), 20.00, 59.99, 120, 25, 'CLTH-002'),
  ('Organic Coffee Beans', (SELECT id FROM public.categories WHERE name = 'Food & Beverages'), 12.00, 24.99, 80, 20, 'FOOD-001'),
  ('Green Tea Pack', (SELECT id FROM public.categories WHERE name = 'Food & Beverages'), 5.00, 12.99, 3, 15, 'FOOD-002'),
  ('A4 Paper Ream', (SELECT id FROM public.categories WHERE name = 'Office Supplies'), 3.00, 8.99, 500, 50, 'OFFC-001'),
  ('Ballpoint Pens (12pk)', (SELECT id FROM public.categories WHERE name = 'Office Supplies'), 2.00, 6.99, 8, 20, 'OFFC-002'),
  ('Ergonomic Office Chair', (SELECT id FROM public.categories WHERE name = 'Furniture'), 150.00, 299.99, 25, 5, 'FURN-001'),
  ('Standing Desk', (SELECT id FROM public.categories WHERE name = 'Furniture'), 200.00, 449.99, 15, 5, 'FURN-002'),
  ('Monitor Stand', (SELECT id FROM public.categories WHERE name = 'Electronics'), 18.00, 39.99, 45, 10, 'ELEC-004');