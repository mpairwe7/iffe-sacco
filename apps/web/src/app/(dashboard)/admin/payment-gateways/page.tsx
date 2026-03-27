"use client";

import { CreditCard, ToggleLeft, ToggleRight, Loader2 } from "lucide-react";
import { usePaymentGateways, useTogglePaymentGateway } from "@/hooks/use-payment-gateways";
import { toast } from "sonner";
import type { PaymentGateway } from "@iffe/shared";

export default function PaymentGatewaysPage() {
  const { data, isLoading } = usePaymentGateways();
  const toggleGateway = useTogglePaymentGateway();

  const gateways: PaymentGateway[] = Array.isArray(data) ? data : (data as any)?.data ?? [];

  function handleToggle(id: string) {
    toggleGateway.mutate(id, {
      onSuccess: () => toast.success("Gateway status updated"),
      onError: (err) => toast.error((err as Error).message || "Failed to toggle gateway"),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text">Payment Gateways</h1>
          <p className="text-text-muted text-sm">Configure automatic payment gateways</p>
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-card rounded-xl p-6 flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-surface-alt" />
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-surface-alt rounded" />
                  <div className="h-3 w-48 bg-surface-alt rounded" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-6 w-16 bg-surface-alt rounded-full" />
                <div className="h-8 w-8 bg-surface-alt rounded" />
              </div>
            </div>
          ))
        ) : gateways.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center">
            <CreditCard className="w-10 h-10 text-text-muted mx-auto mb-3" />
            <p className="text-text-muted">No payment gateways configured</p>
          </div>
        ) : (
          gateways.map((gw) => (
            <div key={gw.id} className="glass-card rounded-xl p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-surface-alt flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-text-muted" />
                </div>
                <div>
                  <h3 className="font-semibold text-text">{gw.name}</h3>
                  <p className="text-sm text-text-muted">{gw.type} &middot; {gw.currency} &middot; Fee: {gw.fee}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${gw.isActive ? "bg-success/10 text-success" : "bg-text-light/10 text-text-light"}`}>
                  {gw.isActive ? "Active" : "Inactive"}
                </span>
                <button
                  onClick={() => handleToggle(gw.id)}
                  disabled={toggleGateway.isPending}
                  className="text-text-muted hover:text-primary disabled:opacity-50"
                >
                  {gw.isActive ? <ToggleRight className="w-8 h-8 text-success" /> : <ToggleLeft className="w-8 h-8" />}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
