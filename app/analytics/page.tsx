"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, TrendingUp, BarChart2, Activity } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

type TrendData = {
  year: number;
  month: number;
  formatted_date: string;
  total_consumption: number;
};

export default function AnalyticsPage() {
  const [data, setData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    let isMounted = true;
    const fetchTrendData = async () => {
      try {
        setLoading(true);
        const params = debouncedSearch ? { material_code: debouncedSearch } : {};
        const res = await axios.get(`${process.env.NEXT_PUBLIC_HOST_DEV}/analytics/monthly-trend`, {
          params,
        });

        if (isMounted) {
          setData(res.data.data);
          setError("");
        }
      } catch (err) {
        if (isMounted) {
          setError("Failed to fetch analytics data.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTrendData();
    return () => {
      isMounted = false;
    };
  }, [debouncedSearch]);

  const totalConsumption = data.reduce((acc, curr) => acc + curr.total_consumption, 0);
  const avgMonthly = data.length ? totalConsumption / data.length : 0;

  const currentMonth = data.length ? data[data.length - 1].total_consumption : 0;
  const previousMonth = data.length > 1 ? data[data.length - 2].total_consumption : 0;

  let momGrowth = 0;
  if (previousMonth > 0) {
    momGrowth = ((currentMonth - previousMonth) / previousMonth) * 100;
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 border border-border p-3 rounded-lg shadow-xl backdrop-blur-sm">
          <p className="font-medium text-sm mb-1">{label}</p>
          <p className="text-blue-600 font-bold">
            {payload[0].value.toLocaleString()} units
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50/50 dark:bg-[#0a0a0a] p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-[1400px] mx-auto space-y-8">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Consumption Analytics
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Track material consumption trends and seasonal behaviors
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search specific material code..."
              className="pl-10 h-10 bg-background/50 border-border/50 focus:bg-background transition-colors rounded-xl shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-3">
            <Activity className="w-5 h-5" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          <Card className="shadow-sm border-border/60 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                  <BarChart2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Total Tracked Period
                </div>
              </div>
              <div className="text-4xl font-bold tracking-tighter">
                {totalConsumption.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                Units consumed overall
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/60">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                  <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Avg Monthly Run Rate
                </div>
              </div>
              <div className="text-4xl font-bold tracking-tighter">
                {avgMonthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                Units per month average
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/60">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  MoM Growth (Latest)
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-4xl font-bold tracking-tighter">
                  {momGrowth > 0 ? "+" : ""}{momGrowth.toFixed(1)}%
                </div>
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                Compared to previous month
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CHARTS */}
        {loading ? (
          <div className="h-[400px] bg-muted/20 animate-pulse rounded-2xl border border-border/50 flex items-center justify-center">
            <div className="text-muted-foreground font-medium flex items-center gap-2">
              <Activity className="w-5 h-5 animate-spin" />
              Analyzing Trends...
            </div>
          </div>
        ) : data.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* AREA CHART */}
            <Card className="shadow-sm border-border/60 overflow-hidden">
              <CardHeader className="bg-muted/10 border-b border-border/30 pb-4">
                <CardTitle className="text-lg">Consumption Timeline</CardTitle>
                <CardDescription>Continuous trend over available months</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-[300px] w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorConsumption" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888830" />
                      <XAxis
                        dataKey="formatted_date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#888888' }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#888888' }}
                        tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
                      />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="total_consumption"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorConsumption)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* BAR CHART */}
            <Card className="shadow-sm border-border/60 overflow-hidden">
              <CardHeader className="bg-muted/10 border-b border-border/30 pb-4">
                <CardTitle className="text-lg">Monthly Volume Breakdown</CardTitle>
                <CardDescription>Absolute units consumed per month</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-[300px] w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888830" />
                      <XAxis
                        dataKey="formatted_date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#888888' }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#888888' }}
                        tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
                      />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="total_consumption"
                        fill="#6366f1"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={50}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="h-[400px] border border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-muted-foreground">
            <BarChart2 className="w-12 h-12 opacity-20 mb-4" />
            <h3 className="text-lg font-medium text-foreground">No data available</h3>
            <p className="text-sm mt-1">Try selecting a different material code or check your database.</p>
          </div>
        )}
      </div>
    </div>
  );
}
