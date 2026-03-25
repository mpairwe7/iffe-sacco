"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentGatewaysApi } from "@/lib/api/payment-gateways";

export function usePaymentGateways() {
  return useQuery({
    queryKey: ["payment-gateways"],
    queryFn: () => paymentGatewaysApi.getAll(),
  });
}

export function useTogglePaymentGateway() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paymentGatewaysApi.toggle(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payment-gateways"] }),
  });
}
