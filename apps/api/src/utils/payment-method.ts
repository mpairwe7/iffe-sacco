/**
 * Maps the free-form `method` string stored on DepositRequest /
 * WithdrawRequest / Transaction rows to the strict enum the ledger
 * workflows expect (`cash | mobile_money | bank_transfer`). The enum
 * selects which GL account gets debited/credited on the cash side of
 * a journal entry.
 *
 * Unknown or unmapped values fall through to `cash` — it's the
 * conservative choice and matches the legacy default for rows that
 * don't specify a method.
 */
export type LedgerFundsSource = "cash" | "mobile_money" | "bank_transfer";

export function mapMethodToLedgerSource(method: string | null | undefined): LedgerFundsSource {
  if (!method) return "cash";
  const normalized = method.trim().toLowerCase();
  switch (normalized) {
    case "cash":
      return "cash";
    case "mobile_money":
    case "mobile money":
    case "momo":
    case "mtn":
    case "airtel":
      return "mobile_money";
    case "bank_transfer":
    case "bank transfer":
    case "bank":
    case "cheque":
    case "check":
    case "wire":
    case "eft":
      return "bank_transfer";
    default:
      return "cash";
  }
}
