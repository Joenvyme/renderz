"use client";

import { useState } from "react";
import { X, ExternalLink, Check, X as XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRevenueCat } from "@/lib/hooks/use-revenuecat";
import { ENTITLEMENT_IDS } from "@/lib/revenuecat";

interface CustomerCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CustomerCenter({ isOpen, onClose }: CustomerCenterProps) {
  const { customerInfo, isPro, presentCustomerCenter, restorePurchases, isLoading } = useRevenueCat();
  const [restoring, setRestoring] = useState(false);

  if (!isOpen) return null;

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const result = await restorePurchases();
      if (result.success) {
        // Les infos seront mises à jour automatiquement via le hook
      }
    } catch (err) {
      console.error("Restore error:", err);
    } finally {
      setRestoring(false);
    }
  };

  const handleManageSubscription = () => {
    presentCustomerCenter();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto bg-background rounded-lg border shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Gestion de l'abonnement</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Statut de l'abonnement */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Statut de l'abonnement</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Plan actuel</span>
                <span className="font-semibold">
                  {isPro ? (
                    <span className="text-primary">PRO</span>
                  ) : (
                    <span className="text-muted-foreground">Gratuit</span>
                  )}
                </span>
              </div>
              {customerInfo?.entitlements?.[ENTITLEMENT_IDS.PRO] && (
                <>
                  {(() => {
                    const proEntitlement = customerInfo.entitlements[ENTITLEMENT_IDS.PRO];
                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Statut</span>
                          <span className="flex items-center gap-2">
                            {proEntitlement.isActive ? (
                              <>
                                <Check className="h-4 w-4 text-green-500" />
                                <span className="text-green-500">Actif</span>
                              </>
                            ) : (
                              <>
                                <XIcon className="h-4 w-4 text-red-500" />
                                <span className="text-red-500">Inactif</span>
                              </>
                            )}
                          </span>
                        </div>
                        {(() => {
                          const expirationDate = proEntitlement.expirationDate;
                          return expirationDate ? (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Expiration</span>
                              <span className="font-semibold">
                                {new Date(expirationDate).toLocaleDateString("fr-FR")}
                              </span>
                            </div>
                          ) : null;
                        })()}
                        {proEntitlement.willRenew && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Renouvellement</span>
                            <span className="text-sm">Automatique</span>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </>
              )}
            </div>
          </Card>

          {/* Produits achetés */}
          {customerInfo?.allPurchasedProductIdentifiers && customerInfo.allPurchasedProductIdentifiers.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Produits achetés</h3>
              <ul className="space-y-2">
                {customerInfo.allPurchasedProductIdentifiers.map((productId) => (
                  <li key={productId} className="text-sm">
                    {productId}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {customerInfo?.managementURL && (
              <Button
                className="w-full"
                onClick={handleManageSubscription}
                disabled={isLoading}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Gérer mon abonnement
              </Button>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={handleRestore}
              disabled={restoring || isLoading}
            >
              {restoring ? "Restauration..." : "Restaurer les achats"}
            </Button>
          </div>

          {/* Informations */}
          <div className="text-xs text-muted-foreground space-y-2">
            <p>
              Les abonnements se renouvellent automatiquement. Vous pouvez annuler à tout moment depuis la page de gestion.
            </p>
            <p>
              Si vous avez acheté sur un autre appareil, utilisez "Restaurer les achats" pour récupérer votre abonnement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


