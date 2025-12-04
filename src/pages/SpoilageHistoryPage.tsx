import React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';

function SpoilageHistoryPage() {
  return (
    <>
      {/* Header Section */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-8 py-6 flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Spoilage History</h1>
            <p className="text-muted-foreground mt-1">View your spoilage history.</p>
          </div>
        </div>
      </div>
      <div className="p-8">
        <p className="text-muted-foreground">This page will display spoilage history.</p>
      </div>
    </>
  );
}

export default SpoilageHistoryPage;
