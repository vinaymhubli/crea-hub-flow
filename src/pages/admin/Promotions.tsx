import React from "react";
import { AdminLayout } from "@/components/AdminLayout";
import PromotionsManager from "@/components/admin/PromotionsManager";

export default function AdminPromotions() {
  return (
    <AdminLayout>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <PromotionsManager />
      </div>
    </AdminLayout>
  );
}
