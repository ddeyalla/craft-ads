'use client';

import { Button } from "@/components/ui/button";
import { useState } from "react";
import AddProductModal from "@/components/products/AddProductModal";
import { Header } from "@/components/dashboard/header";
import { Separator } from "@/components/ui/separator";
import { PlusCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProductsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Mock products (this would come from the database in a real implementation)
  const [products, setProducts] = useState<any[]>([]);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Fixed top nav */}
      <div className="sticky top-0 bg-background w-full z-10">
        <div className="h-14">
          <Header title="Products" />
        </div>
      </div>
      
      {/* Main content area */}
      <div className="flex flex-1 h-[calc(100vh-56px)]">
        {/* Main scrollable content */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Your Products</h2>
              <p className="text-muted-foreground mt-1">
                Manage products for your ad campaigns
              </p>
            </div>
            <Button className="gap-2" onClick={() => setIsModalOpen(true)}>
              <PlusCircle className="h-4 w-4" />
              Add Product
            </Button>
          </div>
          
          <Separator className="my-6" />
          
          {/* Product grid */}
          {products.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <EmptyState onAdd={() => setIsModalOpen(true)} />
          )}
        </div>
      </div>
      
      {/* Add Product Modal */}
      <AddProductModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

// Empty state component
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12">
      <div className="rounded-full bg-primary/10 p-4 mb-4">
        <PlusCircle className="h-10 w-10 text-primary" />
      </div>
      <h3 className="text-xl font-medium mb-2">No products yet</h3>
      <p className="text-muted-foreground max-w-md mb-6">
        Products are used to create and manage ad campaigns. Add your first product to get started.
      </p>
      <Button onClick={onAdd} className="gap-2">
        <PlusCircle className="h-4 w-4" />
        Add Your First Product
      </Button>
    </div>
  );
}

// Product card component
function ProductCard({ product }: { product: any }) {
  return (
    <Card className="overflow-hidden">
      {product.images && product.images.length > 0 && (
        <div className="aspect-video relative bg-muted overflow-hidden">
          <img 
            src={product.images[0].url} 
            alt={product.name}
            className="object-cover w-full h-full"
          />
        </div>
      )}
      <CardHeader className="p-4">
        <CardTitle className="line-clamp-1">{product.name}</CardTitle>
        <CardDescription className="line-clamp-2">{product.description}</CardDescription>
      </CardHeader>
      <CardFooter className="p-4 pt-0 flex justify-between">
        <Button variant="outline" size="sm">View Details</Button>
        <Button variant="secondary" size="sm">Create Ad</Button>
      </CardFooter>
    </Card>
  );
}
