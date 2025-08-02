// app/components/ScanningActivityFeed.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  User,
  Zap,
  BarChart3,
  TrendingUp,
  RefreshCw
} from "lucide-react";
import { useTickets } from "@/hooks/useTickets";
import type { Ticket } from "@/lib/types/tickets";

interface ActivityItem {
  id: string;
  type: 'scan' | 'manual' | 'update';
  ticket: Ticket;
  timestamp: Date;
  status: 'used' | 'already_used' | 'error';
  message: string;
}

export default function ScanningActivityFeed() {
  const { data: tickets = [], refetch } = useTickets();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Generate activity feed from recent ticket updates
  useEffect(() => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));
    
    const recentActivities: ActivityItem[] = tickets
      .filter(ticket => {
        if (!ticket.usedAt) return false;
        const usedTime = new Date(ticket.usedAt);
        return usedTime > oneHourAgo;
      })
      .map(ticket => ({
        id: `${ticket.id}-${ticket.usedAt}`,
        type: 'scan' as const,
        ticket,
        timestamp: new Date(ticket.usedAt!),
        status: 'used' as const,
        message: `Ticket ${ticket.code} scanned and marked as used`
      }))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 20); // Show last 20 activities

    setActivities(recentActivities);
    setLastUpdate(new Date());
  }, [tickets]);

  const usedTickets = tickets.filter(t => t.used);
  const unusedTickets = tickets.filter(t => !t.used);
  const usageRate = tickets.length > 0 ? (usedTickets.length / tickets.length) * 100 : 0;

  // Recent activity (last 10 minutes)
  const recentActivityCount = activities.filter(activity => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    return activity.timestamp > tenMinutesAgo;
  }).length;

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{usedTickets.length}</p>
                <p className="text-sm text-gray-600">Used Tickets</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Clock className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-600">{unusedTickets.length}</p>
                <p className="text-sm text-gray-600">Unused Tickets</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{usageRate.toFixed(1)}%</p>
                <p className="text-sm text-gray-600">Usage Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Activity className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{recentActivityCount}</p>
                <p className="text-sm text-gray-600">Recent Activity</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Scanning Activity
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </span>
              <Button 
                onClick={() => refetch()} 
                variant="outline" 
                size="sm"
                className="gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Activity className="w-8 h-8 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No recent activity</p>
              <p className="text-sm">Scanned tickets will appear here</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {activities.map((activity, index) => (
                <div 
                  key={activity.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    index === 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {activity.status === 'used' ? (
                      <div className="p-1 bg-green-100 rounded-full">
                        <Zap className="w-3 h-3 text-green-600" />
                      </div>
                    ) : activity.status === 'already_used' ? (
                      <div className="p-1 bg-yellow-100 rounded-full">
                        <AlertCircle className="w-3 h-3 text-yellow-600" />
                      </div>
                    ) : (
                      <div className="p-1 bg-red-100 rounded-full">
                        <AlertCircle className="w-3 h-3 text-red-600" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm text-gray-900">
                        {activity.ticket.name} {activity.ticket.surname}
                      </p>
                      <Badge 
                        variant="outline" 
                        className="text-xs font-mono"
                      >
                        {activity.ticket.code}
                      </Badge>
                      {index === 0 && (
                        <Badge 
                          variant="default" 
                          className="text-xs bg-green-600"
                        >
                          Latest
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-600 mb-1">
                      {activity.ticket.event?.name || 'No Event'}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        {activity.message}
                      </p>
                      <span className="text-xs text-gray-400">
                        {activity.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Usage Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Usage Progress Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Ticket Usage</span>
                <span>{usedTickets.length} of {tickets.length} used</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${usageRate}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{usageRate.toFixed(1)}% completion rate</p>
            </div>

            {/* Time-based Stats */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm font-medium text-gray-700">Last Hour</p>
                <p className="text-lg font-bold text-blue-600">
                  {activities.filter(a => {
                    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
                    return a.timestamp > oneHourAgo;
                  }).length}
                </p>
                <p className="text-xs text-gray-500">tickets scanned</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700">Last 10 Min</p>
                <p className="text-lg font-bold text-purple-600">{recentActivityCount}</p>
                <p className="text-xs text-gray-500">tickets scanned</p>
              </div>
            </div>

            {/* Event Breakdown */}
            {tickets.length > 0 && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-gray-700 mb-3">Events Overview</p>
                <div className="space-y-2">
                  {Array.from(new Set(tickets.map(t => t.event?.name || 'No Event')))
                    .map(eventName => {
                      const eventTickets = tickets.filter(t => 
                        (t.event?.name || 'No Event') === eventName
                      );
                      const eventUsed = eventTickets.filter(t => t.used).length;
                      const eventRate = eventTickets.length > 0 
                        ? (eventUsed / eventTickets.length) * 100 
                        : 0;

                      return (
                        <div key={eventName} className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 truncate">
                            {eventName}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              {eventUsed}/{eventTickets.length}
                            </span>
                            <div className="w-16 bg-gray-200 rounded-full h-1">
                              <div 
                                className="bg-green-600 h-1 rounded-full"
                                style={{ width: `${eventRate}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}