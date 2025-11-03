import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, CreditCard, Clock, CheckCircle, AlertCircle, ExternalLink, User, FileText } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

export default function AdminPayments() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [clientAccounts, setClientAccounts] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalPaid: 0,
    totalPending: 0,
    totalOverdue: 0,
    paymentCount: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: paymentsData } = await supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: bookingsData } = await supabase
      .from("custom_booking_requests")
      .select("*")
      .is("deleted_at", null);

    const { data: projectsData } = await supabase
      .from("projects")
      .select("*");

    const { data: clientsData } = await supabase
      .from("client_accounts")
      .select("*, profiles(email, full_name)");

    if (paymentsData && bookingsData && projectsData && clientsData) {
      setPayments(paymentsData);
      setBookings(bookingsData);
      setProjects(projectsData);
      setClientAccounts(clientsData);

      const totalPaid = paymentsData
        .filter((p) => p.status === "paid")
        .reduce((sum, p) => sum + parseFloat(String(p.amount)), 0);

      const totalPending = paymentsData
        .filter((p) => p.status === "pending")
        .reduce((sum, p) => sum + parseFloat(String(p.amount)), 0);

      const totalOverdue = paymentsData
        .filter((p) => p.status === "pending" && p.due_date && new Date(p.due_date) < new Date())
        .reduce((sum, p) => sum + parseFloat(String(p.amount)), 0);

      setStats({
        totalPaid,
        totalPending,
        totalOverdue,
        paymentCount: paymentsData.length,
      });
    }
  };

  const getBookingForPayment = (bookingId: string) => {
    return bookings.find((b) => b.id === bookingId);
  };

  const getProjectForPayment = (bookingId: string) => {
    return projects.find((p) => p.booking_id === bookingId);
  };

  const getClientForPayment = (bookingId: string) => {
    return clientAccounts.find((c) => c.booking_id === bookingId);
  };

  const getStatusBadge = (status: string, dueDate?: string) => {
    const isOverdue = dueDate && new Date(dueDate) < new Date() && status === "pending";

    if (status === "paid") {
      return (
        <Badge className="bg-green-500">
          <CheckCircle className="w-3 h-3 mr-1" />
          Paid
        </Badge>
      );
    }

    if (isOverdue) {
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

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Payments</h1>
        <p className="text-muted-foreground">Track all payment transactions and outstanding balances</p>
      </div>

      {/* Payment Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-500" />
              Total Paid
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
              <Clock className="w-4 h-4 text-yellow-500" />
              Total Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              ${stats.totalPending.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${stats.totalOverdue.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-500" />
              Total Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.paymentCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Payments List */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {payments.map((payment) => {
              const booking = getBookingForPayment(payment.booking_id);
              const project = getProjectForPayment(payment.booking_id);
              const clientAccount = getClientForPayment(payment.booking_id);
              
              return (
                <div
                  key={payment.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{payment.payment_type}</Badge>
                        {getStatusBadge(payment.status, payment.due_date)}
                      </div>
                      
                      {clientAccount && (
                        <div className="text-sm">
                          <span className="font-semibold">{clientAccount.profiles?.full_name || "Client"}</span>
                          <span className="text-muted-foreground"> • {clientAccount.profiles?.email}</span>
                          {clientAccount.company_name && (
                            <span className="text-muted-foreground"> • {clientAccount.company_name}</span>
                          )}
                        </div>
                      )}
                      
                      {project && (
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          Project: {project.project_name}
                        </div>
                      )}
                      
                      <div className="text-xs text-muted-foreground">
                        Created {format(new Date(payment.created_at), "MMM d, yyyy")}
                        {payment.due_date && ` • Due ${format(new Date(payment.due_date), "MMM d, yyyy")}`}
                      </div>
                    </div>

                    <div className="text-right space-y-2">
                      <div className="text-2xl font-bold">${parseFloat(String(payment.amount)).toLocaleString()}</div>
                      <div className="flex gap-2">
                        {payment.stripe_checkout_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(payment.stripe_checkout_url, "_blank")}
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Link
                          </Button>
                        )}
                        {project && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate("/admin/projects")}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Project
                          </Button>
                        )}
                        {clientAccount && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate("/admin/clients")}
                          >
                            <User className="w-4 h-4 mr-2" />
                            Client
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {payments.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p>No payment transactions yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
