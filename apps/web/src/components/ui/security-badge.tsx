import { Shield } from "lucide-react";

export function SecurityBadge() {
  return (
    <div className="flex items-center justify-center gap-2 text-xs text-text-light mt-6">
      <Shield className="w-3.5 h-3.5" />
      <span>Protected with 256-bit SSL encryption</span>
    </div>
  );
}
