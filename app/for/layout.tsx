import { MarketingAuthProvider } from "@/components/marketing/marketing-auth-provider";
import { MarketingShell } from "@/components/marketing/marketing-shell";

export default function ForLayout({ children }: { children: React.ReactNode }) {
  return (
    <MarketingAuthProvider>
      <MarketingShell>{children}</MarketingShell>
    </MarketingAuthProvider>
  );
}
