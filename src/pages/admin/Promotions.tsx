import React from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import PromotionsManager from '@/components/admin/PromotionsManager';

export default function AdminPromotions() {
  return (
    <AdminLayout>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Promotions & Offers</h1>
            <p className="text-muted-foreground">
              Manage website promotions, offers, and announcements
            </p>
          </div>
        </div>
        
        <PromotionsManager />
      </div>
    </AdminLayout>
  );
}
