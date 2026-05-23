-- Forces a password reset on next login for accounts issued a temporary
-- password (e.g. staff-provisioned member logins). Defaults to false so all
-- existing accounts are unaffected.
ALTER TABLE "users" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
