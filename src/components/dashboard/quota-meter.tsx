'use client';

import { Progress } from '@/components/ui/progress';

// Use static credits for no-auth mode
const maxCredits = 10;
const currentCredits = 10;
const percentage = (currentCredits / maxCredits) * 100;

export default function QuotaMeter() {
  // No loading state or profile fetch in no-auth mode
  return (
    <div className="w-full p-4 border rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium">Credits Remaining</h3>
        <span className="text-sm font-medium">
          {currentCredits}/{maxCredits}
        </span>
      </div>
      <Progress value={percentage} className="h-2" />
      <p className="text-xs text-muted-foreground mt-2">
        Each ad generation uses 1 credit
      </p>
    </div>
  );
}
