import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { DollarSign, Copy, ExternalLink, Loader2 } from "lucide-react";

interface PaymentLinkDialogProps {
  booking: any;
  onSuccess?: () => void;
}

export const PaymentLinkDialog = ({ booking, onSuccess }: PaymentLinkDialogProps) => {
  const { toast } = useToast();
  const [amount, setAmount] = useState(booking.deposit_amount?.toString() || "");
  const [description, setDescription] = useState(`Deposit for ${booking.client_name}`);
  const [isGenerating, setIsGenerating] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const generatePaymentLink = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid payment amount",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-payment-link", {
        body: {
          bookingId: booking.id,
          amount: parseFloat(amount),
          description,
        },
      });

      if (error) throw error;

      setPaymentUrl(data.url);
      toast({
        title: "Payment link generated & emailed!",
        description: `Sent to ${booking.client_email} - You can also copy the link below`,
      });

      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast({
        title: "Error generating payment link",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(paymentUrl);
      toast({
        title: "Copied!",
        description: "Payment link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually",
        variant: "destructive",
      });
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset form when closing
      setPaymentUrl("");
      setAmount(booking.deposit_amount?.toString() || "");
      setDescription(`Deposit for ${booking.client_name}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <DollarSign className="w-4 h-4 mr-2" />
          Generate Payment Link
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Payment Link</DialogTitle>
        </DialogHeader>

        {!paymentUrl ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Payment Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Default: ${parseFloat(booking.deposit_amount || 0).toLocaleString()} (Deposit)
              </p>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this payment for?"
                rows={3}
              />
            </div>

            <Button
              onClick={generatePaymentLink}
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Generate Stripe Link
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">
                ✅ Payment Link Generated & Emailed!
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 mb-1">
                Amount: ${parseFloat(amount).toLocaleString()}
              </p>
              <p className="text-xs text-green-700 dark:text-green-300">
                📧 Sent to: {booking.client_email}
              </p>
            </div>

            <div>
              <Label>Payment Link</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={paymentUrl}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => window.open(paymentUrl, "_blank")}
                className="flex-1"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Link
              </Button>
              <Button
                onClick={copyToClipboard}
                className="flex-1"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Link
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Email sent to {booking.client_email}. You can also copy/share the link manually if needed.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
