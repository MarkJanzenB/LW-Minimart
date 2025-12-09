import React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { RefreshCw } from 'lucide-react';

function RestockHistoryPage() {
  return (
    <>
      {/* Header Section */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-8 py-6 flex items-center gap-4">
          <SidebarTrigger />
          <RefreshCw className="w-5 h-5 text-foreground" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Restock History</h1>
            <p className="text-muted-foreground mt-1">View your restock history.</p>
          </div>
        </div>
      </div>
      <div className="p-8">
        <p className="text-muted-foreground">This page will display restock history.</p>
      </div>
    </>
  );
}

export default RestockHistoryPage;
