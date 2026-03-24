-- Eklenen index'leri doğrula
SELECT
  indexname,
  tablename,
  indexdef
FROM pg_indexes
WHERE tablename IN ('location_logs', 'audit_logs', 'shipments', 'support_tickets')
ORDER BY tablename, indexname;
