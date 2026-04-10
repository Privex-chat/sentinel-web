/* app/targets/[userId]/profile/page.tsx */
"use client"

import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { EmptyState } from "@/components/ui/empty-state"
import { useApi } from "@/lib/hooks"
import { api } from "@/lib/api"
import { useSentinel } from "@/lib/context"
import { formatDateTime, formatDate, getAvatarUrl } from "@/lib/utils"
import { User, Image, Link as LinkIcon, ArrowRight } from "lucide-react"

export default function ProfilePage() {
  const params = useParams()
  const userId = params.userId as string
  const { settings } = useSentinel()

  const { data, loading, error } = useApi(
    () => api.getProfileHistory(userId),
    [userId, settings.sentinelToken],
    !!settings.sentinelToken
  )

  if (loading) return <Spinner />
  if (error) return <EmptyState icon={User} title="Error" message={error} />
  if (!data || data.length === 0) return <EmptyState icon={User} message="No profile history" />

  const currentProfile = data[0]

  return (
    <div className="space-y-6">
      {/* Avatar gallery */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Image className="h-4 w-4" />
            Avatar History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {data.filter((snap) => snap.avatar_hash).slice(0, 20).map((snap, i) => (
              <div key={i} className="text-center">
                <img
                  src={getAvatarUrl(userId, snap.avatar_hash, 128)}
                  alt=""
                  className="h-14 w-14 rounded-full border-2 object-cover"
                />
                <p className="mt-1 text-[9px] text-muted-foreground">
                  {formatDate(snap.timestamp)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Profile changes timeline */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4" />
            Profile Changes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
          {data.map((snap, i) => {
            const prev = data[i + 1]
            const changes: string[] = []
            
            if (prev) {
              if (prev.username !== snap.username) {
                changes.push(`Username: ${prev.username || "none"} -> ${snap.username || "none"}`)
              }
              if (prev.global_name !== snap.global_name) {
                changes.push(`Display: ${prev.global_name || "none"} -> ${snap.global_name || "none"}`)
              }
              if (prev.avatar_hash !== snap.avatar_hash) {
                changes.push("Avatar changed")
              }
              if (prev.banner_hash !== snap.banner_hash) {
                changes.push("Banner changed")
              }
              if (prev.bio !== snap.bio) {
                changes.push(`Bio: "${(prev.bio || "").slice(0, 30)}..." -> "${(snap.bio || "").slice(0, 30)}..."`)
              }
              if (prev.pronouns !== snap.pronouns) {
                changes.push(`Pronouns: ${prev.pronouns || "none"} -> ${snap.pronouns || "none"}`)
              }
            }

            if (changes.length === 0 && i > 0) return null

            return (
              <div key={i} className="flex gap-3 rounded-lg bg-secondary/50 px-3 py-2">
                <div className="h-full w-0.5 self-stretch rounded-full bg-chart-4 min-h-[40px]" />
                <div className="flex-1 min-w-0">
                  {i === data.length - 1 ? (
                    <p className="text-xs text-muted-foreground">Initial snapshot</p>
                  ) : (
                    changes.map((c, j) => (
                      <p key={j} className="text-sm mb-1">{c}</p>
                    ))
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground flex-shrink-0">
                  {formatDateTime(snap.timestamp)}
                </span>
              </div>
            )
          }).filter(Boolean)}
        </CardContent>
      </Card>

      {/* Connected accounts */}
      {currentProfile?.connected_accounts && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <LinkIcon className="h-4 w-4" />
              Connected Accounts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              try {
                const accounts = JSON.parse(currentProfile.connected_accounts)
                if (!accounts || accounts.length === 0) {
                  return <p className="text-sm text-muted-foreground">No connected accounts</p>
                }
                return (
                  <div className="space-y-2">
                    {accounts.map((acc: { type: string; name: string; verified?: boolean }, i: number) => (
                      <div key={i} className="flex items-center gap-3 rounded-lg bg-secondary/50 px-3 py-2">
                        <Badge variant="default">{acc.type}</Badge>
                        <span className="text-sm">{acc.name}</span>
                        {acc.verified && (
                          <span className="text-[10px] text-status-online">verified</span>
                        )}
                      </div>
                    ))}
                  </div>
                )
              } catch {
                return <p className="text-sm text-muted-foreground">Unable to parse connected accounts</p>
              }
            })()}
          </CardContent>
        </Card>
      )}

      {/* Current profile info */}
      {currentProfile && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Current Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Username</p>
                <p className="font-medium">{currentProfile.username || "-"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Display Name</p>
                <p className="font-medium">{currentProfile.global_name || "-"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Pronouns</p>
                <p className="font-medium">{currentProfile.pronouns || "-"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Last Updated</p>
                <p className="font-medium">{formatDateTime(currentProfile.timestamp)}</p>
              </div>
              {currentProfile.bio && (
                <div className="sm:col-span-2">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Bio</p>
                  <p className="whitespace-pre-wrap text-sm">{currentProfile.bio}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
