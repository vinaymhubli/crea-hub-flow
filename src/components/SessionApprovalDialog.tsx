import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, DollarSign } from 'lucide-react';

interface SessionApprovalDialogProps {
  isOpen: boolean;
  onAccept: () => void;
  onContinue: () => void;
  designerName: string;
  sessionDuration: string;
  totalAmount: number;
}

export default function SessionApprovalDialog({
  isOpen,
  onAccept,
  onContinue,
  designerName,
  sessionDuration,
  totalAmount
}: SessionApprovalDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Session Complete Request
          </CardTitle>
          <p className="text-gray-600 mt-2">
            {designerName} has completed the design session and is requesting approval.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Session Summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Session Duration:</span>
              </div>
              <span className="font-medium">{sessionDuration}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Total Amount:</span>
              </div>
              <span className="font-bold text-lg text-green-600">${totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={onAccept}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg font-medium"
            >
              Accept & Pay
            </Button>
            
            <Button
              onClick={onContinue}
              variant="outline"
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 py-3 text-lg font-medium"
            >
              Continue Session
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            By accepting, you agree to pay the session amount and complete the transaction.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
