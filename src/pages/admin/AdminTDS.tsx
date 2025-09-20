import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Percent, Edit, Save, X } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface TDSSetting {
  id: string
  tds_rate: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function AdminTDS() {
  const [tdsSettings, setTdsSettings] = useState<TDSSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingTDS, setEditingTDS] = useState<TDSSetting | null>(null)
  const [formData, setFormData] = useState({
    tds_rate: 10.00,
    is_active: true
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchTDSSettings()
  }, [])

  const fetchTDSSettings = async () => {
    try {
      setLoading(true)
      
      const { data: settingsData, error: settingsError } = await supabase
        .from('tds_settings')
        .select('*')
        .order('created_at', { ascending: false })

      if (settingsError) throw settingsError

      setTdsSettings(settingsData || [])

    } catch (error) {
      console.error('Error fetching TDS settings:', error)
      toast({
        title: "Error",
        description: "Failed to fetch TDS settings",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingTDS) {
        // Update existing TDS setting
        const { error } = await supabase
          .from('tds_settings')
          .update(formData)
          .eq('id', editingTDS.id)

        if (error) throw error

        toast({
          title: "Success",
          description: "TDS setting updated successfully"
        })
      } else {
        // Create new TDS setting
        const { error } = await supabase
          .from('tds_settings')
          .insert([formData])

        if (error) throw error

        toast({
          title: "Success",
          description: "TDS setting created successfully"
        })
      }

      resetForm()
      setShowDialog(false)
      fetchTDSSettings()
    } catch (error) {
      console.error('Error saving TDS setting:', error)
      toast({
        title: "Error",
        description: "Failed to save TDS setting",
        variant: "destructive"
      })
    }
  }

  const handleEdit = (tds: TDSSetting) => {
    setEditingTDS(tds)
    setFormData({
      tds_rate: tds.tds_rate,
      is_active: tds.is_active
    })
    setShowDialog(true)
  }

  const resetForm = () => {
    setFormData({
      tds_rate: 10.00,
      is_active: true
    })
    setEditingTDS(null)
  }

  const getActiveTDS = () => {
    return tdsSettings.find(tds => tds.is_active)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading TDS settings...</p>
          </div>
        </div>
      </div>
    )
  }

  const activeTDS = getActiveTDS()

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">TDS Management</h1>
          <p className="text-gray-600">Set and manage TDS (Tax Deducted at Source) rates for session payments</p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Percent className="w-4 h-4 mr-2" />
          New TDS Setting
        </Button>
      </div>

      {/* Current TDS Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="w-5 h-5" />
            Current TDS Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeTDS ? (
            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
              <div>
                <div className="text-2xl font-bold text-green-800">
                  {activeTDS.tds_rate}%
                </div>
                <div className="text-sm text-green-600">
                  TDS rate applied to all session payments
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No active TDS setting configured</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setShowDialog(true)}
              >
                Create TDS Setting
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* TDS Settings Table */}
      <Card>
        <CardHeader>
          <CardTitle>TDS Settings ({tdsSettings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {tdsSettings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No TDS settings configured</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setShowDialog(true)}
              >
                Create First Setting
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">TDS Rate</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Created</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tdsSettings.map((tds) => (
                    <tr key={tds.id} className="border-b">
                      <td className="p-3">
                        <div className="text-lg font-semibold">{tds.tds_rate}%</div>
                      </td>
                      <td className="p-3">
                        {tds.is_active ? (
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        ) : (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {new Date(tds.created_at).toLocaleDateString('en-IN')}
                      </td>
                      <td className="p-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(tds)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* TDS Setting Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTDS ? 'Edit TDS Setting' : 'Create TDS Setting'}
            </DialogTitle>
            <DialogDescription>
              {editingTDS ? 'Update the TDS rate and status' : 'Set the TDS rate for session payments'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="tds_rate">TDS Rate (%)</Label>
              <Input
                id="tds_rate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.tds_rate}
                onChange={(e) => setFormData({...formData, tds_rate: parseFloat(e.target.value) || 0})}
                placeholder="Enter TDS rate"
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                className="rounded"
              />
              <Label htmlFor="is_active">Active</Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit">
                <Save className="w-4 h-4 mr-2" />
                {editingTDS ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
