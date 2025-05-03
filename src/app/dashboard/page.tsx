'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/dashboard/header";
import AdGenerator from "@/components/dashboard/ad-generator";
import AdLibrary from "@/components/dashboard/ad-library";
import { toast } from "sonner";

export default function DashboardPage() {
  return (
    <div className="p-6 h-full">
      <Header title="Static ad generations" />
      
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <h2 className="text-lg font-medium mb-4">Gallery</h2>
          <Tabs defaultValue="today">
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="today">Today</TabsTrigger>
                <TabsTrigger value="previous">Previous</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="today">
              <AdLibrary />
            </TabsContent>
            <TabsContent value="previous">
              <div className="text-center py-8 text-muted-foreground">
                No previous ads found
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="lg:w-[380px] shrink-0">
          <AdGenerator onSuccess={() => {
            // Show a notification when an ad is created
            toast.success("Ad created successfully", {
              description: "Your ad has been generated and saved to the library.",
            });
          }} />
        </div>
      </div>
    </div>
  );
}
