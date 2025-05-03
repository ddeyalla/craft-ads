'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/dashboard/header";
import AdGenerator from "@/components/dashboard/ad-generator";
import AdLibrary from "@/components/dashboard/ad-library";
import { toast } from "sonner";

export default function DashboardPage() {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Fixed top nav */}
      <div className="sticky top-0 bg-background w-full">
        <div className="px-6 py-3">
          <Header title="Static ad generations" />
        </div>
      </div>
      
      <div className="flex flex-1 h-[calc(100vh-72px)]">
        {/* Main (scrollable) gallery section */}
        <div className="flex-1 overflow-y-auto px-6 py-">
          <Tabs defaultValue="today">
            <div className="flex items-center justify-between mb-3 w-full">
              <h2 className="text-lg font-medium">Gallery</h2>
              <TabsList className="ml-auto">
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
        {/* Fixed ad form on the right */}
        <div className="hidden lg:block lg:w-[380px] shrink-0 border-l bg-background px-6 py-1.5 overflow-y-auto max-h-full">
          <AdGenerator onSuccess={() => {
            toast.success("Ad created successfully", {
              description: "Your ad has been generated and saved to the library.",
            });
          }} />
        </div>
      </div>
    </div>
  );
}
