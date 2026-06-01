"use client";

import { useCallback, useState } from "react";
import {
  parseQuotaErrorFromApi,
  type QuotaLimitPresentation,
} from "@/lib/billing/quota-errors";

/**
 * Affiche une modale upgrade quand une API renvoie un code quota (403).
 * Retourne true si l’erreur a été gérée (ne pas afficher d’alert générique).
 */
export function useQuotaLimitDialog() {
  const [content, setContent] = useState<QuotaLimitPresentation | null>(null);

  const close = useCallback(() => setContent(null), []);

  const show = useCallback((presentation: QuotaLimitPresentation) => {
    setContent(presentation);
  }, []);

  const handleQuotaApiError = useCallback(
    (status: number, body: unknown): boolean => {
      const parsed = parseQuotaErrorFromApi(status, body);
      if (!parsed) return false;
      setContent(parsed);
      return true;
    },
    []
  );

  return {
    quotaDialogOpen: content !== null,
    quotaDialogContent: content,
    closeQuotaDialog: close,
    showQuotaLimit: show,
    handleQuotaApiError,
  };
}
