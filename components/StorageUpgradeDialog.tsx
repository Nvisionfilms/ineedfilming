import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { HardDrive, Check, Loader2 } from "lucide-react";

interface StorageUpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentLimit: number;
  currentUsage: number;
}

const STORAGE_TIERS = [
  {
    amount: 5,
    price: 3.99,
    description: "Perfect for small projects",
  },
  {
    amount: 10,
    price: 7.99,
    description: "Great for medium projects",
    popular: true,
  },
  {
    amount: 25,
    price: 19.99,
    description: "Best for large projects",
  },
];

export const StorageUpgradeDialog = ({
  open,
  onOpenChange,
  currentLimit,
  currentUsage,
}: StorageUpgradeDialogProps) => {
  const [purchasing, setPurchasing] = useState(false);

  const handlePurchase = async (amount: number) => {
    try {
      setPurchasing(true);
      
      // TODO: Implement storage upgrade via Railway API
      const data = null;
      const error = new Error('Storage upgrade not implemented yet');

      if (error) throw error;

      if (data?.url) {
        // Open Stripe checkout in new tab
        window.open(data.url, "_blank");
        toast.success("Opening checkout page...");
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error("Error purchasing storage:", error);
      toast.error(error.message || "Failed to initiate purchase");
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            Upgrade Storage
          </DialogTitle>
          <DialogDescription>
            Current storage: {currentUsage.toFixed(2)}GB / {currentLimit}GB
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {STORAGE_TIERS.map((tier) => {
            const newLimit = currentLimit + tier.amount;
            const isPopular = tier.popular;

            return (
              <Card
                key={tier.amount}
                className={`relative ${
                  isPopular
                    ? "border-primary shadow-md"
                    : "border-border"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <CardHeader className="text-center pb-3">
                  <CardTitle className="text-2xl">+{tier.amount}GB</CardTitle>
                  <CardDescription>{tier.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold">${tier.price}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      One-time payment
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>Adds {tier.amount}GB to your account</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>New limit: {newLimit}GB</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>Instant activation</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>Never expires</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => handlePurchase(tier.amount)}
                    disabled={purchasing}
                    className="w-full"
                    variant={isPopular ? "default" : "outline"}
                  >
                    {purchasing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Purchase ${tier.amount}GB`
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-4 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Note:</strong> Storage upgrades are permanent additions to your account. You can purchase multiple upgrades at any time.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
