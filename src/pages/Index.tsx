
import React from 'react';
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to DesignHub</h1>
        <p className="text-xl text-muted-foreground mb-8">
          India's first real-time design collaboration platform
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild>
            <a href="/about">Learn More</a>
          </Button>
          <Button variant="outline">
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
