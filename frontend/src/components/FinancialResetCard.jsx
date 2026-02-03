import { useState } from "react";
import FinancialResetFlow from "./FinancialResetFlow";
import LoadingButton from "./LoadingButton";

export default function FinancialResetCard() {
  const [open, setOpen] = useState(false);
  const [isOpening, setIsOpening] = useState(false);

  return (
    <>
      <div className="rounded-2xl border border-black/10 bg-gradient-to-br from-white/90 via-white/70 to-white/50 p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-600">
            Financial Reset
          </div>
          <div className="rounded-full bg-black/5 px-2 py-1 text-[10px] font-semibold text-gray-700">
            60s sprint
          </div>
        </div>

        <div className="mt-4 text-lg font-semibold text-gray-900">
          Fix personal finance fast
        </div>
        <div className="mt-1 text-sm text-gray-600">
          One action per step. Instant payoff. Zero setup.
        </div>

        <div className="mt-4">
          <LoadingButton
            onClick={() => {
              setIsOpening(true);
              setTimeout(() => setIsOpening(false), 200);
              setOpen(true);
            }}
            isLoading={isOpening}
            className="w-full rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white shadow-md"
          >
            Financial Reset
          </LoadingButton>
        </div>
      </div>

      <FinancialResetFlow open={open} onClose={() => setOpen(false)} />
    </>
  );
}
