"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

interface LeaderboardUser {
    id: string
    username: string
    profileImage?: string
    totalKarma: number
    dailyKarma?: number
}

export default function LeaderboardPage() {
    const router = useRouter()
    const [dailyLeaderboard, setDailyLeaderboard] = useState<LeaderboardUser[]>([])
    const [totalLeaderboard, setTotalLeaderboard] = useState<LeaderboardUser[]>([])
    const [loading, setLoading] = useState(true)

    const getAuthHeaders = () => {
        const token = localStorage.getItem("accessToken")
        return {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        }
    }

    const fetchLeaderboard = async () => {
        try {
            setLoading(true)

            const [dailyRes, totalRes] = await Promise.all([
                fetch(`/api/leaderboard/daily`,
                    {
                        headers: getAuthHeaders()
                    }),
                fetch(`/api/leaderboard/total`,
                    {
                        headers: getAuthHeaders()
                    }),
            ]);

            if (dailyRes.status === 401 || totalRes.status === 401) {
                router.push("/auth")
                return
            }

            if (!dailyRes.ok || !totalRes.ok) {
                toast.error("Failed to fetch leaderboard")
                return
            }

            const dailyData = await dailyRes.json()
            const totalData = await totalRes.json()

            console.log("Daily Leaderboard: ", dailyData);
            console.log("Total Leaderboard: ", totalData);

            setDailyLeaderboard(dailyData.leaderboard || [])
            setTotalLeaderboard(totalData.leaderboard || [])
        } catch (err) {
            console.error(err)
            toast.error("Error fetching leaderboard")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLeaderboard()
    }, [])

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    const renderList = (users: LeaderboardUser[], type: "daily" | "total") => (
        <div className="space-y-4">
            {users.length === 0 ? (
                <Card>
                    <CardContent className="text-center py-12 text-gray-600">
                        No data yet.
                    </CardContent>
                </Card>
            ) : (
                users.map((user, idx) => (
                    <Card key={user.id}>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                                        {user.username[0]?.toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-medium">{user.username}</p>
                                        <p className="text-xs text-gray-500">
                                            Rank #{idx + 1}
                                        </p>
                                    </div>
                                </div>
                                <div className="font-semibold text-blue-600">
                                    {type === "daily" ? user.dailyKarma ?? 0 : user.totalKarma} pts
                                </div>
                            </div>
                        </CardHeader>
                    </Card>
                ))
            )}
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50 px-4 py-6 max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Leaderboard</h1>
            <Tabs defaultValue="daily">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="daily">Daily</TabsTrigger>
                    <TabsTrigger value="total">Total</TabsTrigger>
                </TabsList>
                <TabsContent value="daily">{renderList(dailyLeaderboard, "daily")}</TabsContent>
                <TabsContent value="total">{renderList(totalLeaderboard, "total")}</TabsContent>
            </Tabs>
            <div className="flex justify-center mt-6">
                <Button onClick={fetchLeaderboard}>Refresh</Button>
            </div>
        </div>
    )
}
