import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowUpCircle, Search, Filter, Download, RefreshCw } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface WalletRecharge {
  id: string
  user_id: string
  amount: number
  transaction_type: string
  status: string
  description: string
  metadata: any
  created_at: string
  user_name?: string
  user_email?: string
  payment_method?: string
  tax_applied?: boolean
  tax_amount?: number
}

export default function AdminWalletRecharges() {
  const [recharges, setRecharges] = useState<WalletRecharge[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    fetchWalletRecharges()
  }, [])

  const fetchWalletRecharges = async () => {
    try {
      setLoading(true)
      
      // Fetch wallet recharge transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('wallet_transactions')
        .select(`
          *,
          user:profiles!wallet_transactions_user_id_fkey(
            full_name,
            first_name,
            last_name,
            email
          )
        `)
        .eq('transaction_type', 'deposit')
        .order('created_at', { ascending: false })

      if (transactionsError) throw transactionsError

      // Format the data
      const formattedRecharges = transactionsData?.map(transaction => ({
        ...transaction,
        user_name: transaction.user?.full_name || 
                  `${transaction.user?.first_name || ''} ${transaction.user?.last_name || ''}`.trim() ||
                  transaction.user?.email || 'Unknown User',
        user_email: transaction.user?.email || 'Unknown Email',
        payment_method: transaction.metadata?.payment_method || 'Unknown',
        tax_applied: transaction.metadata?.tax_calculation?.total_tax > 0,
        tax_amount: transaction.metadata?.tax_calculation?.total_tax || 0
      })) || []

      setRecharges(formattedRecharges)

    } catch (error) {
      console.error('Error fetching wallet recharges:', error)
      toast({
        title: "Error",
        description: "Failed to fetch wallet recharges",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredRecharges = recharges.filter(recharge => {
    const matchesStatus = filterStatus === 'all' || recharge.status === filterStatus
    const matchesSearch = searchTerm === '' || 
      recharge.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recharge.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recharge.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesStatus && matchesSearch
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>
      case 'pending':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTotalRecharges = () => {
    return recharges.reduce((sum, recharge) => sum + recharge.amount, 0)
  }

  const getTotalTaxCollected = () => {
    return recharges.reduce((sum, recharge) => sum + (recharge.tax_amount || 0), 0)
  }

  const getCompletedCount = () => {
    return recharges.filter(recharge => recharge.status === 'completed').length
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading wallet recharges...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Wallet Recharges</h1>
          <p className="text-gray-600">Monitor all wallet recharge transactions and tax collections</p>
        </div>
        <Button onClick={fetchWalletRecharges} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recharges</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(getTotalRecharges())}</div>
            <p className="text-xs text-muted-foreground">
              {recharges.length} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Badge className="bg-green-100 text-green-800">✓</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getCompletedCount()}</div>
            <p className="text-xs text-muted-foreground">
              Successful recharges
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tax Collected</CardTitle>
            <Badge className="bg-blue-100 text-blue-800">₹</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(getTotalTaxCollected())}</div>
            <p className="text-xs text-muted-foreground">
              CGST + SGST + IGST
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Badge className="bg-purple-100 text-purple-800">%</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recharges.length > 0 ? Math.round((getCompletedCount() / recharges.length) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Completion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users, emails, descriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recharges Table */}
      <Card>
        <CardHeader>
          <CardTitle>Wallet Recharges ({filteredRecharges.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRecharges.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No wallet recharges found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tax Applied</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecharges.map((recharge) => (
                    <TableRow key={recharge.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{recharge.user_name}</div>
                          <div className="text-sm text-gray-500">{recharge.user_email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(recharge.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{recharge.payment_method}</Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(recharge.status)}
                      </TableCell>
                      <TableCell>
                        {recharge.tax_applied ? (
                          <div className="text-sm">
                            <div className="font-medium text-green-600">
                              {formatCurrency(recharge.tax_amount || 0)}
                            </div>
                            <div className="text-xs text-gray-500">Tax Collected</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">No Tax</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                        {recharge.description}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(recharge.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
