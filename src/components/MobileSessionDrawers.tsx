import React, { useState } from 'react';
import { MessageCircle, FileText, CreditCard, Star, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';
import SessionSidePanel from './SessionSidePanel';

interface MobileSessionDrawersProps {
  sessionId: string;
  designerName: string;
  customerName: string;
  isDesigner: boolean;
  duration: number;
  rate: number;
  balance: number;
  onPauseSession: () => void;
  onResumeSession: () => void;
  isPaused: boolean;
  bookingId?: string;
  userId?: string;
  onRateChange?: (newRate: number) => void;
  onMultiplierChange?: (newMultiplier: number) => void;
  formatMultiplier?: number;
}

export function MobileSessionDrawers(props: MobileSessionDrawersProps) {
  const [openDrawer, setOpenDrawer] = useState<string | null>(null);

  const drawers = [
    {
      id: 'chat',
      icon: MessageCircle,
      label: 'Chat',
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      id: 'files',
      icon: FileText,
      label: 'Files',
      color: 'bg-green-600 hover:bg-green-700',
    },
    {
      id: 'billing',
      icon: CreditCard,
      label: 'Billing',
      color: 'bg-purple-600 hover:bg-purple-700',
    },
    {
      id: 'reviews',
      icon: Star,
      label: 'Reviews',
      color: 'bg-yellow-600 hover:bg-yellow-700',
    },
    {
      id: 'invoices',
      icon: Receipt,
      label: 'Invoices',
      color: 'bg-red-600 hover:bg-red-700',
    },
  ];

  return (
    <>
      {/* Floating Action Buttons - Mobile/Tablet Only */}
      <div className="xl:hidden fixed right-4 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-3">
        {drawers.map((drawer) => (
          <Button
            key={drawer.id}
            size="icon"
            className={`w-12 h-12 rounded-full shadow-lg ${drawer.color} text-white border-2 border-white/20`}
            onClick={() => setOpenDrawer(drawer.id)}
          >
            <drawer.icon className="h-5 w-5" />
          </Button>
        ))}
      </div>

      {/* Chat Drawer */}
      <Drawer open={openDrawer === 'chat'} onOpenChange={(open) => !open && setOpenDrawer(null)}>
        <DrawerContent className="h-[80vh]">
          <DrawerHeader>
            <DrawerTitle>Chat</DrawerTitle>
            <DrawerClose />
          </DrawerHeader>
          <div className="flex-1 overflow-hidden p-4">
            <ChatSection {...props} />
          </div>
        </DrawerContent>
      </Drawer>

      {/* Files Drawer */}
      <Drawer open={openDrawer === 'files'} onOpenChange={(open) => !open && setOpenDrawer(null)}>
        <DrawerContent className="h-[80vh]">
          <DrawerHeader>
            <DrawerTitle>Files</DrawerTitle>
            <DrawerClose />
          </DrawerHeader>
          <div className="flex-1 overflow-hidden p-4">
            <FilesSection {...props} />
          </div>
        </DrawerContent>
      </Drawer>

      {/* Billing Drawer */}
      <Drawer open={openDrawer === 'billing'} onOpenChange={(open) => !open && setOpenDrawer(null)}>
        <DrawerContent className="h-[80vh]">
          <DrawerHeader>
            <DrawerTitle>Billing</DrawerTitle>
            <DrawerClose />
          </DrawerHeader>
          <div className="flex-1 overflow-hidden p-4">
            <BillingSection {...props} />
          </div>
        </DrawerContent>
      </Drawer>

      {/* Reviews Drawer */}
      <Drawer open={openDrawer === 'reviews'} onOpenChange={(open) => !open && setOpenDrawer(null)}>
        <DrawerContent className="h-[80vh]">
          <DrawerHeader>
            <DrawerTitle>Work Reviews</DrawerTitle>
            <DrawerClose />
          </DrawerHeader>
          <div className="flex-1 overflow-hidden p-4">
            <ReviewsSection {...props} />
          </div>
        </DrawerContent>
      </Drawer>

      {/* Invoices Drawer */}
      <Drawer open={openDrawer === 'invoices'} onOpenChange={(open) => !open && setOpenDrawer(null)}>
        <DrawerContent className="h-[80vh]">
          <DrawerHeader>
            <DrawerTitle>Invoices</DrawerTitle>
            <DrawerClose />
          </DrawerHeader>
          <div className="flex-1 overflow-hidden p-4">
            <InvoicesSection {...props} />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

// These components reuse the existing SessionSidePanel with specific tab focus
function ChatSection(props: MobileSessionDrawersProps) {
  return (
    <div className="h-full">
      <SessionSidePanel 
        {...props} 
        defaultTab="chat"
        mobileMode={true}
      />
    </div>
  );
}

function FilesSection(props: MobileSessionDrawersProps) {
  return (
    <div className="h-full">
      <SessionSidePanel 
        {...props} 
        defaultTab="files"
        mobileMode={true}
      />
    </div>
  );
}

function BillingSection(props: MobileSessionDrawersProps) {
  return (
    <div className="h-full">
      <SessionSidePanel 
        {...props} 
        defaultTab="billing"
        mobileMode={true}
      />
    </div>
  );
}

function ReviewsSection(props: MobileSessionDrawersProps) {
  return (
    <div className="h-full">
      <SessionSidePanel 
        {...props} 
        defaultTab="review"
        mobileMode={true}
      />
    </div>
  );
}

function InvoicesSection(props: MobileSessionDrawersProps) {
  return (
    <div className="h-full">
      <SessionSidePanel 
        {...props} 
        defaultTab="invoice"
        mobileMode={true}
      />
    </div>
  );
}