import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Activity, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface DashboardStats {
  totalUsers: number;
  activeSessions: number;
  totalEvents: number;
}

export default function DashboardPage() {
  // Fetch dashboard stats
  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      console.log('[Dashboard] Fetching stats...');
      // In development, return mock data
      if (process.env.NODE_ENV === 'development') {
        console.log('[Dashboard] Using mock stats');
        return {
          totalUsers: 1234,
          activeSessions: 123,
          totalEvents: 456,
        };
      }

      const response = await fetch('/api/admin/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }
      return response.json();
    },
  });

  if (isLoading) {
    console.log('[Dashboard] Loading stats...');
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  <div className="h-4 bg-muted rounded w-24" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16" />
                <div className="h-4 bg-muted rounded w-32 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    console.error('[Dashboard] Error loading stats:', error);
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="text-red-500">
          Error loading dashboard stats. Please try again later.
        </div>
      </div>
    );
  }

  const dashboardStats = [
    {
      title: "Total Users",
      value: stats?.totalUsers.toLocaleString() ?? '0',
      icon: Users,
      description: "Active users in the platform",
    },
    {
      title: "Active Sessions",
      value: stats?.activeSessions.toLocaleString() ?? '0',
      icon: Activity,
      description: "Current active sessions",
    },
    {
      title: "Total Events",
      value: stats?.totalEvents.toLocaleString() ?? '0',
      icon: Calendar,
      description: "Events this month",
    },
  ];

  console.log('[Dashboard] Rendering stats:', stats);
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {dashboardStats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
