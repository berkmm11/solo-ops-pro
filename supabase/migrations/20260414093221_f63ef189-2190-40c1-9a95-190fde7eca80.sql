-- Trigger function: when invoice status changes to 'paid', update linked project to 'ödendi'
CREATE OR REPLACE FUNCTION public.update_project_on_invoice_paid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status <> 'paid') AND NEW.project_id IS NOT NULL THEN
    UPDATE public.projects
    SET status = 'ödendi', updated_at = now()
    WHERE id = NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Attach trigger to invoices table
CREATE TRIGGER trg_invoice_paid_update_project
AFTER UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_project_on_invoice_paid();

-- Also handle when invoice is first inserted as paid
CREATE TRIGGER trg_invoice_insert_paid_update_project
AFTER INSERT ON public.invoices
FOR EACH ROW
WHEN (NEW.status = 'paid' AND NEW.project_id IS NOT NULL)
EXECUTE FUNCTION public.update_project_on_invoice_paid();

-- Set invoices.project_id to NULL when project is deleted (so we can delete projects freely)
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_project_id_fkey;
ALTER TABLE public.invoices ADD CONSTRAINT invoices_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;