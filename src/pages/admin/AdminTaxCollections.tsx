import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Receipt, TrendingUp, DollarSign, MapPin, Calendar, Filter } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface TaxCollection {
  id: string
  transaction_id: string
  user_id: string
  transaction_type: 'recharge' | 'withdrawal'
  original_amount: number
  cgst_rate: number
  cgst_amount: number
  sgst_rate: number
  sgst_amount: number
  igst_rate: number
  igst_amount: number
  total_tax_amount: number
  user_state: string
  user_state_code: string
  created_at: string
}

interface TaxSummary {
  total_collections: number
  total_cgst: number
  total_sgst: number
  total_igst: number
  recharge_count: number
  withdrawal_count: number
  state_breakdown: { [key: string]: number }
}

export default function AdminTaxCollections() {
  const [taxCollections, setTaxCollections] = useState<TaxCollection[]>([])
  const [summary, setSummary] = useState<TaxSummary>({
    total_collections: 0,
    total_cgst: 0,
    total_sgst: 0,
    total_igst: 0,
    recharge_count: 0,
    withdrawal_count: 0,
    state_breakdown: {}
  })
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>('all')
  const [filterState, setFilterState] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    fetchTaxCollections()
  }, [])

  const fetchTaxCollections = async () => {
    try {
      setLoading(true)
      
      // Fetch tax collections
      const { data: collectionsData, error: collectionsError } = await supabase
        .from('tax_collections')
        .select('*')
        .order('created_at', { ascending: false })

      if (collectionsError) throw collectionsError

      setTaxCollections(collectionsData || [])

      // Calculate summary
      const summaryData: TaxSummary = {
        total_collections: 0,
        total_cgst: 0,
        total_sgst: 0,
        total_igst: 0,
        recharge_count: 0,
        withdrawal_count: 0,
        state_breakdown: {}
      }

      collectionsData?.forEach(collection => {
        summaryData.total_collections += collection.total_tax_amount
        summaryData.total_cgst += collection.cgst_amount
        summaryData.total_sgst += collection.sgst_amount
        summaryData.total_igst += collection.igst_amount
        
        if (collection.transaction_type === 'recharge') {
          summaryData.recharge_count++
        } else {
          summaryData.withdrawal_count++
        }

        if (!summaryData.state_breakdown[collection.user_state_code]) {
          summaryData.state_breakdown[collection.user_state_code] = 0
        }
        summaryData.state_breakdown[collection.user_state_code] += collection.total_tax_amount
      })

      setSummary(summaryData)

    } catch (error) {
      console.error('Error fetching tax collections:', error)
      toast({
        title: "Error",
        description: "Failed to fetch tax collections",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredCollections = taxCollections.filter(collection => {
    const matchesType = filterType === 'all' || collection.transaction_type === filterType
    const matchesState = filterState === 'all' || collection.user_state_code === filterState
    const matchesSearch = searchTerm === '' || 
      collection.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      collection.user_state.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesType && matchesState && matchesSearch
  })

  const getTransactionTypeBadge = (type: string) => {
    return type === 'recharge' ? (
      <Badge variant="default" className="bg-green-100 text-green-800">Recharge</Badge>
    ) : (
      <Badge variant="default" className="bg-blue-100 text-blue-800">Withdrawal</Badge>
    )
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

  const getUniqueStates = () => {
    const states = [...new Set(taxCollections.map(c => c.user_state_code))]
    return states.sort()
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading tax collections...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tax Collections</h1>
          <p className="text-gray-600">Track CGST, SGST, and IGST collections from wallet transactions</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tax Collections</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.total_collections)}</div>
            <p className="text-xs text-muted-foreground">
              From {summary.recharge_count + summary.withdrawal_count} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CGST Collected</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.total_cgst)}</div>
            <p className="text-xs text-muted-foreground">Central GST</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SGST Collected</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.total_sgst)}</div>
            <p className="text-xs text-muted-foreground">State GST</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">IGST Collected</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.total_igst)}</div>
            <p className="text-xs text-muted-foreground">Interstate GST</p>
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
              <label className="text-sm font-medium mb-2 block">Transaction Type</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="recharge">Recharge</SelectItem>
                  <SelectItem value="withdrawal">Withdrawal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">State</label>
              <Select value={filterState} onValueChange={setFilterState}>
                <SelectTrigger>
                  <SelectValue placeholder="All States" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {getUniqueStates().map(state => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Search</label>
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tax Collections Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tax Collections ({filteredCollections.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCollections.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No tax collections found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Original Amount</TableHead>
                    <TableHead>CGST</TableHead>
                    <TableHead>SGST</TableHead>
                    <TableHead>IGST</TableHead>
                    <TableHead>Total Tax</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCollections.map((collection) => (
                    <TableRow key={collection.id}>
                      <TableCell className="font-mono text-sm">
                        {collection.transaction_id}
                      </TableCell>
                      <TableCell>
                        {getTransactionTypeBadge(collection.transaction_type)}
                      </TableCell>
                      <TableCell>{formatCurrency(collection.original_amount)}</TableCell>
                      <TableCell>
                        {collection.cgst_rate}% ({formatCurrency(collection.cgst_amount)})
                      </TableCell>
                      <TableCell>
                        {collection.sgst_rate}% ({formatCurrency(collection.sgst_amount)})
                      </TableCell>
                      <TableCell>
                        {collection.igst_rate}% ({formatCurrency(collection.igst_amount)})
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(collection.total_tax_amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{collection.user_state_code}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(collection.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* State Breakdown */}
      {Object.keys(summary.state_breakdown).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tax Collections by State</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(summary.state_breakdown)
                .sort(([,a], [,b]) => b - a)
                .map(([state, amount]) => (
                <div key={state} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">{state}</span>
                  <span className="font-semibold">{formatCurrency(amount)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
