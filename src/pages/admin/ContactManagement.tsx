import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, Eye, Edit, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

interface ContactContent {
  id: string;
  section_type: 'hero' | 'contact_method' | 'office_info';
  title: string;
  description: string;
  content: string;
  icon: string;
  contact_info: string;
  action_text: string;
  color_scheme: string;
  sort_order: number;
  is_published: boolean;
  // Office info specific fields
  office_address?: string;
  office_hours?: string;
  public_transport?: string;
  parking_info?: string;
  map_embed_url?: string;
  booking_url?: string;
  // Editable headings
  address_heading?: string;
  hours_heading?: string;
  transport_heading?: string;
  parking_heading?: string;
  booking_heading?: string;
  updated_at: string;
}

export default function ContactManagement() {
  const [content, setContent] = useState<ContactContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<ContactContent | null>(null);
  const { toast } = useToast();

  const colorOptions = [
    { value: 'green', label: 'Green', bgColor: 'bg-green-50', iconBg: 'bg-green-100', iconColor: 'text-green-600', buttonBg: 'bg-green-600 hover:bg-green-700' },
    { value: 'blue', label: 'Blue', bgColor: 'bg-blue-50', iconBg: 'bg-blue-100', iconColor: 'text-blue-600', buttonBg: 'bg-blue-600 hover:bg-blue-700' },
    { value: 'purple', label: 'Purple', bgColor: 'bg-purple-50', iconBg: 'bg-purple-100', iconColor: 'text-purple-600', buttonBg: 'bg-purple-600 hover:bg-purple-700' },
    { value: 'orange', label: 'Orange', bgColor: 'bg-orange-50', iconBg: 'bg-orange-100', iconColor: 'text-orange-600', buttonBg: 'bg-orange-600 hover:bg-orange-700' }
  ];

  const iconOptions = [
    'ri-mail-line', 'ri-phone-line', 'ri-chat-3-line', 'ri-map-pin-line',
    'ri-time-line', 'ri-chat-smile-2-line', 'ri-customer-service-2-line',
    'ri-headphone-line', 'ri-message-3-line', 'ri-video-line'
  ];

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contact_page_content')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setContent(data as any || []);
    } catch (error) {
      console.error('Error fetching contact content:', error);
      toast({
        title: "Error",
        description: "Failed to load contact page content.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveItem = async (item: ContactContent) => {
    try {
      setSaving(true);
      
      console.log('Saving item:', item);
      
      const itemData = {
        section_type: item.section_type,
        title: item.title,
        description: item.description,
        content: item.content,
        icon: item.icon,
        contact_info: item.contact_info,
        action_text: item.action_text,
        color_scheme: item.color_scheme,
        sort_order: item.sort_order,
        is_published: item.is_published,
        // Office info specific fields
        office_address: item.office_address,
        office_hours: item.office_hours,
        public_transport: item.public_transport,
        parking_info: item.parking_info,
        map_embed_url: item.map_embed_url,
        booking_url: item.booking_url,
        // Editable headings
        address_heading: item.address_heading,
        hours_heading: item.hours_heading,
        transport_heading: item.transport_heading,
        parking_heading: item.parking_heading,
        booking_heading: item.booking_heading,
        updated_at: new Date().toISOString()
      };
      
      console.log('Item data to save:', itemData);

      if (item.id) {
        console.log('Updating existing item with ID:', item.id);
        const { error } = await supabase
          .from('contact_page_content')
          .update(itemData)
          .eq('id', item.id);

        if (error) {
          console.error('Update error:', error);
          throw error;
        }
        console.log('Update successful');
      } else {
        console.log('Inserting new item');
        const { error } = await supabase
          .from('contact_page_content')
          .insert(itemData);

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
        console.log('Insert successful');
      }

      toast({
        title: "Success",
        description: "Contact content updated successfully.",
      });

      await fetchContent();
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving contact content:', error);
      toast({
        title: "Error",
        description: "Failed to save contact content.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contact_page_content')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Contact item deleted successfully.",
      });

      await fetchContent();
    } catch (error) {
      console.error('Error deleting contact item:', error);
      toast({
        title: "Error",
        description: "Failed to delete contact item.",
        variant: "destructive",
      });
    }
  };

  const addNewContactMethod = () => {
    const newItem: ContactContent = {
      id: '',
      section_type: 'contact_method',
      title: 'New Contact Method',
      description: 'Description for the new contact method',
      content: 'New Contact Method',
      icon: 'ri-customer-service-2-line',
      contact_info: 'Contact information',
      action_text: 'Take Action',
      color_scheme: 'green',
      sort_order: content.filter(c => c.section_type === 'contact_method').length + 1,
      is_published: true,
      updated_at: new Date().toISOString()
    };
    setEditingItem(newItem);
  };

  const addOfficeInfo = () => {
    const newItem: ContactContent = {
      id: '',
      section_type: 'office_info',
      title: 'Visit Our Office',
      description: 'Located in the heart of Mumbai\'s business district, our office is easily accessible and we\'d love to meet you in person.',
      content: 'Office Information',
      icon: 'ri-map-pin-line',
      contact_info: '',
      action_text: 'Book Appointment',
      color_scheme: 'blue',
      sort_order: content.length + 1,
      is_published: true,
      office_address: 'Meet My Designers\nPlot No. C-54, G Block\nBandra Kurla Complex\nMumbai, Maharashtra 400051',
      office_hours: 'Monday - Friday: 9:00 AM - 7:00 PM\nSaturday: 10:00 AM - 4:00 PM\nSunday: Closed',
      public_transport: 'Kurla Station (5 min walk)\nBKC Metro Station (3 min walk)\nMultiple bus routes available',
      parking_info: 'Free visitor parking available\nValet service during business hours\nEV charging stations on-site',
      map_embed_url: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3771.123456789!2d72.8765432!3d19.1234567!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c1234567890%3A0x1234567890abcdef!2sBandra%20Kurla%20Complex!5e0!3m2!1sen!2sin!4v1234567890!5m2!1sen!2sin',
      booking_url: 'https://calendly.com/meetmydesigners',
      // Default headings
      address_heading: 'Address',
      hours_heading: 'Hours',
      transport_heading: 'Transport',
      parking_heading: 'Parking',
      booking_heading: 'Booking URL',
      updated_at: new Date().toISOString()
    };
    setEditingItem(newItem);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const heroContent = content.find(c => c.section_type === 'hero');
  const contactMethods = content.filter(c => c.section_type === 'contact_method');
  const officeInfo = content.find(c => c.section_type === 'office_info');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contact Page Management</h1>
          <p className="text-muted-foreground">
            Manage your contact page hero section and contact method cards
          </p>
        </div>
        <Button onClick={addNewContactMethod}>
          <Plus className="h-4 w-4 mr-2" />
          Add Contact Method
        </Button>
      </div>

      {/* Hero Section */}
      {heroContent && (
        <Card>
          <CardHeader>
            <CardTitle>Hero Section</CardTitle>
            <CardDescription>
              Main heading and description for the contact page
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="hero-title">Title</Label>
                <Input
                  id="hero-title"
                  value={heroContent.title}
                  onChange={(e) => {
                    const updated = content.map(c => 
                      c.id === heroContent.id ? { ...c, title: e.target.value } : c
                    );
                    setContent(updated);
                  }}
                />
              </div>
              <div>
                <Label htmlFor="hero-description">Description</Label>
                <Textarea
                  id="hero-description"
                  value={heroContent.description}
                  onChange={(e) => {
                    const updated = content.map(c => 
                      c.id === heroContent.id ? { ...c, description: e.target.value } : c
                    );
                    setContent(updated);
                  }}
                  rows={3}
                />
              </div>
            </div>
            <Button onClick={() => saveItem(heroContent)} disabled={saving}>
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Hero Section
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Contact Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Method Cards</CardTitle>
          <CardDescription>
            Manage the contact method cards displayed on the contact page
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {contactMethods.map((method, index) => (
              <div key={method.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold">{method.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      method.color_scheme === 'green' ? 'bg-green-100 text-green-800' :
                      method.color_scheme === 'blue' ? 'bg-blue-100 text-blue-800' :
                      method.color_scheme === 'purple' ? 'bg-purple-100 text-purple-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {method.color_scheme}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingItem(method)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteItem(method.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p><strong>Description:</strong> {method.description}</p>
                  <p><strong>Contact:</strong> {method.contact_info}</p>
                  <p><strong>Action:</strong> {method.action_text}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Office Information Section */}
      <Card>
        <CardHeader>
          <CardTitle>Office Information</CardTitle>
          <CardDescription>
            Manage the "Visit Our Office" section with address, hours, transport, and parking information
          </CardDescription>
        </CardHeader>
        <CardContent>
          {officeInfo ? (
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold">{officeInfo.title}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    officeInfo.color_scheme === 'green' ? 'bg-green-100 text-green-800' :
                    officeInfo.color_scheme === 'blue' ? 'bg-blue-100 text-blue-800' :
                    officeInfo.color_scheme === 'purple' ? 'bg-purple-100 text-purple-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {officeInfo.color_scheme}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingItem(officeInfo)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteItem(officeInfo.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="text-sm text-muted-foreground space-y-3">
                <div>
                  <p><strong>Description:</strong> {officeInfo.description}</p>
                </div>
                <div>
                  <p><strong>Address:</strong></p>
                  <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-2 rounded mt-1">{officeInfo.office_address}</pre>
                </div>
                <div>
                  <p><strong>Hours:</strong></p>
                  <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-2 rounded mt-1">{officeInfo.office_hours}</pre>
                </div>
                <div>
                  <p><strong>Transport:</strong></p>
                  <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-2 rounded mt-1">{officeInfo.public_transport}</pre>
                </div>
                <div>
                  <p><strong>Parking:</strong></p>
                  <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-2 rounded mt-1">{officeInfo.parking_info}</pre>
                </div>
                <div>
                  <p><strong>Booking URL:</strong> <a href={officeInfo.booking_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{officeInfo.booking_url}</a></p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No office information configured</p>
              <Button onClick={addOfficeInfo}>
                <Plus className="h-4 w-4 mr-2" />
                Add Office Information
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {editingItem && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingItem.id ? 
                (editingItem.section_type === 'office_info' ? 'Edit Office Information' : 'Edit Contact Method') : 
                (editingItem.section_type === 'office_info' ? 'Add Office Information' : 'Add New Contact Method')
              }
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="icon">Icon</Label>
                <select
                  id="icon"
                  value={editingItem.icon}
                  onChange={(e) => setEditingItem({ ...editingItem, icon: e.target.value })}
                  className="w-full p-2 border rounded-md"
                >
                  {iconOptions.map(icon => (
                    <option key={icon} value={icon}>{icon}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="contact-info">Contact Information</Label>
                <Input
                  id="contact-info"
                  value={editingItem.contact_info}
                  onChange={(e) => setEditingItem({ ...editingItem, contact_info: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="action-text">Action Text</Label>
                <Input
                  id="action-text"
                  value={editingItem.action_text}
                  onChange={(e) => setEditingItem({ ...editingItem, action_text: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="color-scheme">Color Scheme</Label>
                <select
                  id="color-scheme"
                  value={editingItem.color_scheme}
                  onChange={(e) => setEditingItem({ ...editingItem, color_scheme: e.target.value })}
                  className="w-full p-2 border rounded-md"
                >
                  {colorOptions.map(color => (
                    <option key={color.value} value={color.value}>{color.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="sort-order">Sort Order</Label>
                <Input
                  id="sort-order"
                  type="number"
                  value={editingItem.sort_order}
                  onChange={(e) => setEditingItem({ ...editingItem, sort_order: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editingItem.description}
                onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                rows={3}
              />
            </div>

            {/* Office Information Fields */}
            {editingItem.section_type === 'office_info' && (
              <>
                <div>
                  <Label htmlFor="map-embed-url">Google Maps Embed URL</Label>
                  <Input
                    id="map-embed-url"
                    value={editingItem.map_embed_url || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, map_embed_url: e.target.value })}
                    placeholder="https://www.google.com/maps/embed?pb=..."
                  />
                </div>

                {/* Editable Headings Section */}
                <div className="col-span-2">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Editable Headings</h4>
                </div>
                
                <div>
                  <Label htmlFor="address-heading">Address Heading</Label>
                  <Input
                    id="address-heading"
                    value={editingItem.address_heading || 'Address'}
                    onChange={(e) => setEditingItem({ ...editingItem, address_heading: e.target.value })}
                    placeholder="Address"
                  />
                </div>
                
                <div>
                  <Label htmlFor="hours-heading">Hours Heading</Label>
                  <Input
                    id="hours-heading"
                    value={editingItem.hours_heading || 'Hours'}
                    onChange={(e) => setEditingItem({ ...editingItem, hours_heading: e.target.value })}
                    placeholder="Hours"
                  />
                </div>
                
                <div>
                  <Label htmlFor="transport-heading">Transport Heading</Label>
                  <Input
                    id="transport-heading"
                    value={editingItem.transport_heading || 'Transport'}
                    onChange={(e) => setEditingItem({ ...editingItem, transport_heading: e.target.value })}
                    placeholder="Transport"
                  />
                </div>
                
                <div>
                  <Label htmlFor="parking-heading">Parking Heading</Label>
                  <Input
                    id="parking-heading"
                    value={editingItem.parking_heading || 'Parking'}
                    onChange={(e) => setEditingItem({ ...editingItem, parking_heading: e.target.value })}
                    placeholder="Parking"
                  />
                </div>
                
                <div>
                  <Label htmlFor="booking-heading">Booking Heading</Label>
                  <Input
                    id="booking-heading"
                    value={editingItem.booking_heading || 'Booking URL'}
                    onChange={(e) => setEditingItem({ ...editingItem, booking_heading: e.target.value })}
                    placeholder="Booking URL"
                  />
                </div>

                {/* Editable Content Section */}
                <div className="col-span-2">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Editable Content</h4>
                </div>
                
                <div>
                  <Label htmlFor="address-content">Address Content</Label>
                  <Textarea
                    id="address-content"
                    value={editingItem.office_address || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, office_address: e.target.value })}
                    rows={4}
                    placeholder="Meet My Designers&#10;Plot No. C-54, G Block&#10;Bandra Kurla Complex&#10;Mumbai, Maharashtra 400051"
                  />
                </div>
                
                <div>
                  <Label htmlFor="hours-content">Hours Content</Label>
                  <Textarea
                    id="hours-content"
                    value={editingItem.office_hours || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, office_hours: e.target.value })}
                    rows={3}
                    placeholder="Monday - Friday: 9:00 AM - 7:00 PM&#10;Saturday: 10:00 AM - 4:00 PM&#10;Sunday: Closed"
                  />
                </div>
                
                <div>
                  <Label htmlFor="transport-content">Transport Content</Label>
                  <Textarea
                    id="transport-content"
                    value={editingItem.public_transport || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, public_transport: e.target.value })}
                    rows={3}
                    placeholder="Kurla Station (5 min walk)&#10;BKC Metro Station (3 min walk)&#10;Multiple bus routes available"
                  />
                </div>
                
                <div>
                  <Label htmlFor="parking-content">Parking Content</Label>
                  <Textarea
                    id="parking-content"
                    value={editingItem.parking_info || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, parking_info: e.target.value })}
                    rows={3}
                    placeholder="Free visitor parking available&#10;Valet service during business hours&#10;EV charging stations on-site"
                  />
                </div>
                
                <div>
                  <Label htmlFor="booking-content">Booking URL Content</Label>
                  <Input
                    id="booking-content"
                    value={editingItem.booking_url || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, booking_url: e.target.value })}
                    placeholder="https://calendly.com/meetmydesigners"
                  />
                </div>
              </>
            )}
            <div className="flex items-center space-x-2">
              <Switch
                id="published"
                checked={editingItem.is_published}
                onCheckedChange={(checked) => setEditingItem({ ...editingItem, is_published: checked })}
              />
              <Label htmlFor="published">Published</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Button onClick={() => saveItem(editingItem)} disabled={saving}>
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setEditingItem(null)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}