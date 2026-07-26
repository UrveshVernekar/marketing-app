"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/app/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  UploadCloud, 
  TrendingUp, 
  IndianRupee, 
  Tag, 
  Building, 
  Loader2 
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { DashboardTable, MarketingRecord } from "@/components/dashboard-table";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
};

const formatLargeCurrency = (value: number) => {
  const absValue = Math.abs(value);
  let formatted = "";
  if (absValue >= 10000000) { // 1 Crore = 10,000,000
    formatted = `${(value / 10000000).toFixed(2)} Cr.`;
  } else if (absValue >= 100000) { // 1 Lakh = 100,000
    formatted = `${(value / 100000).toFixed(2)} Lakh`;
  } else if (absValue >= 1000) { // 1 Thousand = 1,000
    formatted = `${(value / 1000).toFixed(2)} Th.`;
  } else {
    formatted = value.toFixed(2);
  }
  return `₹${formatted}`;
};

export default function MarketingDashboard() {
  const { user } = useAuth();

  // Table paging, filtering and sorting states
  const [data, setData] = useState<MarketingRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState("10");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" | null }>({
    key: "",
    direction: null,
  });

  // KPI states
  const [kpiData, setKpiData] = useState({
    total_sales_units: 0,
    total_revenue: 0,
    avg_price: 0,
    total_brands: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDatabaseEmpty, setIsDatabaseEmpty] = useState(false);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const queryParams: any = {
        page,
        limit: parseInt(pageSize),
        search: debouncedSearch || undefined,
        sort_by: sortConfig.key || undefined,
        sort_order: sortConfig.direction || undefined,
      };

      // Add column filters
      Object.entries(filters).forEach(([k, v]) => {
        if (v) {
          queryParams[k] = v;
        }
      });

      // Call API endpoints concurrently
      const [dataRes, kpiRes] = await Promise.all([
        api.get("/admin/marketing-data", { params: queryParams }),
        api.get("/admin/marketing-kpis", { params: queryParams }),
      ]);

      setData(dataRes.data.items);
      setTotalCount(dataRes.data.total_count);
      setKpiData(kpiRes.data);

      const hasFilters = debouncedSearch || Object.values(filters).some(Boolean);
      if (dataRes.data.total_count === 0 && !hasFilters) {
        setIsDatabaseEmpty(true);
      } else {
        setIsDatabaseEmpty(false);
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch marketing overview data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize, debouncedSearch, filters, sortConfig.key, sortConfig.direction]);

  if (loading && data.length === 0) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-50/70 dark:bg-zinc-950 p-4 md:p-6 lg:p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-muted-foreground text-sm font-medium">Loading marketing intelligence...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-red-100 bg-red-50/30 dark:border-red-900/40 dark:bg-red-950/10">
          <CardContent className="p-6 text-center space-y-4">
            <div className="text-red-500 text-3xl">⚠️</div>
            <h3 className="font-bold text-red-800 dark:text-red-400 text-lg">Error Loading Dashboard</h3>
            <p className="text-sm text-red-700 dark:text-red-400/80">{error}</p>
            <Button onClick={fetchData} className="w-full bg-red-600 hover:bg-red-700 text-white">
              Retry Connection
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50/70 dark:bg-zinc-950 p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Marketing Insights OS
            </h1>
            <p className="text-muted-foreground mt-1">
              Overview of sales performance, channel intelligence, and brand distribution metrics.
            </p>
          </div>
          {!isDatabaseEmpty && user?.role === "admin" && (
            <Link href="/admin" passHref>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm shrink-0">
                <UploadCloud className="w-4 h-4" />
                Upload Excel Data
              </Button>
            </Link>
          )}
        </div>

        {/* WELCOME / UPLOAD FIRST STATE */}
        {isDatabaseEmpty ? (
          <Card className="border border-blue-100 bg-blue-50/40 dark:border-blue-900/40 dark:bg-blue-950/10 shadow-sm overflow-hidden">
            <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-blue-900 dark:text-blue-300">
                  Welcome to Marketing OS
                </h3>
                <p className="text-sm text-blue-700/90 dark:text-blue-400/90 max-w-xl">
                  The database is currently empty. To get started and view marketing dashboard metrics, please import your Excel data sheets using the Admin Control panel.
                </p>
              </div>
              {user?.role === "admin" && (
                <Link href="/admin" passHref>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-md shrink-0">
                    <UploadCloud className="w-4 h-4" />
                    Upload Excel Data
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* KPI METRIC CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <Card className="shadow-sm border-border">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Sales Units</p>
                    <p className="text-2xl font-bold text-foreground">{kpiData.total_sales_units.toLocaleString()}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-border">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold text-foreground">{formatLargeCurrency(kpiData.total_revenue)}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <IndianRupee className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-border">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Average price</p>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(kpiData.avg_price)}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                    <Tag className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-border">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Market Brands</p>
                    <p className="text-2xl font-bold text-foreground">{kpiData.total_brands}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Building className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* DETAILED DATA TABLE */}
            <DashboardTable
              items={data}
              totalCount={totalCount}
              loading={loading}
              onRefresh={fetchData}
              page={page}
              setPage={setPage}
              pageSize={pageSize}
              setPageSize={setPageSize}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filters={filters}
              setFilters={setFilters}
              sortConfig={sortConfig}
              setSortConfig={setSortConfig}
            />
          </>
        )}
      </div>
    </div>
  );
}
