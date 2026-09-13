begin;

-- Run only after validate has canonicalized customer_id, is_block and status.
-- Client-supplied status/customer identity must never decide who is counted.
alter trigger trg_reservations_limits on public.reservations
  rename to trg_reservations_zz_limits;

commit;
