"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSession, signOut } from "@/lib/auth-client";
import { StripedPattern } from "@/components/magicui/striped-pattern";
import {
  Users,
  Image,
  Wand2,
  Send,
  Loader2,
  LogOut,
  ArrowLeft,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  Search,
} from "lucide-react";
import Link from "next/link";

// Admin emails autorisés
const ADMIN_EMAILS = ["joey.montani@gmail.com"];

interface UserStats {
  total: number;
  standard: number;
  upscaled: number;
}

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  emailVerified: boolean;
  createdAt: string;
  stats: UserStats;
}

interface GlobalStats {
  totalUsers: number;
  totalRenders: number;
  totalStandard: number;
  totalUpscaled: number;
}

export default function AdminPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Vérifier si l'utilisateur est admin
  const isAdmin = session?.user?.email && ADMIN_EMAILS.includes(session.user.email);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/");
    } else if (!isPending && session && !isAdmin) {
      router.push("/");
    }
  }, [session, isPending, router, isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setIsInviting(true);
    setInviteMessage(null);

    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, name: inviteName }),
      });

      const data = await res.json();

      if (res.ok) {
        setInviteMessage({ type: "success", text: data.message });
        setInviteEmail("");
        setInviteName("");
      } else {
        setInviteMessage({ type: "error", text: data.error });
      }
    } catch {
      setInviteMessage({ type: "error", text: "Erreur lors de l'envoi" });
    } finally {
      setIsInviting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isPending || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <StripedPattern className="opacity-30" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/5 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="font-mono text-xs">
                <ArrowLeft className="w-4 h-4 mr-2" />
                BACK
              </Button>
            </Link>
            <span
              className="text-2xl font-bold tracking-tighter"
              style={{ fontFamily: "system-ui, -apple-system, sans-serif", letterSpacing: "-0.05em" }}
            >
              ADMIN
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="font-mono text-xs"
            onClick={async () => {
              await signOut();
              window.location.href = "/";
            }}
          >
            <LogOut className="w-3 h-3 mr-1" />
            SIGN OUT
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-6 pt-32 pb-16">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-6 bg-card/80 backdrop-blur-sm border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
                  <p className="text-xs text-muted-foreground font-mono">USERS</p>
                </div>
              </div>
            </Card>
            <Card className="p-6 bg-card/80 backdrop-blur-sm border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded">
                  <Image className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.totalRenders || 0}</p>
                  <p className="text-xs text-muted-foreground font-mono">RENDERS</p>
                </div>
              </div>
            </Card>
            <Card className="p-6 bg-card/80 backdrop-blur-sm border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 rounded">
                  <Image className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.totalStandard || 0}</p>
                  <p className="text-xs text-muted-foreground font-mono">STANDARD</p>
                </div>
              </div>
            </Card>
            <Card className="p-6 bg-card/80 backdrop-blur-sm border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded">
                  <Wand2 className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.totalUpscaled || 0}</p>
                  <p className="text-xs text-muted-foreground font-mono">4K UPSCALED</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Invite Section */}
          <Card className="p-6 bg-card/80 backdrop-blur-sm border-border">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Send className="w-5 h-5" />
              Invite User
            </h2>
            <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
              <Input
                type="text"
                placeholder="Name (optional)"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                className="sm:w-40 font-mono"
              />
              <Input
                type="email"
                placeholder="Email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                className="flex-1 font-mono"
              />
              <Button type="submit" disabled={isInviting} className="font-mono">
                {isInviting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    SEND INVITE
                  </>
                )}
              </Button>
            </form>
            {inviteMessage && (
              <p
                className={`mt-3 text-sm font-mono ${
                  inviteMessage.type === "success" ? "text-green-500" : "text-red-500"
                }`}
              >
                {inviteMessage.text}
              </p>
            )}
          </Card>

          {/* Users List */}
          <Card className="p-6 bg-card/80 backdrop-blur-sm border-border">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Users className="w-5 h-5" />
                Users ({filteredUsers.length})
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full sm:w-64 font-mono"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-xs font-mono text-muted-foreground">USER</th>
                    <th className="text-left py-3 px-2 text-xs font-mono text-muted-foreground">EMAIL</th>
                    <th className="text-center py-3 px-2 text-xs font-mono text-muted-foreground">VERIFIED</th>
                    <th className="text-center py-3 px-2 text-xs font-mono text-muted-foreground">STD</th>
                    <th className="text-center py-3 px-2 text-xs font-mono text-muted-foreground">4K</th>
                    <th className="text-center py-3 px-2 text-xs font-mono text-muted-foreground">TOTAL</th>
                    <th className="text-right py-3 px-2 text-xs font-mono text-muted-foreground">JOINED</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-3">
                          {user.image ? (
                            <img
                              src={user.image}
                              alt={user.name || "User"}
                              className="w-8 h-8 rounded-full object-cover bg-muted"
                              onError={(e) => {
                                // Fallback si l'image ne charge pas
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`w-8 h-8 rounded-full bg-muted flex items-center justify-center ${user.image ? 'hidden' : ''}`}>
                            <Users className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <span className="font-medium text-sm truncate max-w-[120px]">
                            {user.name || "—"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-sm font-mono text-muted-foreground truncate max-w-[200px] block">
                          {user.email}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        {user.emailVerified ? (
                          <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500 mx-auto" />
                        )}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className="text-sm font-mono text-yellow-500">{user.stats.standard}</span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className="text-sm font-mono text-green-500">{user.stats.upscaled}</span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className="text-sm font-mono">{user.stats.total}</span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span className="font-mono">{formatDate(user.createdAt)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="font-mono text-sm">No users found</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

