import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Receipt, Download, Eye, Search, Filter, RefreshCw } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { DesignerSidebar } from '@/components/DesignerSidebar'

interface DesignerInvoice {
  id: string
  invoice_number: string
  invoice_type: string
  subtotal: number
  tax_amount: number
  total_amount: number
  status: string
  created_at: string
  customer_name: string
  customer_email: string
}

export default function DesignerInvoices() {
  const [invoices, setInvoices] = useState<DesignerInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const { toast } = useToast()

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch designer invoices (withdrawal + session earnings invoices)
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .eq('designer_id', user.id)
        .in('invoice_type', ['withdrawal', 'session_earnings', 'designer'])
        .order('created_at', { ascending: false })

      if (invoicesError) throw invoicesError

      // Format invoices with proper names based on type
      const formattedInvoices = invoicesData?.map(invoice => {
        if (invoice.invoice_type === 'withdrawal') {
          return {
            ...invoice,
            customer_name: 'Designer Withdrawal',
            customer_email: 'system@creahub.com'
          }
        } else if (invoice.invoice_type === 'designer') {
          return {
            ...invoice,
            customer_name: 'Session Earnings',
            customer_email: 'system@creahub.com'
          }
        } else {
          return {
            ...invoice,
            customer_name: 'Session Earnings',
            customer_email: 'system@creahub.com'
          }
        }
      }) || []

      setInvoices(formattedInvoices)

    } catch (error) {
      console.error('Error fetching invoices:', error)
      toast({
        title: "Error",
        description: "Failed to fetch invoices",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getInvoiceTypeLabel = (type: string) => {
    switch (type) {
      case 'withdrawal': return 'Designer Withdrawal'
      case 'session_earnings': return 'Session Earnings'
      case 'designer': return 'Session Earnings'
      default: return type
    }
  }

  const getInvoiceTypeBadge = (type: string) => {
    const colors = {
      'withdrawal': 'bg-orange-100 text-orange-800',
      'session_earnings': 'bg-green-100 text-green-800',
      'designer': 'bg-green-100 text-green-800'
    }
    
    return (
      <Badge className={colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {getInvoiceTypeLabel(type)}
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'generated': return <Badge className="bg-blue-100 text-blue-800">Generated</Badge>
      case 'sent': return <Badge className="bg-yellow-100 text-yellow-800">Sent</Badge>
      case 'paid': return <Badge className="bg-green-100 text-green-800">Paid</Badge>
      case 'cancelled': return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>
      default: return <Badge variant="outline">{status}</Badge>
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

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = searchTerm === '' || 
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = filterType === 'all' || invoice.invoice_type === filterType
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus
    
    return matchesSearch && matchesType && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <DesignerSidebar />
        <div className="flex-1 p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading invoices...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <DesignerSidebar />
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Invoices</h1>
            <p className="text-gray-600">View and download your invoices</p>
          </div>
          <Button onClick={fetchInvoices} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[300px]">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search invoices..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="withdrawal">Designer Withdrawal</SelectItem>
                  <SelectItem value="session_earnings">Session Earnings</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="generated">Generated</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Invoices Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              My Invoices ({filteredInvoices.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredInvoices.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No invoices found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-mono text-sm">
                          {invoice.invoice_number}
                        </TableCell>
                        <TableCell>
                          {getInvoiceTypeBadge(invoice.invoice_type)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{invoice.customer_name}</div>
                            <div className="text-sm text-gray-500">{invoice.customer_email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(invoice.total_amount)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(invoice.status)}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {formatDate(invoice.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
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
    </div>
  )
}