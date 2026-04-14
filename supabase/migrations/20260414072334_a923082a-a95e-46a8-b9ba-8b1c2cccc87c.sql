
CREATE OR REPLACE FUNCTION public.get_client_invoice_stats(p_user_id UUID)
RETURNS TABLE (
  client_id UUID,
  total_invoices BIGINT,
  overdue_count BIGINT,
  ontime_count BIGINT,
  computed_score TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id AS client_id,
    COUNT(i.id) AS total_invoices,
    COUNT(i.id) FILTER (WHERE i.status = 'overdue') AS overdue_count,
    COUNT(i.id) FILTER (WHERE i.status IN ('paid', 'pending')) AS ontime_count,
    CASE
      WHEN COUNT(i.id) FILTER (WHERE i.status = 'overdue') = 0 THEN 'A'
      WHEN COUNT(i.id) FILTER (WHERE i.status = 'overdue') BETWEEN 1 AND 2 THEN 'B'
      ELSE 'C'
    END AS computed_score
  FROM public.clients c
  LEFT JOIN public.invoices i ON i.client_id = c.id
  WHERE c.user_id = p_user_id
  GROUP BY c.id;
$$;
