"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface ConfirmActionDialogProps {
  open: boolean;
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  danger?: boolean;
  requiredText?: string;
  requiredTextLabel?: string;
}

export function ConfirmActionDialog({
  open,
  title,
  description,
  onCancel,
  onConfirm,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isLoading = false,
  danger = false,
  requiredText,
  requiredTextLabel,
}: ConfirmActionDialogProps) {
  const [typedText, setTypedText] = useState("");

  useEffect(() => {
    if (!open) {
      setTypedText("");
    }
  }, [open]);

  const canConfirm = useMemo(() => {
    if (!requiredText) return true;
    return typedText === requiredText;
  }, [requiredText, typedText]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        aria-label="Close confirmation dialog"
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
      />
      <Card className="relative z-[81] w-full max-w-md rounded-[6px] p-5 sm:p-6 bg-white border border-border shadow-xl">
        <h3 className="text-lg font-bold tracking-tight">{title}</h3>
        <p className="text-sm text-muted-foreground mt-2">{description}</p>

        {requiredText && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-mono text-muted-foreground">
              {requiredTextLabel || `Type "${requiredText}" to confirm.`}
            </p>
            <Input
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
              placeholder={requiredText}
              className="h-9 font-mono text-sm"
              autoFocus
            />
          </div>
        )}

        <div className="mt-5 flex items-center justify-end gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="font-mono text-xs"
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading || !canConfirm}
            className={`font-mono text-xs ${
              danger ? "bg-red-600 hover:bg-red-700 text-white" : ""
            }`}
          >
            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : confirmLabel}
          </Button>
        </div>
      </Card>
    </div>
  );
}

