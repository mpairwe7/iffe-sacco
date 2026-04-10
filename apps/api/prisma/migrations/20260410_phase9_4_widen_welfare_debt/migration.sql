-- Phase 9.4: widen Member welfare debt columns from Decimal(15, 2) to
-- Decimal(18, 4) for consistency with the Phase 1 money-width standard.
--
-- No data loss: Decimal(18, 4) is a strict superset of Decimal(15, 2).
-- Existing values keep their numeric identity — e.g. "2500000.00" stays
-- exactly 2500000.00 after the widening, just with 2 additional unused
-- decimal places available.
--
-- Safe to run concurrently with live traffic.

ALTER TABLE "members"
  ALTER COLUMN "weddingSupportDebt" TYPE DECIMAL(18, 4),
  ALTER COLUMN "condolenceSupportDebt" TYPE DECIMAL(18, 4);
