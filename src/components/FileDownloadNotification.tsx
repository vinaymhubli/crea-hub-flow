import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, CheckCircle, Clock } from 'lucide-react';

interface FileDownloadNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionComplete: () => void;
  customerName: string;
  fileName: string;
  downloadTime: string;
}

export default function FileDownloadNotification({
  isOpen,
  onClose,
  onSessionComplete,
  customerName,
  fileName,
  downloadTime
}: FileDownloadNotificationProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Download className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            File Downloaded!
          </CardTitle>
          <p className="text-gray-600 mt-2">
            {customerName} has successfully downloaded your file.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Download Details */}
          <div className="bg-green-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-600">File:</span>
              </div>
              <span className="font-medium text-sm truncate ml-2">{fileName}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-600">Downloaded at:</span>
              </div>
              <span className="text-sm font-medium">{downloadTime}</span>
            </div>
          </div>

          {/* Success Message */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900 mb-1">Delivery Confirmed</p>
                <p className="text-sm text-blue-700">
                  Your design work has been successfully delivered to {customerName}. 
                  The customer will now be prompted to provide a rating and review.
                </p>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <Button
            onClick={onSessionComplete}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg font-medium"
          >
            Great! Session Complete
          </Button>

          <p className="text-xs text-gray-500 text-center">
            Thank you for providing excellent design services!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
