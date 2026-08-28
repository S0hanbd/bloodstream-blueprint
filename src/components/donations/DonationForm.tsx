import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { calculateDonationEligibility, DONATION_COOLDOWN_DAYS } from "@/logic/cooldown";
import { AlertTriangle, CheckCircle, Droplet, Loader2 } from "lucide-react";

interface DonationFormProps {
  lastDonationDate?: string | Date | null;
  onConfirmDonation: () => Promise<void> | void;
  isLoading?: boolean;
}

export function DonationForm({ lastDonationDate, onConfirmDonation, isLoading = false }: DonationFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const status = calculateDonationEligibility(lastDonationDate);

  const handleConfirm = async () => {
    if (!status.isEligible) return;
    setSubmitting(true);
    try {
      await onConfirmDonation();
    } finally {
      setSubmitting(false);
    }
  };

  const isPending = isLoading || submitting;

  return (
    <div className="space-y-4">
      {/* Medical Warning Alert when in 90-day Cooldown */}
      {!status.isEligible && (
        <Alert variant="destructive" className="border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-200">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          <AlertTitle className="font-semibold text-amber-800 dark:text-amber-300">
            Medical Cooldown Active ({DONATION_COOLDOWN_DAYS}-Day Safety Rule)
          </AlertTitle>
          <AlertDescription className="mt-1 text-sm text-amber-800/90 dark:text-amber-300/90">
            Safety protocols require a mandatory {DONATION_COOLDOWN_DAYS}-day recovery interval between blood donations.
            <div className="mt-2 font-medium">
              Next eligible donation date: <strong>{status.formattedNextEligibleDate}</strong> ({status.daysRemaining} day{status.daysRemaining !== 1 ? 's' : ''} remaining)
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Action Button wrapped in AlertDialog defensive trigger */}
      {!status.isEligible ? (
        <Button
          type="button"
          disabled
          className="w-full gap-2 font-semibold py-6 text-base opacity-60 cursor-not-allowed bg-muted text-muted-foreground min-h-[44px]"
        >
          <CheckCircle className="h-5 w-5 text-amber-500" aria-hidden="true" />
          Donation Cooldown Active ({status.daysRemaining}d remaining)
        </Button>
      ) : (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              disabled={isPending}
              className="w-full gap-2 font-semibold py-6 text-base bg-accent hover:bg-accent/90 text-accent-foreground min-h-[44px]"
              aria-label="Confirm blood donation"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                  Recording Donation...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Droplet className="h-5 w-5" aria-hidden="true" />
                  Confirm Donation
                </span>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                Confirm Donation & Start Cooldown
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2 text-sm pt-2">
                <p>
                  Recording this blood donation will start your mandatory <strong>{DONATION_COOLDOWN_DAYS}-day medical recovery period</strong>.
                </p>
                <p className="font-medium text-foreground">
                  Your profile will show as unavailable to recipient search queries until your cooldown completes.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirm}
                className="bg-accent hover:bg-accent/90 text-accent-foreground min-h-[44px]"
              >
                Yes, Confirm Donation
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
