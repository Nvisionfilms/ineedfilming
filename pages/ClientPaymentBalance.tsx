import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { DollarSign, CheckCircle, Clock, Calendar, AlertCircle, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface ClientPaymentInfo {
  booking_id: string;
  client_name: string;
  client_email: string;
  total_price: number;
  total_paid: number;
  outstanding_balance: number;
  deposit_paid: boolean;
  full_payment_received: boolean;
  shoot_date: string | null;
  final_payment_due_date: string | null;
  project_payment_status: string;
  deposit_paid_date: string | null;
  final_paid_date: string | null;
  final_payment_due: string | null;
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  payment_type: string;
  description: string;
  paid_at: string | null;
  due_date: string | null;
  stripe_checkout_url: string | null;
  created_at: string;
}

export default function ClientPaymentBalance() {
  const { toast } = useToast();
  const [paymentInfo, setPaymentInfo] = useState<ClientPaymentInfo | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPaymentInfo();
  }, []);

  const loadPaymentInfo = async () => {
    setLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get client account
      const { data: clientAccount, error: accountError } = await supabase
        .from("client_accounts")
        .select("*, custom_booking_requests!booking_id(*)")
        .eq("user_id", user.id)
        .single();

      if (accountError) throw accountError;

      if (!clientAccount?.booking_id) {
        setLoading(false);
        return;
      }

      // Get payment summary for this booking
      const { data: summaryData, error: summaryError } = await supabase
        .from("payment_summary")
        .select("*")
        .eq("booking_id", clientAccount.booking_id)
        .single();

      if (summaryError && summaryError.code !== "PGRST116") throw summaryError;

      // Get all payments for this booking
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select("*")
        .eq("booking_id", clientAccount.booking_id)
        .order("created_at", { ascending: false });

      if (paymentsError) throw paymentsError;

      setPaymentInfo(summaryData);
      setPayments(paymentsData || []);
    } catch (error: any) {
      console.error("Error loading payment info:", error);
      toast({
        title: "Error loading payment information",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatusBadge = (payment: Payment) => {
    if (payment.status === "succeeded" || payment.status === "paid") {
      return (
        <Badge className="bg-green-500">
          <CheckCircle className="w-3 h-3 mr-1" />
          Paid
        </Badge>
      );
    }

    const isOverdue = payment.due_date && new Date(payment.due_date) < new Date();
    if (isOverdue && payment.status === "pending") {
      return (
        <Badge variant="destructive">
          <AlertCircle className="w-3 h-3 mr-1" />
          Overdue
        </Badge>
      );
    }

    return (
      <Badge variant="secondary">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">Loading payment information...</div>
      </div>
    );
  }

  if (!paymentInfo) {
    return (
      <div className="p-8">
        <Card className="p-12 text-center">
          <p className="text-muted-foreground text-lg">No payment information available</p>
          <p className="text-sm text-muted-foreground mt-2">
            Payment details will appear here once your booking is approved
          </p>
        </Card>
      </div>
    );
  }

  const isOverdue =
    paymentInfo.final_payment_due &&
    new Date(paymentInfo.final_payment_due) < new Date() &&
    paymentInfo.outstanding_balance > 0;

  const pendingPayment = payments.find(
    (p) => p.status === "pending" && p.payment_type === "final"
  );

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Payment Balance</h1>
        <p className="text-muted-foreground">View your payment status and outstanding balance</p>
      </div>

      {/* Payment Status Overview */}
      <Card className={`${isOverdue ? "border-red-500 border-2" : ""}`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Payment Overview</span>
            {paymentInfo.full_payment_received ? (
              <Badge className="bg-green-500">
                <CheckCircle className="w-4 h-4 mr-1" />
                Fully Paid
              </Badge>
            ) : paymentInfo.deposit_paid ? (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                <Clock className="w-4 h-4 mr-1" />
                Deposit Paid
              </Badge>
            ) : (
              <Badge variant="outline">
                <Clock className="w-4 h-4 mr-1" />
                Pending
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Payment Breakdown */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Total Project Value</p>
              </div>
              <p className="text-2xl font-bold">${paymentInfo.total_price.toLocaleString()}</p>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <p className="text-sm text-muted-foreground">Amount Paid</p>
              </div>
              <p className="text-2xl font-bold text-green-600">
                ${paymentInfo.total_paid.toLocaleString()}
              </p>
            </div>

            <div className={`p-4 rounded-lg ${
              isOverdue 
                ? "bg-red-50 dark:bg-red-950" 
                : paymentInfo.outstanding_balance > 0 
                ? "bg-orange-50 dark:bg-orange-950" 
                : "bg-green-50 dark:bg-green-950"
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {isOverdue ? (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                ) : (
                  <DollarSign className="w-4 h-4 text-orange-600" />
                )}
                <p className="text-sm text-muted-foreground">Outstanding Balance</p>
              </div>
              <p className={`text-2xl font-bold ${
                isOverdue 
                  ? "text-red-600" 
                  : paymentInfo.outstanding_balance > 0 
                  ? "text-orange-600" 
                  : "text-green-600"
              }`}>
                ${paymentInfo.outstanding_balance.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Important Dates */}
          {(paymentInfo.shoot_date || paymentInfo.final_payment_due) && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg space-y-2">
              <p className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Important Dates
              </p>
              {paymentInfo.shoot_date && (
                <p className="text-sm">
                  📹 Shoot Date: <strong>{format(new Date(paymentInfo.shoot_date), "MMMM d, yyyy")}</strong>
                </p>
              )}
              {paymentInfo.final_payment_due && !paymentInfo.full_payment_received && (
                <p className={`text-sm ${isOverdue ? "text-red-600 font-semibold" : ""}`}>
                  {isOverdue ? "⚠️ " : "💳 "}
                  Final Payment Due: <strong>{format(new Date(paymentInfo.final_payment_due), "MMMM d, yyyy")}</strong>
                  {isOverdue && " - OVERDUE"}
                </p>
              )}
            </div>
          )}

          {/* Payment Terms Notice */}
          {paymentInfo.outstanding_balance > 0 && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <p className="text-sm font-semibold mb-2">⚠️ Payment Terms</p>
              <p className="text-sm text-muted-foreground">
                Final payment is required before editing begins. Please complete your payment by the due date to ensure timely delivery of your project.
              </p>
            </div>
          )}

          {/* Make Payment Button */}
          {pendingPayment && pendingPayment.stripe_checkout_url && (
            <div className="flex justify-center pt-4">
              <Button
                size="lg"
                className="w-full md:w-auto"
                onClick={() => window.open(pendingPayment.stripe_checkout_url!, "_blank")}
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Pay Outstanding Balance (${paymentInfo.outstanding_balance.toLocaleString()})
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {payments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No payment records yet</p>
            ) : (
              payments.map((payment) => (
                <div
                  key={payment.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="capitalize">
                          {payment.payment_type}
                        </Badge>
                        {getPaymentStatusBadge(payment)}
                      </div>
                      {payment.description && (
                        <p className="text-sm text-muted-foreground mb-1">{payment.description}</p>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {payment.paid_at
                          ? `Paid on ${format(new Date(payment.paid_at), "MMM d, yyyy")}`
                          : payment.due_date
                          ? `Due ${format(new Date(payment.due_date), "MMM d, yyyy")}`
                          : `Created ${format(new Date(payment.created_at), "MMM d, yyyy")}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">${parseFloat(String(payment.amount)).toLocaleString()}</p>
                      {payment.stripe_checkout_url && payment.status === "pending" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => window.open(payment.stripe_checkout_url!, "_blank")}
                        >
                          Pay Now
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
