"use client";

import { CreditCard, ToggleLeft, ToggleRight } from "lucide-react";

const gateways = [
  { name: "MTN Mobile Money", type: "Mobile Money", status: true, currency: "UGX", fee: "1.5%" },
  { name: "Airtel Money", type: "Mobile Money", status: true, currency: "UGX", fee: "1.5%" },
  { name: "Stanbic FlexiPay", type: "Bank", status: false, currency: "UGX", fee: "0.5%" },
  { name: "Visa/Mastercard", type: "Card", status: false, currency: "USD", fee: "2.5%" },
  { name: "PayPal", type: "Online", status: false, currency: "USD", fee: "3.0%" },
];

export default function PaymentGatewaysPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text">Payment Gateways</h1>
          <p className="text-text-muted text-sm">Configure automatic payment gateways</p>
        </div>
      </div>

      <div className="grid gap-4">
        {gateways.map((gw) => (
          <div key={gw.name} className="glass-card rounded-2xl p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-surface-alt flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-text-muted" />
              </div>
              <div>
                <h3 className="font-semibold text-text">{gw.name}</h3>
                <p className="text-sm text-text-muted">{gw.type} &middot; {gw.currency} &middot; Fee: {gw.fee}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${gw.status ? "bg-success/10 text-success" : "bg-text-light/10 text-text-light"}`}>
                {gw.status ? "Active" : "Inactive"}
              </span>
              <button className="text-text-muted hover:text-primary">
                {gw.status ? <ToggleRight className="w-8 h-8 text-success" /> : <ToggleLeft className="w-8 h-8" />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
