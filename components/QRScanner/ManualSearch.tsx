// app/components/ManualSearchComponent.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ManualSearchComponentProps {
  manualCode: string;
  setManualCode: (code: string) => void;
  onSearch: () => void;
  activeCode: string;
  scannedCode: string;
  showModal: boolean;
  onClearSearch: () => void;
}

export default function ManualSearchComponent({
  manualCode,
  setManualCode,
  onSearch,
  activeCode,
  scannedCode,
  showModal,
  onClearSearch
}: ManualSearchComponentProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="manual-code">Enter Ticket Code</Label>
        <div className="flex gap-2 mt-1">
          <Input
            id="manual-code"
            placeholder="e.g., ABC12345"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value.toUpperCase())}
            onKeyPress={(e) => e.key === 'Enter' && onSearch()}
            className="font-mono"
          />
          <Button 
            onClick={onSearch}
            disabled={!manualCode.trim()}
          >
            Search
          </Button>
        </div>
      </div>

      {activeCode && !showModal && (
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-600">
            {scannedCode ? 'Scanned Code:' : 'Searching for:'} 
            <span className="font-mono font-bold ml-1">{activeCode}</span>
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onClearSearch}
            className="mt-2"
          >
            Clear Search
          </Button>
        </div>
      )}
    </div>
  );
}
