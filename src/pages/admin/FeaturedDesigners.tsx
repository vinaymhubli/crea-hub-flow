import React from "react";
import { AdminLayout } from "@/components/AdminLayout";
import FeaturedDesignersManager from "@/components/admin/FeaturedDesignersManager";

export default function AdminFeaturedDesigners() {
  return (
    // <AdminLayout>
      <div className="w-full flex flex-1 flex-col gap-4 p-4">
        <FeaturedDesignersManager />
      </div>
    // </AdminLayout>
  );
}
