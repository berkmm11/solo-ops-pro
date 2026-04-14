
CREATE OR REPLACE FUNCTION public.get_invoice_for_payment(p_invoice_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'id', i.id,
    'invoice_no', i.invoice_no,
    'amount', i.amount,
    'currency', i.currency,
    'due_date', i.due_date,
    'status', i.status,
    'description', i.description,
    'project_title', p.title,
    'client_name', c.name,
    'sender_name', COALESCE(pr.brand_name, pr.full_name, ''),
    'iban', pr.iban,
    'bank_name', pr.bank_name
  ) INTO result
  FROM invoices i
  LEFT JOIN projects p ON p.id = i.project_id
  LEFT JOIN clients c ON c.id = i.client_id
  LEFT JOIN profiles pr ON pr.user_id = i.user_id
  WHERE i.id = p_invoice_id;
  
  RETURN result;
END;
$$;
