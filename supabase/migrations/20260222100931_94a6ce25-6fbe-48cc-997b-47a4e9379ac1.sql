
-- Drop and recreate with hardcoded URL (project-specific)
CREATE OR REPLACE FUNCTION public.notify_low_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _supabase_url text := 'https://djfgouhzghtjxgaspgmb.supabase.co';
  _service_role_key text;
BEGIN
  -- Only fire when stock crosses below the threshold
  IF NEW.stock_quantity <= NEW.low_stock_threshold
     AND OLD.stock_quantity > OLD.low_stock_threshold THEN

    SELECT decrypted_secret INTO _service_role_key
    FROM vault.decrypted_secrets
    WHERE name = 'SUPABASE_SERVICE_ROLE_KEY'
    LIMIT 1;

    IF _service_role_key IS NOT NULL THEN
      PERFORM net.http_post(
        url := _supabase_url || '/functions/v1/low-stock-alert',
        body := jsonb_build_object(
          'product_name', NEW.name,
          'stock_quantity', NEW.stock_quantity,
          'threshold', NEW.low_stock_threshold
        ),
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || _service_role_key
        )
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
