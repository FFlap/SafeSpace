import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ThreadSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function ThreadSearch({ value, onChange }: ThreadSearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Search threads..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-400"
      />
    </div>
  );
}
