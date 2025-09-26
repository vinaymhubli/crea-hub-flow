import React from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import FeaturedDesignersManager from '@/components/admin/FeaturedDesignersManager';

export default function AdminFeaturedDesigners() {
  return (
    <AdminLayout>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Featured Designers</h1>
            <p className="text-muted-foreground">
              Manage the top 10 designers shown on the homepage
            </p>
          </div>
        </div>
        
        <FeaturedDesignersManager />
      </div>
    </AdminLayout>
  );
}
