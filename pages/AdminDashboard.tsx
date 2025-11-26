import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { DollarSign, Users, Briefcase, TrendingUp, Clock, CheckCircle, Target, Video, Film, Clapperboard, Plus, Upload, MessageSquare as MessageIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { MeetingsCalendar } from "@/components/MeetingsCalendar";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    activeProjects: 0,
    conversionRate: 0,
    pendingBookings: 0,
    approvedBookings: 0,
    pipelineOpportunities: 0,
    pipelineValue: 0,
  });
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    // Load bookings
    const { data: bookings } = await api.getBookings();

    // Load projects
    const { data: projects } = await api.getProjects();

    // Load payments
    const { data: payments } = await api.getPayments();

    // Load opportunities (if endpoint exists)
    const { data: opportunities } = await api.request('/api/opportunities', { method: 'GET' }) || { data: [] };

    if (bookings) {
      // Calculate ACTUAL revenue from paid payments only
      const totalRevenue = payments
        ?.filter((p) => p.status === "succeeded" || p.status === "paid")
        .reduce((sum, p) => sum + parseFloat(String(p.amount)), 0) || 0;

      const pending = bookings.filter((b) => b.status === "pending").length;
      const approved = bookings.filter((b) => b.status === "approved").length;
      const total = bookings.length;

      // Calculate pipeline stats
      const pipelineValue = opportunities?.reduce((sum, opp) => {
        if (opp.stage !== "lost" && opp.budget_max) {
          return sum + parseFloat(String(opp.budget_max));
        }
        return sum;
      }, 0) || 0;

      setStats({
        totalRevenue,
        totalBookings: total,
        activeProjects: projects?.length || 0,
        conversionRate: total > 0 ? (approved / total) * 100 : 0,
        pendingBookings: pending,
        approvedBookings: approved,
        pipelineOpportunities: opportunities?.filter((o) => o.stage !== "lost" && o.stage !== "won").length || 0,
        pipelineValue,
      });

      // Status distribution
      const statusCounts = {
        pending: pending,
        approved: approved,
        countered: bookings.filter((b) => b.status === "countered").length,
        rejected: bookings.filter((b) => b.status === "rejected").length,
      };

      setStatusData([
        { name: "Pending", value: statusCounts.pending },
        { name: "Approved", value: statusCounts.approved },
        { name: "Countered", value: statusCounts.countered },
        { name: "Rejected", value: statusCounts.rejected },
      ]);

      // Revenue by month (last 6 months) - based on ACTUAL payments
      const monthlyRevenue = new Map();
      payments?.forEach((payment) => {
        if (payment.status === "succeeded" || payment.status === "paid") {
          const month = new Date(payment.paid_at || payment.created_at).toLocaleDateString("en-US", { month: "short" });
          const revenue = parseFloat(String(payment.amount));
          monthlyRevenue.set(month, (monthlyRevenue.get(month) || 0) + revenue);
        }
      });

      setRevenueData(
        Array.from(monthlyRevenue.entries()).map(([month, revenue]) => ({
          month,
          revenue,
        }))
      );
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Eric's Studio Dashboard</h1>
          <p className="text-muted-foreground">Your founder storytelling command center.</p>
        </div>
        
        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button onClick={() => navigate("/admin/manual-booking")} className="gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Story Request</span>
          </Button>
          <Button variant="outline" onClick={() => navigate("/admin/deliverables")} className="gap-2">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Upload Episode</span>
          </Button>
          <Button variant="outline" onClick={() => navigate("/admin/messages")} className="gap-2">
            <MessageIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Message Founder</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate("/admin/payments")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Actual payments received</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate("/admin/bookings")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Founder Stories</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingBookings} pending
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate("/admin/projects")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Episodes in Production</CardTitle>
            <Film className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProjects}</div>
            <p className="text-xs text-muted-foreground">Currently filming/editing</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate("/admin/pipeline")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
            <Clapperboard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.pipelineValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pipelineOpportunities} founder leads
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Booking Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => 
                    percent > 0.02 ? `${name} ${(percent * 100).toFixed(1)}%` : ''
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value}`, name]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors" onClick={() => navigate("/admin/bookings")}>
              <Clock className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold">{stats.pendingBookings}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors" onClick={() => navigate("/admin/bookings")}>
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">{stats.approvedBookings}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors" onClick={() => navigate("/admin/projects")}>
              <Briefcase className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">In Production</p>
                <p className="text-2xl font-bold">{stats.activeProjects}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors" onClick={() => navigate("/admin/pipeline")}>
              <Target className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pipeline Opps</p>
                <p className="text-2xl font-bold">{stats.pipelineOpportunities}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meetings Calendar */}
      <MeetingsCalendar userRole="admin" />
    </div>
  );
}
