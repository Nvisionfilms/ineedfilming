import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { DollarSign, AlertCircle, CheckCircle, Clock, ExternalLink, Mail, Phone, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { PaymentLinkDialog } from "@/components/PaymentLinkDialog";
import { useToast } from "@/hooks/use-toast";

interface PaymentSummary {
  booking_id: string;
  client_name: string;
  client_email: string;
  booking_status: string;
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

export default function AdminPaymentBalances() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [paymentSummaries, setPaymentSummaries] = useState<PaymentSummary[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "outstanding" | "overdue">("outstanding");

  useEffect(() => {
    loadPaymentSummaries();
  }, []);

  const loadPaymentSummaries = async () => {
    setLoading(true);
    try {
      // Load payment summary view
      const { data: summaryData, error: summaryError } = await supabase
        .from("payment_summary")
        .select("*")
        .order("final_payment_due", { ascending: true, nullsFirst: false });

      if (summaryError) throw summaryError;

      // Load full booking details for payment link generation
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("custom_booking_requests")
        .select("*")
        .in("status", ["approved", "countered"]);

      if (bookingsError) throw bookingsError;

      setPaymentSummaries(summaryData || []);
      setBookings(bookingsData || []);
    } catch (error: any) {
      toast({
        title: "Error loading payment data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getBookingForSummary = (bookingId: string) => {
    return bookings.find((b) => b.id === bookingId);
  };

  const getStatusBadge = (summary: PaymentSummary) => {
    if (summary.full_payment_received) {
      return (
        <Badge className="bg-green-500">
          <CheckCircle className="w-3 h-3 mr-1" />
          Fully Paid
        </Badge>
      );
    }

    if (summary.final_payment_due && new Date(summary.final_payment_due) < new Date()) {
      return (
        <Badge variant="destructive">
          <AlertCircle className="w-3 h-3 mr-1" />
          Overdue
        </Badge>
      );
    }

    if (summary.deposit_paid) {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          <Clock className="w-3 h-3 mr-1" />
          Deposit Paid
        </Badge>
      );
    }

    return (
      <Badge variant="outline">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </Badge>
    );
  };

  const filteredSummaries = paymentSummaries.filter((summary) => {
    if (filter === "outstanding") {
      return summary.outstanding_balance > 0 && !summary.full_payment_received;
    }
    if (filter === "overdue") {
      return (
        summary.outstanding_balance > 0 &&
        summary.final_payment_due &&
        new Date(summary.final_payment_due) < new Date()
      );
    }
    return true; // "all"
  });

  const stats = {
    totalOutstanding: paymentSummaries.reduce((sum, s) => sum + (s.outstanding_balance || 0), 0),
    totalPaid: paymentSummaries.reduce((sum, s) => sum + (s.total_paid || 0), 0),
    overdueCount: paymentSummaries.filter(
      (s) => s.final_payment_due && new Date(s.final_payment_due) < new Date() && s.outstanding_balance > 0
    ).length,
    depositPaidCount: paymentSummaries.filter((s) => s.deposit_paid && !s.full_payment_received).length,
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">Loading payment balances...</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Payment Balances</h1>
        <p className="text-muted-foreground">Track outstanding balances and payment status for all clients</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-orange-500" />
              Outstanding Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ${stats.totalOutstanding.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Total Collected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${stats.totalPaid.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              Overdue Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdueCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              Awaiting Final Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.depositPaidCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          All Clients
        </Button>
        <Button
          variant={filter === "outstanding" ? "default" : "outline"}
          onClick={() => setFilter("outstanding")}
        >
          Outstanding Balance
        </Button>
        <Button
          variant={filter === "overdue" ? "default" : "outline"}
          onClick={() => setFilter("overdue")}
        >
          Overdue
        </Button>
      </div>

      {/* Payment Balances List */}
      <div className="space-y-4">
        {filteredSummaries.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground text-lg">
              {filter === "outstanding"
                ? "No outstanding balances"
                : filter === "overdue"
                ? "No overdue payments"
                : "No payment records found"}
            </p>
          </Card>
        ) : (
          filteredSummaries.map((summary) => {
            const booking = getBookingForSummary(summary.booking_id);
            const isOverdue =
              summary.final_payment_due && new Date(summary.final_payment_due) < new Date() && summary.outstanding_balance > 0;

            return (
              <Card
                key={summary.booking_id}
                className={`p-6 ${isOverdue ? "border-red-500 border-2" : ""}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-bold">{summary.client_name}</h3>
                      {getStatusBadge(summary)}
                    </div>

                    <div className="grid md:grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        {summary.client_email}
                      </div>
                      {summary.shoot_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          Shoot Date: {format(new Date(summary.shoot_date), "MMM d, yyyy")}
                        </div>
                      )}
                    </div>

                    {/* Payment Breakdown */}
                    <div className="grid md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Total Price</p>
                        <p className="text-lg font-semibold">${summary.total_price.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Paid</p>
                        <p className="text-lg font-semibold text-green-600">
                          ${summary.total_paid.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Outstanding</p>
                        <p className={`text-lg font-semibold ${isOverdue ? "text-red-600" : "text-orange-600"}`}>
                          ${summary.outstanding_balance.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Payment Dates */}
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      {summary.deposit_paid_date && (
                        <div>
                          ✓ Deposit paid: {format(new Date(summary.deposit_paid_date), "MMM d, yyyy")}
                        </div>
                      )}
                      {summary.final_payment_due && !summary.full_payment_received && (
                        <div className={isOverdue ? "text-red-600 font-semibold" : ""}>
                          {isOverdue ? "⚠️ " : ""}Final payment due:{" "}
                          {format(new Date(summary.final_payment_due), "MMM d, yyyy")}
                        </div>
                      )}
                      {summary.final_paid_date && (
                        <div className="text-green-600">
                          ✓ Final paid: {format(new Date(summary.final_paid_date), "MMM d, yyyy")}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {summary.outstanding_balance > 0 && booking && (
                      <div className="flex gap-2 pt-2">
                        <PaymentLinkDialog booking={booking} onSuccess={loadPaymentSummaries} />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate("/admin/bookings")}
                        >
                          View Booking
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
