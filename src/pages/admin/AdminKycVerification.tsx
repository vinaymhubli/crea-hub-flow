import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface KycDesignerRow {
  id: string;
  user_id: string;
  kyc_status: string | null;
  verification_status: string | null;
  kyc_aadhaar_front_url?: string | null;
  kyc_aadhaar_back_url?: string | null;
  kyc_pan_front_url?: string | null;
  kyc_pan_back_url?: string | null;
  profiles?: { first_name?: string | null; last_name?: string | null; email?: string | null; } | null;
}

export default function AdminKycVerification() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'pending' | 'approved'>('pending');
  const [rows, setRows] = useState<KycDesignerRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      let query = (supabase as any)
        .from('designers')
        .select('id,user_id,kyc_status,verification_status,kyc_aadhaar_front_url,kyc_aadhaar_back_url,kyc_pan_front_url,kyc_pan_back_url,profiles:user_id(first_name,last_name,email)')
        .order('updated_at', { ascending: false });
      query = query.eq('kyc_status', status);
      // Only show designers who have actually submitted at least one authenticity document
      query = query.or('kyc_aadhaar_front_url.not.is.null,kyc_pan_front_url.not.is.null');
      const { data, error } = await query;
      if (error) throw error;
      let result = (data || []) as unknown as KycDesignerRow[];
      if (search.trim()) {
        const t = search.trim().toLowerCase();
        result = result.filter(r => (`${r.profiles?.first_name || ''} ${r.profiles?.last_name || ''}`.toLowerCase().includes(t)) || (r.profiles?.email || '').toLowerCase().includes(t));
      }
      setRows(result);
    } catch (e: any) {
      console.error('Load authenticity error:', e);
      toast({ title: 'Error', description: e?.message ?? 'Failed to load authenticity requests', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [status]);

  const setKyc = async (designerId: string, next: 'approved' | 'rejected') => {
    try {
      // Authenticity status is decoupled from account verification
      const payload: any = { kyc_status: next };
      const { error } = await supabase.from('designers').update(payload).eq('id', designerId);
      if (error) throw error;
      toast({ title: 'Updated', description: `Business authenticity ${next}` });
      load();
    } catch (e: any) {
      console.error('Update authenticity error:', e);
      toast({ title: 'Error', description: e?.message ?? 'Failed to update authenticity status', variant: 'destructive' });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Business Authenticity Review</h1>
          <p className="text-gray-600">Review identity and business proof uploads, then approve or reject.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading}>Refresh</Button>
        </div>
      </div>

      <Tabs value={status} onValueChange={(v) => setStatus(v as any)}>
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
        </TabsList>
        <TabsContent value={status} className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label>Search</Label>
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name or email" className="w-64" />
            </div>
            <div className="text-sm text-gray-600">{rows.length} result(s)</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rows.map((r) => (
              <Card key={r.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-base">
                    {r.profiles?.first_name} {r.profiles?.last_name}
                    <span className="ml-2 text-xs text-gray-500">{r.profiles?.email}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm">Authenticity Status: <span className="font-medium">{r.kyc_status || '—'}</span></div>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <DocLink label="Identity Proof" url={r.kyc_aadhaar_front_url} />
                    <DocLink label="Business Proof" url={r.kyc_pan_front_url} />
                  </div>
                  <div className="flex gap-2 pt-2">
                    {r.kyc_status === 'approved' ? (
                      <Button disabled className="bg-green-600/80 cursor-default">Approved</Button>
                    ) : (
                      <>
                        <Button onClick={() => setKyc(r.id, 'approved')} disabled={loading} className="bg-green-600 hover:bg-green-700">Approve</Button>
                        <Button onClick={() => setKyc(r.id, 'rejected')} variant="destructive" disabled={loading}>Reject</Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DocLink({ label, url }: { label: string; url?: string | null }) {
  const [signedUrl, setSignedUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  
  React.useEffect(() => {
    let isMounted = true;
    const gen = async () => {
      if (!url) { 
        setSignedUrl(null); 
        return; 
      }
      setLoading(true);
      try {
        const bucket = 'kyc-docs';
        // Extract path from URL - handle both public and private URLs
        let path = url;
        if (url.includes('/storage/v1/object/')) {
          // Handle full Supabase URLs (both public and private)
          const parts = url.split('/storage/v1/object/');
          if (parts.length > 1) {
            path = parts[1].replace('public/', '').replace('private/', '');
            // Remove bucket name from path since we specify it in the storage call
            if (path.startsWith('kyc-docs/')) {
              path = path.substring('kyc-docs/'.length);
            }
          }
        } else if (url.includes('kyc-docs/')) {
          // Handle direct bucket paths
          const idx = url.indexOf('kyc-docs/');
          path = url.substring(idx + 'kyc-docs/'.length);
        }
        
        // Decode any URL-encoded characters (e.g., spaces) to match stored object names
        const decodedPath = decodeURIComponent(path);
        console.log('Generating signed URL for path:', decodedPath);
        const { data, error } = await supabase.storage.from(bucket).createSignedUrl(decodedPath, 300);
        
        if (!isMounted) return;
        
        if (error) {
          console.error('Signed URL error:', error);
          setSignedUrl(null);
        } else {
          console.log('Generated signed URL:', data?.signedUrl);
          setSignedUrl(data?.signedUrl ?? null);
        }
      } catch (err) {
        console.error('Signed URL generation failed:', err);
        if (isMounted) setSignedUrl(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    gen();
    return () => { isMounted = false; };
  }, [url]);

  if (!url) {
    return <div className="p-2 border rounded bg-gray-50 text-gray-500">{label}: Not uploaded</div>;
  }
  
  const isImage = /(png|jpg|jpeg|webp)$/i.test(url);
  
  return (
    <div className="p-2 border rounded">
      <div className="font-medium mb-1">{label}</div>
      {loading ? (
        <div className="w-full h-28 bg-gray-100 rounded flex items-center justify-center text-gray-500 text-sm">
          Loading...
        </div>
      ) : signedUrl ? (
        isImage ? (
          <a href={signedUrl} target="_blank" rel="noreferrer" className="block">
            <img src={signedUrl} alt={label} className="w-full h-28 object-cover rounded" />
          </a>
        ) : (
          <a href={signedUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">Open document</a>
        )
      ) : (
        <div className="w-full h-28 bg-red-50 border border-red-200 rounded flex items-center justify-center text-red-600 text-sm">
          Failed to load
        </div>
      )}
    </div>
  );
}


