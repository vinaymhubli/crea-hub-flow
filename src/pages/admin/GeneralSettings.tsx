import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Settings, 
  Globe, 
  Shield, 
  Users, 
  CreditCard, 
  FileText, 
  Save,
  AlertTriangle,
  CheckCircle,
  Info,
  Loader2,
  Eye,
  EyeOff
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface PlatformSettings {
  id?: string;
  maintenance_mode: boolean;
  new_registrations: boolean;
  commission_rate: number;
  featured_designers_limit: number;
  platform_name: string;
  platform_description: string;
  support_email: string;
  max_file_size_mb: number;
  allowed_file_types: string[];
  session_timeout_minutes: number;
  contact_phone?: string;
  contact_address?: string;
  show_free_demo_button: boolean;
  social_links?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  seo_settings?: {
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string;
  };
  created_at?: string;
  updated_at?: string;
}

interface ValidationErrors {
  [key: string]: string;
}

export default function GeneralSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PlatformSettings>({
    maintenance_mode: false,
    new_registrations: true,
    commission_rate: 15,
    featured_designers_limit: 6,
    platform_name: "meetmydesigners",
    platform_description: "Connect with amazing designers worldwide",
    support_email: "support@meetmydesigner.com",
    max_file_size_mb: 10,
    allowed_file_types: ["jpg", "png", "pdf", "svg", "gif", "webp"],
    session_timeout_minutes: 60,
    contact_phone: "+1 (555) 123-4567",
    contact_address: "meetmydesigners, Plot No. C-54, G Block, Bandra Kurla Complex, Mumbai, Maharashtra 400051",
    show_free_demo_button: true,
    social_links: {
      facebook: "https://facebook.com/meetmydesigner",
      twitter: "https://twitter.com/meetmydesigner",
      instagram: "https://instagram.com/meetmydesigner",
      linkedin: "https://linkedin.com/company/meetmydesigner"
    },
    seo_settings: {
      meta_title: "meetmydesigners - Connect with Amazing Designers Worldwide",
      meta_description: "Find and collaborate with talented designers for your next project. Real-time design collaboration platform.",
      meta_keywords: "design, designer, collaboration, portfolio, creative, design services"
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [fileTypeInput, setFileTypeInput] = useState('');

  useEffect(() => {
    fetchSettings();
    loadLocalSettings();
  }, []);

  const loadLocalSettings = () => {
    try {
      const localSettings = localStorage.getItem('platform_settings_advanced');
      if (localSettings) {
        const parsed = JSON.parse(localSettings);
        setSettings(prev => ({
          ...prev,
          ...parsed
        }));
      }
    } catch (error) {
      console.error('Error loading local settings:', error);
    }
  };

  const saveLocalSettings = (newSettings: Partial<PlatformSettings>) => {
    try {
      const localSettings = {
        platform_name: newSettings.platform_name,
        platform_description: newSettings.platform_description,
        support_email: newSettings.support_email,
        max_file_size_mb: newSettings.max_file_size_mb,
        allowed_file_types: newSettings.allowed_file_types,
        session_timeout_minutes: newSettings.session_timeout_minutes,
        contact_phone: newSettings.contact_phone,
        contact_address: newSettings.contact_address,
        social_links: newSettings.social_links,
        seo_settings: newSettings.seo_settings
      };
      localStorage.setItem('platform_settings_advanced', JSON.stringify(localSettings));
    } catch (error) {
      console.error('Error saving local settings:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching settings:', error);
        toast.error('Failed to load platform settings');
        return;
      }

              if (data) {
          // Merge with existing data
          setSettings({
            ...settings,
            ...data
          });
        } else {
          // Create default settings if none exist
          await createDefaultSettings();
        }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load platform settings');
    } finally {
      setLoading(false);
    }
  };

  const createDefaultSettings = async () => {
    try {
      const defaultSettings = [
        { setting_key: 'maintenance_mode', setting_value: false },
        { setting_key: 'new_registrations', setting_value: true },
        { setting_key: 'show_free_demo_button', setting_value: true },
        { setting_key: 'commission_rate', setting_value: 15 },
        { setting_key: 'featured_designers_limit', setting_value: 6 }
      ];

      for (const setting of defaultSettings) {
        const { error } = await supabase
          .from('platform_settings')
          .upsert({
            setting_key: setting.setting_key,
            setting_value: setting.setting_value,
            updated_at: new Date().toISOString(),
            updated_by: user?.id
          }, {
            onConflict: 'setting_key'
          });

        if (error) throw error;
      }

      toast.success('Default platform settings created successfully!');
    } catch (error) {
      console.error('Error creating default settings:', error);
      toast.error('Failed to create default settings');
    }
  };

  const validateSettings = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!settings.platform_name.trim()) {
      newErrors.platform_name = 'Platform name is required';
    }

    if (!settings.platform_description.trim()) {
      newErrors.platform_description = 'Platform description is required';
    }

    if (!settings.support_email.trim()) {
      newErrors.support_email = 'Support email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.support_email)) {
      newErrors.support_email = 'Please enter a valid email address';
    }

    if (settings.commission_rate < 0 || settings.commission_rate > 50) {
      newErrors.commission_rate = 'Commission rate must be between 0 and 50';
    }

    if (settings.featured_designers_limit < 1 || settings.featured_designers_limit > 20) {
      newErrors.featured_designers_limit = 'Featured designers limit must be between 1 and 20';
    }

    if (settings.max_file_size_mb < 1 || settings.max_file_size_mb > 100) {
      newErrors.max_file_size_mb = 'File size must be between 1 and 100 MB';
    }

    if (settings.session_timeout_minutes < 15 || settings.session_timeout_minutes > 480) {
      newErrors.session_timeout_minutes = 'Session timeout must be between 15 and 480 minutes';
    }

    if (settings.allowed_file_types.length === 0) {
      newErrors.allowed_file_types = 'At least one file type must be allowed';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateSettings()) {
      toast.error('Please fix the validation errors before saving');
      return;
    }

    try {
      setSaving(true);
      
      // Save settings using key-value structure
      const settingsToUpdate = [
        { setting_key: 'maintenance_mode', setting_value: settings.maintenance_mode },
        { setting_key: 'new_registrations', setting_value: settings.new_registrations },
        { setting_key: 'show_free_demo_button', setting_value: settings.show_free_demo_button },
        { setting_key: 'commission_rate', setting_value: settings.commission_rate },
        { setting_key: 'featured_designers_limit', setting_value: settings.featured_designers_limit }
      ];

      for (const setting of settingsToUpdate) {
        const { error } = await supabase
          .from('platform_settings')
          .upsert({
            setting_key: setting.setting_key,
            setting_value: setting.setting_value,
            updated_at: new Date().toISOString(),
            updated_by: user?.id
          }, {
            onConflict: 'setting_key'
          });

        if (error) throw error;
      }

      toast.success('Platform settings saved successfully!');
      
      // Save advanced settings to local storage
      saveLocalSettings(settings);
      
      // Clear any previous errors
      setErrors({});
      
      // Show info about additional fields
      toast.info('Advanced settings saved to local storage. Database schema update required for full persistence.');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save platform settings');
    } finally {
      setSaving(false);
    }
  };

  const handleFileTypeAdd = () => {
    if (fileTypeInput.trim() && !settings.allowed_file_types.includes(fileTypeInput.trim().toLowerCase())) {
      const newSettings = {
        ...settings,
        allowed_file_types: [...settings.allowed_file_types, fileTypeInput.trim().toLowerCase()]
      };
      setSettings(newSettings);
      saveLocalSettings(newSettings);
      setFileTypeInput('');
    }
  };

  const handleFileTypeRemove = (fileType: string) => {
    const newSettings = {
      ...settings,
      allowed_file_types: settings.allowed_file_types.filter(type => type !== fileType)
    };
    setSettings(newSettings);
    saveLocalSettings(newSettings);
  };

  const handleFieldChange = (field: string, value: any) => {
    const newSettings = {
      ...settings,
      [field]: value
    };
    setSettings(newSettings);
    saveLocalSettings(newSettings);
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    const newSettings = {
      ...settings,
      social_links: {
        ...settings.social_links,
        [platform]: value
      }
    };
    setSettings(newSettings);
    saveLocalSettings(newSettings);
  };

  const handleSEOSettingChange = (field: string, value: string) => {
    setSettings({
      ...settings,
      seo_settings: {
        ...settings.seo_settings,
        [field]: value
      }
    });
  };

  const resetToDefaults = async () => {
    if (confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
      const defaultSettings: PlatformSettings = {
        maintenance_mode: false,
        new_registrations: true,
        show_free_demo_button: true,
        commission_rate: 15,
        featured_designers_limit: 6,
        platform_name: "meetmydesigners",
        platform_description: "Connect with amazing designers worldwide",
        support_email: "support@meetmydesigner.com",
        max_file_size_mb: 10,
        allowed_file_types: ["jpg", "png", "pdf", "svg", "gif", "webp"],
        session_timeout_minutes: 60,
        contact_phone: "+1 (555) 123-4567",
        contact_address: "meetmydesigners, Plot No. C-54, G Block, Bandra Kurla Complex, Mumbai, Maharashtra 400051",
        social_links: {
          facebook: "https://facebook.com/meetmydesigner",
          twitter: "https://twitter.com/meetmydesigner",
          instagram: "https://instagram.com/meetmydesigner",
          linkedin: "https://linkedin.com/company/meetmydesigner"
        },
        seo_settings: {
          meta_title: "meetmydesigners - Connect with Amazing Designers Worldwide",
          meta_description: "Find and collaborate with talented designers for your next project. Real-time design collaboration platform.",
          meta_keywords: "design, designer, collaboration, portfolio, creative, design services"
        }
      };

      setSettings(defaultSettings);
      toast.success('Settings reset to defaults');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading platform settings...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            General Settings
          </h1>
          <p className="text-muted-foreground mt-2">Manage platform-wide configurations and settings</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={resetToDefaults}>
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Platform Information
            </CardTitle>
            <CardDescription>Basic platform details and branding</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="platform_name">Platform Name *</Label>
              <Input
                id="platform_name"
                value={settings.platform_name}
                onChange={(e) => handleFieldChange('platform_name', e.target.value)}
                placeholder="Enter platform name"
                className={errors.platform_name ? 'border-red-500' : ''}
              />
              {errors.platform_name && (
                <p className="text-sm text-red-500 mt-1">{errors.platform_name}</p>
              )}
            </div>
            <div>
              <Label htmlFor="platform_description">Platform Description *</Label>
              <Textarea
                id="platform_description"
                value={settings.platform_description}
                onChange={(e) => handleFieldChange('platform_description', e.target.value)}
                placeholder="Enter platform description"
                rows={3}
                className={errors.platform_description ? 'border-red-500' : ''}
              />
              {errors.platform_description && (
                <p className="text-sm text-red-500 mt-1">{errors.platform_description}</p>
              )}
            </div>
            <div>
              <Label htmlFor="support_email">Support Email *</Label>
              <Input
                id="support_email"
                type="email"
                value={settings.support_email}
                onChange={(e) => setSettings({...settings, support_email: e.target.value})}
                placeholder="support@example.com"
                className={errors.support_email ? 'border-red-500' : ''}
              />
              {errors.support_email && (
                <p className="text-sm text-red-500 mt-1">{errors.support_email}</p>
              )}
            </div>
            <div>
              <Label htmlFor="contact_phone">Contact Phone</Label>
              <Input
                id="contact_phone"
                value={settings.contact_phone || ''}
                onChange={(e) => setSettings({...settings, contact_phone: e.target.value})}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div>
              <Label htmlFor="contact_address">Contact Address</Label>
              <Textarea
                id="contact_address"
                value={settings.contact_address || ''}
                onChange={(e) => setSettings({...settings, contact_address: e.target.value})}
                placeholder="Enter contact address"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              System Settings
            </CardTitle>
            <CardDescription>Core system configurations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="maintenance_mode">Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">Temporarily disable the platform</p>
              </div>
              <Switch
                id="maintenance_mode"
                checked={settings.maintenance_mode}
                onCheckedChange={(checked) => setSettings({...settings, maintenance_mode: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="new_registrations">New Registrations</Label>
                <p className="text-sm text-muted-foreground">Allow new users to sign up</p>
              </div>
              <Switch
                id="new_registrations"
                checked={settings.new_registrations}
                onCheckedChange={(checked) => setSettings({...settings, new_registrations: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="show_free_demo_button">Free Demo Button</Label>
                <p className="text-sm text-muted-foreground">Show free demo session button in header</p>
              </div>
              <Switch
                id="show_free_demo_button"
                checked={settings.show_free_demo_button}
                onCheckedChange={(checked) => setSettings({...settings, show_free_demo_button: checked})}
              />
            </div>
            <div>
              <Label htmlFor="session_timeout">Session Timeout (minutes) *</Label>
              <Input
                id="session_timeout"
                type="number"
                value={settings.session_timeout_minutes}
                onChange={(e) => setSettings({...settings, session_timeout_minutes: parseInt(e.target.value) || 60})}
                min="15"
                max="480"
                className={errors.session_timeout_minutes ? 'border-red-500' : ''}
              />
              {errors.session_timeout_minutes && (
                <p className="text-sm text-red-500 mt-1">{errors.session_timeout_minutes}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Business Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Business Settings
            </CardTitle>
            <CardDescription>Revenue and business configurations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="commission_rate">Commission Rate (%) *</Label>
              <Input
                id="commission_rate"
                type="number"
                value={settings.commission_rate}
                onChange={(e) => setSettings({...settings, commission_rate: parseFloat(e.target.value) || 0})}
                min="0"
                max="50"
                step="0.1"
                className={errors.commission_rate ? 'border-red-500' : ''}
              />
              {errors.commission_rate && (
                <p className="text-sm text-red-500 mt-1">{errors.commission_rate}</p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                Platform commission on designer earnings
              </p>
            </div>
            <div>
              <Label htmlFor="featured_limit">Featured Designers Limit *</Label>
              <Input
                id="featured_limit"
                type="number"
                value={settings.featured_designers_limit}
                onChange={(e) => setSettings({...settings, featured_designers_limit: parseInt(e.target.value) || 6})}
                min="1"
                max="20"
                className={errors.featured_designers_limit ? 'border-red-500' : ''}
              />
              {errors.featured_designers_limit && (
                <p className="text-sm text-red-500 mt-1">{errors.featured_designers_limit}</p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                Maximum number of featured designers on homepage
              </p>
            </div>
          </CardContent>
        </Card>

        {/* File Upload Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              File Upload Settings
            </CardTitle>
            <CardDescription>Configure file upload limits and types</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="max_file_size">Maximum File Size (MB) *</Label>
              <Input
                id="max_file_size"
                type="number"
                value={settings.max_file_size_mb}
                onChange={(e) => setSettings({...settings, max_file_size_mb: parseInt(e.target.value) || 10})}
                min="1"
                max="100"
                className={errors.max_file_size_mb ? 'border-red-500' : ''}
              />
              {errors.max_file_size_mb && (
                <p className="text-sm text-red-500 mt-1">{errors.max_file_size_mb}</p>
              )}
            </div>
            <div>
              <Label>Allowed File Types *</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Add file type (e.g., jpg)"
                  value={fileTypeInput}
                  onChange={(e) => setFileTypeInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleFileTypeAdd()}
                />
                <Button onClick={handleFileTypeAdd} size="sm">Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {settings.allowed_file_types.map((type, index) => (
                  <Badge key={index} variant="secondary" className="px-2 py-1">
                    .{type}
                    <button
                      onClick={() => handleFileTypeRemove(type)}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
              {errors.allowed_file_types && (
                <p className="text-sm text-red-500 mt-1">{errors.allowed_file_types}</p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                Supported file extensions for uploads
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Database Schema Note */}
      <Card className="mb-6 bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Database Schema Update Required</h4>
              <p className="text-sm text-blue-700 mt-1">
                Some advanced settings (contact info, social links, SEO settings) are currently stored locally. 
                To enable full persistence, the database schema needs to be updated with additional fields.
                Basic settings (maintenance mode, commission rate, etc.) are fully functional.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <div className="mt-8">
        <Button
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="mb-4"
        >
          {showAdvanced ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
          {showAdvanced ? 'Hide' : 'Show'} Advanced Settings (Local Storage)
        </Button>

        {showAdvanced && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Social Media Links */}
            <Card>
              <CardHeader>
                <CardTitle>Social Media Links</CardTitle>
                <CardDescription>Platform social media presence</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="facebook">Facebook URL</Label>
                  <Input
                    id="facebook"
                    value={settings.social_links?.facebook || ''}
                    onChange={(e) => handleSocialLinkChange('facebook', e.target.value)}
                    placeholder="https://facebook.com/username"
                  />
                </div>
                <div>
                  <Label htmlFor="twitter">Twitter URL</Label>
                  <Input
                    id="twitter"
                    value={settings.social_links?.twitter || ''}
                    onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                    placeholder="https://twitter.com/username"
                  />
                </div>
                <div>
                  <Label htmlFor="instagram">Instagram URL</Label>
                  <Input
                    id="instagram"
                    value={settings.social_links?.instagram || ''}
                    onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                    placeholder="https://instagram.com/username"
                  />
                </div>
                <div>
                  <Label htmlFor="linkedin">LinkedIn URL</Label>
                  <Input
                    id="linkedin"
                    value={settings.social_links?.linkedin || ''}
                    onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
                    placeholder="https://linkedin.com/company/companyname"
                  />
                </div>
              </CardContent>
            </Card>

            {/* SEO Settings */}
            <Card>
              <CardHeader>
                <CardTitle>SEO Settings</CardTitle>
                <CardDescription>Search engine optimization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="meta_title">Meta Title</Label>
                  <Input
                    id="meta_title"
                    value={settings.seo_settings?.meta_title || ''}
                    onChange={(e) => handleSEOSettingChange('meta_title', e.target.value)}
                    placeholder="Page title for search engines"
                  />
                </div>
                <div>
                  <Label htmlFor="meta_description">Meta Description</Label>
                  <Textarea
                    id="meta_description"
                    value={settings.seo_settings?.meta_description || ''}
                    onChange={(e) => handleSEOSettingChange('meta_description', e.target.value)}
                    placeholder="Page description for search engines"
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="meta_keywords">Meta Keywords</Label>
                  <Input
                    id="meta_keywords"
                    value={settings.seo_settings?.meta_keywords || ''}
                    onChange={(e) => handleSEOSettingChange('meta_keywords', e.target.value)}
                    placeholder="Comma-separated keywords"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Platform Preview */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Platform Preview</CardTitle>
            <CardDescription>How your settings will appear to users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-semibold mb-3">Platform Information</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Name:</strong> {settings.platform_name}</p>
                  <p><strong>Description:</strong> {settings.platform_description}</p>
                  <p><strong>Support:</strong> {settings.support_email}</p>
                  {settings.contact_phone && <p><strong>Phone:</strong> {settings.contact_phone}</p>}
                  {settings.contact_address && <p><strong>Address:</strong> {settings.contact_address}</p>}
                </div>
              </div>
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-semibold mb-3">Business Settings</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Commission:</strong> {settings.commission_rate}%</p>
                  <p><strong>Featured Designers:</strong> Up to {settings.featured_designers_limit}</p>
                  <p><strong>File Upload:</strong> Max {settings.max_file_size_mb}MB</p>
                  <p><strong>Session Timeout:</strong> {settings.session_timeout_minutes} minutes</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Indicators */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg border">
                {settings.maintenance_mode ? (
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
                <div>
                  <p className="font-medium">Maintenance Mode</p>
                  <p className="text-sm text-muted-foreground">
                    {settings.maintenance_mode ? 'Platform is in maintenance' : 'Platform is operational'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg border">
                {settings.new_registrations ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                )}
                <div>
                  <p className="font-medium">New Registrations</p>
                  <p className="text-sm text-muted-foreground">
                    {settings.new_registrations ? 'Open for new users' : 'Closed for new users'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg border">
                <Info className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="font-medium">Commission Rate</p>
                  <p className="text-sm text-muted-foreground">
                    {settings.commission_rate}% platform fee
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
