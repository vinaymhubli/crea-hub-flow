import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Receipt,
  Search,
  Filter,
  Download,
  Eye,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  CreditCard,
  Wallet,
  Users,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  FileText,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Transaction {
  id: string;
  user_id: string;
  transaction_type: "deposit" | "payment" | "refund" | "withdrawal";
  amount: number;
  description: string;
  status: "pending" | "completed" | "failed";
  booking_id?: string;
  created_at: string;
  user?: {
    full_name: string;
    email: string;
    role: string;
  };
  booking?: {
    id: string;
    designer_id: string;
    customer_id: string;
  };
}

interface TransactionStats {
  total_transactions: number;
  total_volume: number;
  pending_transactions: number;
  completed_transactions: number;
  failed_transactions: number;
  deposits: number;
  payments: number;
  refunds: number;
  withdrawals: number;
  today_volume: number;
  this_week_volume: number;
  this_month_volume: number;
}

export default function TransactionManagement() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<
    Transaction[]
  >([]);
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  if (!user) {
    return <Navigate to="/admin-login" replace />;
  }

  useEffect(() => {
    fetchTransactions();
    fetchStats();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm, typeFilter, statusFilter, dateFilter]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("wallet_transactions")
        .select(
          `
          *,
          profiles!wallet_transactions_user_id_fkey (
            first_name,
            last_name,
            full_name,
            email,
            role
          ),
          bookings (
            id,
            designer_id,
            customer_id
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      setTransactions((data as any) || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data: transactions } = await supabase
        .from("wallet_transactions")
        .select("*");

      if (transactions) {
        const now = new Date();
        const today = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

        const stats: TransactionStats = {
          total_transactions: transactions.length,
          total_volume: transactions.reduce(
            (sum, t) => sum + parseFloat(t.amount.toString()),
            0
          ),
          pending_transactions: transactions.filter(
            (t) => t.status === "pending"
          ).length,
          completed_transactions: transactions.filter(
            (t) => t.status === "completed"
          ).length,
          failed_transactions: transactions.filter((t) => t.status === "failed")
            .length,
          deposits: transactions.filter((t) => t.transaction_type === "deposit")
            .length,
          payments: transactions.filter((t) => t.transaction_type === "payment")
            .length,
          refunds: transactions.filter((t) => t.transaction_type === "refund")
            .length,
          withdrawals: transactions.filter(
            (t) => t.transaction_type === "withdrawal"
          ).length,
          today_volume: transactions
            .filter((t) => new Date(t.created_at) >= today)
            .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0),
          this_week_volume: transactions
            .filter((t) => new Date(t.created_at) >= weekAgo)
            .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0),
          this_month_volume: transactions
            .filter((t) => new Date(t.created_at) >= monthAgo)
            .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0),
        };

        setStats(stats);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const filterTransactions = () => {
    let filtered = transactions;

    if (searchTerm) {
      filtered = filtered.filter(
        (transaction) =>
          transaction.description
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          transaction.user?.full_name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          transaction.user?.email
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter(
        (transaction) => transaction.transaction_type === typeFilter
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (transaction) => transaction.status === statusFilter
      );
    }

    if (dateFilter !== "all") {
      const now = new Date();
      let filterDate: Date;

      switch (dateFilter) {
        case "today":
          filterDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
          break;
        case "week":
          filterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          filterDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          filterDate = new Date(0);
      }

      filtered = filtered.filter(
        (transaction) => new Date(transaction.created_at) >= filterDate
      );
    }

    setFilteredTransactions(filtered);
  };

  const handleViewTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDetailDialogOpen(true);
  };

  const handleUpdateTransactionStatus = async (
    transactionId: string,
    newStatus: "pending" | "completed" | "failed"
  ) => {
    try {
      const { error } = await supabase
        .from("wallet_transactions")
        .update({ status: newStatus })
        .eq("id", transactionId);

      if (error) throw error;

      // Update local state
      setTransactions(
        transactions.map((t) =>
          t.id === transactionId ? { ...t, status: newStatus } : t
        )
      );
    } catch (error) {
      console.error("Error updating transaction status:", error);
    }
  };

  const exportTransactions = () => {
    const csvContent = [
      ["ID", "User", "Type", "Amount", "Status", "Description", "Date"],
      ...filteredTransactions.map((transaction) => [
        transaction.id,
        transaction.user?.full_name || transaction.user?.email || "Unknown",
        transaction.transaction_type,
        transaction.amount.toString(),
        transaction.status,
        transaction.description,
        new Date(transaction.created_at).toLocaleString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowDownLeft className="h-4 w-4 text-green-600" />;
      case "payment":
        return <ArrowUpRight className="h-4 w-4 text-blue-600" />;
      case "refund":
        return <RefreshCw className="h-4 w-4 text-orange-600" />;
      case "withdrawal":
        return <ArrowUpRight className="h-4 w-4 text-red-600" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading transactions...</p>
        </div>
      </div>
    );
  }
  console.log({ filteredTransactions });

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transaction Management</h1>
          <p className="text-muted-foreground">
            View and manage all platform transactions
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchTransactions} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportTransactions} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Volume
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
              ₹{stats.total_volume.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.total_transactions} transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.completed_transactions}
              </div>
              <p className="text-xs text-muted-foreground">
                {(
                  (stats.completed_transactions / stats.total_transactions) *
                  100
                ).toFixed(1)}
                % success rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.pending_transactions}
              </div>
              <p className="text-xs text-muted-foreground">
                Awaiting processing
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
              ₹{stats.this_month_volume.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">Monthly volume</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transaction Type Breakdown */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Deposits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.deposits}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.payments}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Refunds</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.refunds}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Withdrawals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.withdrawals}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Transactions</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by description, user name, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="type-filter">Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="deposit">Deposits</SelectItem>
                  <SelectItem value="payment">Payments</SelectItem>
                  <SelectItem value="refund">Refunds</SelectItem>
                  <SelectItem value="withdrawal">Withdrawals</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date-filter">Date Range</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions ({filteredTransactions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getTransactionIcon(transaction.transaction_type)}
                        <div>
                          <div className="font-medium text-sm">
                            {transaction.id.slice(0, 8)}...
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {transaction.description}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-sm">
                          {transaction.profiles?.full_name || "Unknown User"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {transaction.profiles?.email}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {transaction.profiles?.role}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          transaction.transaction_type === "deposit"
                            ? "default"
                            : transaction.transaction_type === "payment"
                            ? "secondary"
                            : transaction.transaction_type === "refund"
                            ? "outline"
                            : "destructive"
                        }
                      >
                        {transaction.transaction_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        ₹{parseFloat(transaction.amount.toString()).toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(transaction.status)}
                        <span className="text-sm">{transaction.status}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleTimeString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewTransaction(transaction)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {transaction.status === "pending" && (
                          <Select
                            value={transaction.status}
                            onValueChange={(
                              value: "pending" | "completed" | "failed"
                            ) =>
                              handleUpdateTransactionStatus(
                                transaction.id,
                                value
                              )
                            }
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="completed">
                                Complete
                              </SelectItem>
                              <SelectItem value="failed">Fail</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Transaction ID</Label>
                  <div className="text-sm font-mono">
                    {selectedTransaction.id}
                  </div>
                </div>
                <div>
                  <Label>Type</Label>
                  <div className="flex items-center space-x-2">
                    {getTransactionIcon(selectedTransaction.transaction_type)}
                    <span className="capitalize">
                      {selectedTransaction.transaction_type}
                    </span>
                  </div>
                </div>
                <div>
                  <Label>Amount</Label>
                  <div className="text-lg font-bold">
                    ₹
                    {parseFloat(selectedTransaction.amount.toString()).toFixed(
                      2
                    )}
                  </div>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(selectedTransaction.status)}
                    <span className="capitalize">
                      {selectedTransaction.status}
                    </span>
                  </div>
                </div>
                <div>
                  <Label>User</Label>
                  <div>
                    <div className="font-medium">
                      {selectedTransaction.profiles?.full_name || "Unknown User"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {selectedTransaction.profiles?.email}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {selectedTransaction.profiles?.role}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>Date</Label>
                  <div className="text-sm">
                    {new Date(selectedTransaction.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <div className="text-sm">{selectedTransaction.description}</div>
              </div>
              {selectedTransaction.booking_id && (
                <div>
                  <Label>Related Booking</Label>
                  <div className="text-sm font-mono">
                    {selectedTransaction.booking_id}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
