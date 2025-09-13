import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Upload, DollarSign } from 'lucide-react';

interface PaymentCompletionNotificationProps {
  isOpen: boolean;
  onOk: () => void;
  customerName: string;
  amount: number;
}

export default function PaymentCompletionNotification({
  isOpen,
  onOk,
  customerName,
  amount
}: PaymentCompletionNotificationProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Payment Completed!
          </CardTitle>
          <p className="text-gray-600 mt-2">
            {customerName} has successfully completed the payment.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Payment Details */}
          <div className="bg-green-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-600">Amount Received:</span>
              </div>
              <span className="font-bold text-lg text-green-600">${amount.toFixed(2)}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600">Payment Status: Completed</span>
            </div>
          </div>

          {/* Upload Instructions */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Upload className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900 mb-1">Next Step: Upload Final File</p>
                <p className="text-sm text-blue-700">
                  Please upload the final design file for {customerName}. They will be notified once the file is ready for download.
                </p>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <Button
            onClick={onOk}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-medium"
          >
            OK, I'll Upload the File
          </Button>

          <p className="text-xs text-gray-500 text-center">
            You can upload the file using the file upload section in the session panel.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
