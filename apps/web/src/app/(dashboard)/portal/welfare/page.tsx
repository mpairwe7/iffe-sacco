"use client";

import { useState } from "react";
import { Heart, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useWelfarePrograms, useCreatePledge, useMyPledges } from "@/hooks/use-welfare";
import { formatCurrency } from "@/lib/utils";
import { StatSkeleton, CardSkeleton } from "@/components/ui/skeleton";

export default function WelfarePage() {
  const { data, isLoading } = useWelfarePrograms();
  const { data: myPledges } = useMyPledges();
  const createPledge = useCreatePledge();

  const programs = data?.data ?? [];
  const pledges = Array.isArray(myPledges) ? myPledges : [];
  const totalPledged = pledges.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  const totalRaised = programs.reduce((sum: number, p: any) => sum + (p.raisedAmount || 0), 0);

  const [pledgeDialogOpen, setPledgeDialogOpen] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");
  const [pledgeAmount, setPledgeAmount] = useState("");
  const [pledging, setPledging] = useState(false);

  function openPledgeDialog(programId: string) {
    setSelectedProgramId(programId);
    setPledgeAmount("");
    setPledgeDialogOpen(true);
  }

  async function handlePledge() {
    const amount = parseFloat(pledgeAmount);
    if (!amount || amount < 1000) {
      toast.error("Minimum pledge is USh 1,000");
      return;
    }
    setPledging(true);
    try {
      await createPledge.mutateAsync({
        programId: selectedProgramId,
        amount,
      });
      toast.success("Pledge submitted successfully!");
      setPledgeDialogOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create pledge";
      toast.error(message);
    } finally {
      setPledging(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-danger/15 flex items-center justify-center">
          <Heart className="w-5 h-5 text-danger" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Social Welfare Programs</h1>
          <p className="text-text-muted text-sm">Support your community through welfare contributions</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatSkeleton />
          <StatSkeleton />
          <StatSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-5">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Active Programs</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{programs.filter((p) => p.status === "active").length}</p>
          </div>
          <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-5">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">My Total Pledges</p>
            <p className="text-2xl font-bold text-primary mt-1">{formatCurrency(totalPledged)}</p>
          </div>
          <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-5">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Raised</p>
            <p className="text-2xl font-bold text-success mt-1">{formatCurrency(totalRaised)}</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {programs.length === 0 ? (
            <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-8 text-center col-span-full">
              <p className="text-text-muted">No welfare programs available at this time.</p>
            </div>
          ) : (
            programs.map((program) => {
              const progress = program.targetAmount > 0 ? (program.raisedAmount / program.targetAmount) * 100 : 0;
              return (
                <div key={program.id} className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900 dark:text-white">{program.name}</h3>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      program.status === "active" ? "text-success bg-success/15" :
                      program.status === "completed" ? "text-info bg-info/10" :
                      "text-warning bg-warning/15"
                    }`}>
                      {program.status.charAt(0).toUpperCase() + program.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-text-muted mb-4">{program.description}</p>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-text-muted">{program.contributorCount} contributors</span>
                    <span className="font-medium text-text">{Math.round(progress)}% funded</span>
                  </div>
                  <div className="h-2 bg-surface-alt rounded-full mb-2">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-sm mb-4">
                    <span className="text-text-muted">{formatCurrency(program.raisedAmount)} raised</span>
                    <span className="text-text-muted">of {formatCurrency(program.targetAmount)}</span>
                  </div>
                  <button
                    onClick={() => openPledgeDialog(program.id)}
                    disabled={program.status !== "active"}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Heart className="w-4 h-4" /> Make a Pledge
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Pledge Dialog */}
      {pledgeDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setPledgeDialogOpen(false)} />
          <div className="relative bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-6 w-full max-w-md mx-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Make a Pledge</h3>
              <button onClick={() => setPledgeDialogOpen(false)} className="p-1 hover:bg-surface-alt rounded-lg">
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {programs.find((p) => p.id === selectedProgramId)?.name}
            </p>
            <div>
              <label className="block text-sm font-medium text-text mb-2">Pledge Amount (USh)</label>
              <input
                type="number"
                min="1000"
                step="1000"
                placeholder="Enter amount (min 1,000)"
                value={pledgeAmount}
                onChange={(e) => setPledgeAmount(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setPledgeDialogOpen(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-text border border-border rounded-lg hover:bg-surface-alt transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePledge}
                disabled={pledging}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {pledging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className="w-4 h-4" />}
                Confirm Pledge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
