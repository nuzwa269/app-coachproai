"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Coins } from "lucide-react";
import Link from "next/link";

interface OutOfCreditsModalProps {
  open: boolean;
  onClose: () => void;
}

export function OutOfCreditsModal({ open, onClose }: OutOfCreditsModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 mx-auto mb-2">
            <Coins className="h-6 w-6 text-brand-orange" />
          </div>
          <DialogTitle className="text-center">You&apos;ve used all your credits!</DialogTitle>
          <DialogDescription className="text-center">
            Purchase a credit pack to keep chatting with your AI development coach.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 pt-2">
          <Button asChild className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white">
            <Link href="/buy-credits" onClick={onClose}>
              Buy Credits
            </Link>
          </Button>
          <Button variant="outline" className="w-full" onClick={onClose}>
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
