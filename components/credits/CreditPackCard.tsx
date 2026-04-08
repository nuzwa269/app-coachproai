import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, Zap } from "lucide-react";

interface CreditPackCardProps {
  id: string;
  name: string;
  credits: number;
  price_pkr: number;
  isPopular?: boolean;
  onSelect: (id: string) => void;
}

export function CreditPackCard({
  id,
  name,
  credits,
  price_pkr,
  isPopular,
  onSelect,
}: CreditPackCardProps) {
  return (
    <Card
      className={`relative flex flex-col ${
        isPopular
          ? "border-brand-orange ring-2 ring-brand-orange/30"
          : "border-gray-200"
      }`}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-orange px-3 py-0.5 text-xs font-semibold text-white">
            <Zap className="h-3 w-3" />
            Most Popular
          </span>
        </div>
      )}
      <CardHeader className="pb-2 pt-6">
        <CardTitle className="text-base font-semibold text-[#111827]">
          {name}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 flex-1">
        <div className="flex items-end gap-1">
          <span className="text-3xl font-bold text-[#111827]">
            Rs.{price_pkr.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Coins className="h-4 w-4 text-brand-orange" />
          <span>
            <span className="font-semibold text-[#111827]">{credits}</span> AI credits
          </span>
        </div>
        <p className="text-xs text-gray-400">
          Rs.{(price_pkr / credits).toFixed(1)} per credit
        </p>
        <Button
          className="mt-auto w-full bg-brand-orange hover:bg-brand-orange/90 text-white"
          onClick={() => onSelect(id)}
        >
          Buy Now
        </Button>
      </CardContent>
    </Card>
  );
}
