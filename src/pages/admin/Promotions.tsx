import React from "react";
import { AdminLayout } from "@/components/AdminLayout";
import PromotionsManager from "@/components/admin/PromotionsManager";

export default function AdminPromotions() {
  return (
    <AdminLayout>
      <div className="flex flex-1 flex-col gap-4 py-4 pr-4 pl-2 sm:pl-4">
        <div className="w-full">
          <PromotionsManager />
        </div>
      </div>
    </AdminLayout>
  );
}
