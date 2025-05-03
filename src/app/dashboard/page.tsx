'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import AdGenerator from '@/components/dashboard/ad-generator';
import AdLibrary from '@/components/dashboard/ad-library';
import QuotaMeter from '@/components/dashboard/quota-meter';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('generator');
  
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Ad Workspace</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage your social media ads
          </p>
        </div>
        
        <div className="w-full md:w-64">
          <QuotaMeter />
        </div>
      </div>
      
      <Tabs defaultValue="generator" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="generator">Generator</TabsTrigger>
          <TabsTrigger value="library">Library</TabsTrigger>
        </TabsList>
        
        <TabsContent value="generator" className="mt-6">
          <AdGenerator onSuccess={() => setActiveTab('library')} />
        </TabsContent>
        
        <TabsContent value="library" className="mt-6">
          <AdLibrary />
        </TabsContent>
      </Tabs>
    </div>
  );
}
