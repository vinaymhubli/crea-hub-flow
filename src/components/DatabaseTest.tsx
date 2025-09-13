import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function DatabaseTest() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    const testResults: any = {};

    try {
      // Test 1: Check if session_files table exists
      console.log('🔍 Testing session_files table...');
      const { data: sessionFiles, error: sessionFilesError } = await (supabase as any)
        .from('session_files')
        .select('*')
        .limit(1);
      
      testResults.sessionFiles = {
        exists: !sessionFilesError,
        error: sessionFilesError?.message,
        count: sessionFiles?.length || 0
      };

      // Test 2: Check if session_approval_requests table exists
      console.log('🔍 Testing session_approval_requests table...');
      const { data: approvalRequests, error: approvalError } = await (supabase as any)
        .from('session_approval_requests')
        .select('*')
        .limit(1);
      
      testResults.approvalRequests = {
        exists: !approvalError,
        error: approvalError?.message,
        count: approvalRequests?.length || 0
      };

      // Test 3: Check if wallet_transactions table exists
      console.log('🔍 Testing wallet_transactions table...');
      const { data: walletTransactions, error: walletError } = await (supabase as any)
        .from('wallet_transactions')
        .select('*')
        .limit(1);
      
      testResults.walletTransactions = {
        exists: !walletError,
        error: walletError?.message,
        count: walletTransactions?.length || 0
      };

      // Test 4: Check if get_total_earnings function exists
      console.log('🔍 Testing get_total_earnings function...');
      try {
        const { data: earningsData, error: earningsError } = await (supabase as any)
          .rpc('get_total_earnings', { designer_user_id: '137653af-050a-4ad7-8a1e-d14419a7795f' });
        
        testResults.earningsFunction = {
          exists: !earningsError,
          error: earningsError?.message,
          result: earningsData
        };
      } catch (error: any) {
        testResults.earningsFunction = {
          exists: false,
          error: error.message
        };
      }

      // Test 5: Check active_sessions table
      console.log('🔍 Testing active_sessions table...');
      const { data: activeSessions, error: activeError } = await (supabase as any)
        .from('active_sessions')
        .select('*')
        .limit(1);
      
      testResults.activeSessions = {
        exists: !activeError,
        error: activeError?.message,
        count: activeSessions?.length || 0
      };

      setResults(testResults);
      console.log('✅ Database test results:', testResults);

    } catch (error: any) {
      console.error('❌ Database test failed:', error);
      testResults.generalError = error.message;
      setResults(testResults);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto p-6">
      <CardHeader>
        <CardTitle>Database Test</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={runTests} disabled={loading} className="mb-4">
          {loading ? 'Testing...' : 'Run Database Tests'}
        </Button>
        
        {Object.keys(results).length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Test Results:</h3>
            {Object.entries(results).map(([key, value]: [string, any]) => (
              <div key={key} className="p-4 border rounded-lg">
                <h4 className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</h4>
                <div className="text-sm text-gray-600 mt-2">
                  <p><strong>Exists:</strong> {value.exists ? '✅ Yes' : '❌ No'}</p>
                  {value.error && <p><strong>Error:</strong> {value.error}</p>}
                  {value.count !== undefined && <p><strong>Count:</strong> {value.count}</p>}
                  {value.result !== undefined && <p><strong>Result:</strong> {value.result}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
