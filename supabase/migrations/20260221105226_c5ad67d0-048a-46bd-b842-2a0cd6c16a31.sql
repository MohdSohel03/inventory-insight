
-- Enable pg_net for HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create function to call low-stock-alert edge function when stock drops below threshold
CREATE OR REPLACE FUNCTION public.notify_low_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only fire when stock crosses below the threshold
  IF NEW.stock_quantity <= NEW.low_stock_threshold
     AND (OLD.stock_quantity > OLD.low_stock_threshold OR OLD.stock_quantity IS NULL) THEN
    PERFORM extensions.http_post(
      url := current_setting('app.settings.supabase_url', true) || '/functions/v1/low-stock-alert',
      body := jsonb_build_object('product_name', NEW.name, 'stock_quantity', NEW.stock_quantity, 'threshold', NEW.low_stock_threshold),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Attach trigger to products table
CREATE TRIGGER trg_notify_low_stock
AFTER UPDATE OF stock_quantity ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.notify_low_stock();
