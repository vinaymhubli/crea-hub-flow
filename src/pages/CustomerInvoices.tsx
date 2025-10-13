import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Receipt, Download, Eye, Search, Filter, RefreshCw, Calendar, User } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { CustomerSidebar } from '@/components/CustomerSidebar'
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

interface CustomerInvoice {
  id: string
  invoice_number: string
  invoice_type: string
  subtotal: number
  tax_amount: number
  total_amount: number
  status: string
  created_at: string
  designer_name: string
  designer_email: string
}

export default function CustomerInvoices() {
  const [invoices, setInvoices] = useState<CustomerInvoice[]>([])
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

      // Fetch customer invoices (recharge + session payment invoices)
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .eq('customer_id', user.id)
        .in('invoice_type', ['recharge', 'session_payment', 'customer'])
        .order('created_at', { ascending: false })

      if (invoicesError) throw invoicesError

      // Format invoices with proper names based on type
      const formattedInvoices = invoicesData?.map(invoice => {
        if (invoice.invoice_type === 'recharge') {
          return {
            ...invoice,
            designer_name: 'Wallet Recharge',
            designer_email: 'system@creahub.com'
          }
        } else if (invoice.invoice_type === 'customer') {
          return {
            ...invoice,
            designer_name: 'Session Payment',
            designer_email: 'system@creahub.com'
          }
        } else {
          return {
            ...invoice,
            designer_name: 'Session Payment',
            designer_email: 'system@creahub.com'
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
      case 'recharge': return 'Wallet Recharge'
      case 'session_payment': return 'Session Payment'
      default: return type
    }
  }

  const getInvoiceTypeBadge = (type: string) => {
    const colors = {
      'recharge': 'bg-purple-100 text-purple-800',
      'session_payment': 'bg-blue-100 text-blue-800'
    }
    
    return (
      <Badge className={`${colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'} text-xs`}>
        {getInvoiceTypeLabel(type)}
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'generated': return <Badge className="bg-blue-100 text-blue-800 text-xs">Generated</Badge>
      case 'sent': return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Sent</Badge>
      case 'paid': return <Badge className="bg-green-100 text-green-800 text-xs">Paid</Badge>
      case 'cancelled': return <Badge className="bg-red-100 text-red-800 text-xs">Cancelled</Badge>
      default: return <Badge variant="outline" className="text-xs">{status}</Badge>
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
      invoice.designer_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = filterType === 'all' || invoice.invoice_type === filterType
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus
    
    return matchesSearch && matchesType && matchesStatus
  })

  if (loading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen bg-gray-50 overflow-hidden">
          <CustomerSidebar />
          <div className="flex-1 p-4 sm:p-6 overflow-x-hidden">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600 text-sm">Loading invoices...</p>
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-gray-50 overflow-hidden">
        <CustomerSidebar />
        <div className="flex-1 overflow-x-hidden">
          {/* Header */}
          <header className="bg-white shadow-sm border-b">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 overflow-hidden">
                <SidebarTrigger className="flex-shrink-0" />
                <div className="min-w-0 flex-1 overflow-hidden">
                  <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate">My Invoices</h1>
                  <p className="text-gray-600 text-xs sm:text-sm hidden sm:block truncate">View and download your invoices</p>
                </div>
              </div>
              <Button onClick={fetchInvoices} variant="outline" size="sm" className="flex-shrink-0">
                <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </header>

          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-x-hidden">

            {/* Search and Filters */}
            <Card className="overflow-hidden">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col gap-3">
                  <div className="w-full">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search invoices..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 text-sm w-full"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-full text-xs">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="recharge">Recharge</SelectItem>
                        <SelectItem value="session_payment">Payment</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-full text-xs">
                        <SelectValue placeholder="Status" />
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
                </div>
              </CardContent>
            </Card>

            {/* Invoices */}
            <div className="overflow-hidden">
              <div className="flex items-center gap-2 mb-4">
                <Receipt className="w-5 h-5 text-gray-700 flex-shrink-0" />
                <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 truncate">
                  My Invoices ({filteredInvoices.length})
                </h2>
              </div>

              {filteredInvoices.length === 0 ? (
                <Card>
                  <CardContent className="p-8 sm:p-12 text-center">
                    <Receipt className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-sm sm:text-base">No invoices found</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Mobile Card View */}
                  <div className="grid gap-3 lg:hidden">
                    {filteredInvoices.map((invoice) => (
                      <Card key={invoice.id} className="hover:shadow-md transition-shadow overflow-hidden">
                        <CardContent className="p-3">
                          <div className="space-y-2.5">
                            {/* Invoice Number */}
                            <div>
                              <p className="font-mono text-xs text-gray-500 mb-1">Invoice Number</p>
                              <p className="font-medium text-sm text-gray-900 break-all">
                                {invoice.invoice_number}
                              </p>
                            </div>

                            {/* Amount */}
                            <div>
                              <p className="font-mono text-xs text-gray-500 mb-1">Amount</p>
                              <p className="font-bold text-lg text-gray-900">
                                ₹{invoice.total_amount.toFixed(2)}
                              </p>
                            </div>

                            {/* Type & Status */}
                            <div>
                              <p className="font-mono text-xs text-gray-500 mb-1">Type & Status</p>
                              <div className="flex items-center gap-2 flex-wrap">
                                {getInvoiceTypeBadge(invoice.invoice_type)}
                                {getStatusBadge(invoice.status)}
                              </div>
                            </div>

                            {/* Provider Info */}
                            <div>
                              <p className="font-mono text-xs text-gray-500 mb-1">Service Provider</p>
                              <div className="bg-gray-50 rounded-lg p-2">
                                <p className="font-medium text-xs text-gray-900 truncate">{invoice.designer_name}</p>
                                <p className="text-xs text-gray-500 truncate">{invoice.designer_email}</p>
                              </div>
                            </div>

                            {/* Date */}
                            <div>
                              <p className="font-mono text-xs text-gray-500 mb-1">Date</p>
                              <div className="flex items-center text-xs text-gray-900">
                                <Calendar className="w-3 h-3 mr-1.5 flex-shrink-0" />
                                <span>{new Date(invoice.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>

                            {/* Actions - Bottom */}
                            <div className="pt-2 border-t">
                              <div className="grid grid-cols-2 gap-2">
                                <Button variant="outline" size="sm" className="w-full text-xs">
                                  <Eye className="w-3.5 h-3.5 mr-1.5" />
                                  View
                                </Button>
                                <Button variant="outline" size="sm" className="w-full text-xs">
                                  <Download className="w-3.5 h-3.5 mr-1.5" />
                                  Download
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <Card className="hidden lg:block">
                    <CardContent className="p-6">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Invoice #</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Service Provider</TableHead>
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
                                    <div className="font-medium">{invoice.designer_name}</div>
                                    <div className="text-sm text-gray-500">{invoice.designer_email}</div>
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
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  )
}