"use client";

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ChevronLeft, ChevronRight, AlertTriangle, Download, PackageX, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type AgingItem = {
  material_code: string;
  material_description: string;
  vendor: string;
  aging_qty: number;
  price: number;
  locked_capital: number;
  status: string;
};

type KPIs = {
  total_aging_items: number;
  total_aging_qty: number;
  total_locked_capital: number;
  obsolete_items: number;
};

export default function AgingPage() {
  const [allItems, setAllItems] = useState<AgingItem[]>([]);
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pageSize, setPageSize] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${process.env.NEXT_PUBLIC_HOST_DEV}/inventory/aging`);

        if (isMounted) {
          setKpis(res.data.kpis);
          setAllItems(res.data.items);
        }
      } catch (err) {
        console.error("Failed to fetch aging data");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, []);

  const filteredItems = useMemo(() => {
    if (!debouncedSearch) return allItems;
    const lower = debouncedSearch.toLowerCase();
    return allItems.filter((item) =>
      item.material_code?.toLowerCase().includes(lower) ||
      item.material_description?.toLowerCase().includes(lower) ||
      item.vendor?.toLowerCase().includes(lower)
    );
  }, [allItems, debouncedSearch]);

  const items = useMemo(() => {
    const size = Number(pageSize);
    const start = (currentPage - 1) * size;
    return filteredItems.slice(start, start + size);
  }, [filteredItems, currentPage, pageSize]);

  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / Number(pageSize));

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);

      const data = filteredItems.map((item: any) => ({
        "Material Code": item.material_code,
        "Description": item.material_description,
        "Vendor": item.vendor,
        "Aging Qty": item.aging_qty,
        "Unit Price (₹)": item.price,
        "Locked Capital (₹)": item.locked_capital,
        "Status": item.status,
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Aging Inventory");

      const dateStr = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `Aging_DeadStock_${dateStr}.xlsx`);
    } catch (err) {
      console.error("Export failed", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50/70 dark:bg-zinc-950 p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-[1680px] mx-auto space-y-6">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <PackageX className="w-8 h-8 text-red-500" />
              Dead Stock & Aging
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Materials aged {'>'} 120 days or marked as obsolete. Prioritize for liquidation.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" className="gap-2" onClick={handleExport} disabled={isExporting}>
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {isExporting ? "Exporting..." : "Export"}
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Locked Capital",
              value: `₹${(kpis?.total_locked_capital || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
              color: "text-red-600",
              icon: <AlertTriangle className="w-5 h-5 text-red-500" />
            },
            {
              label: "Total Aging Units",
              value: (kpis?.total_aging_qty || 0).toLocaleString(),
              color: "",
            },
            {
              label: "Total Unique Items",
              value: (kpis?.total_aging_items || 0).toLocaleString(),
              color: "",
            },
            {
              label: "Obsolete Items",
              value: (kpis?.obsolete_items || 0).toLocaleString(),
              color: "text-orange-600",
            },
          ].map((card, i) => (
            <Card key={i} className="shadow-sm border-border/60">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                    {card.label}
                  </div>
                  {card.icon}
                </div>
                <div className={cn("text-3xl font-bold tracking-tighter", card.color)}>
                  {card.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* TOOLBAR */}
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-100">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search material code, description, or vendor..."
              className="pl-10 h-10 bg-background shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* MAIN TABLE */}
        <Card className="shadow-sm border-border overflow-hidden">
          <div className="overflow-x-auto relative">
            {loading && items.length > 0 && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-20 flex items-center justify-center">
                <div className="animate-pulse font-medium text-red-600">Loading...</div>
              </div>
            )}
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="py-4">Material Code</TableHead>
                  <TableHead className="py-4">Description</TableHead>
                  <TableHead className="py-4">Vendor</TableHead>
                  <TableHead className="py-4 text-center">Status</TableHead>
                  <TableHead className="py-4 text-right">Aging Qty</TableHead>
                  <TableHead className="py-4 text-right">Unit Price</TableHead>
                  <TableHead className="py-4 text-right font-bold text-red-600 dark:text-red-400">Locked Capital</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 && !loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                      No aging materials found. Good job!
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.material_code} className="hover:bg-muted/50 group h-12">
                      <TableCell className="font-medium">{item.material_code}</TableCell>
                      <TableCell className="max-w-[300px] truncate text-muted-foreground" title={item.material_description}>
                        {item.material_description}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={item.vendor}>
                        {item.vendor || "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className={cn(
                          item.status === "Obsolete" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" : "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
                        )}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{item.aging_qty}</TableCell>
                      <TableCell className="text-right">₹{item.price?.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-bold text-red-600 dark:text-red-400">
                        ₹{item.locked_capital?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* FOOTER */}
          <div className="border-t bg-muted/40 px-6 py-3 flex flex-col md:flex-row gap-3 md:items-center md:justify-between text-sm">
            <div>
              Showing {totalItems === 0 ? 0 : (currentPage - 1) * Number(pageSize) + 1}
              {" - "}
              {Math.min(currentPage * Number(pageSize), totalItems)} of {totalItems}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Select value={pageSize} onValueChange={(val) => { setPageSize(val); setCurrentPage(1); }}>
                <SelectTrigger className="w-[110px] h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 / page</SelectItem>
                  <SelectItem value="50">50 / page</SelectItem>
                  <SelectItem value="100">100 / page</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-9 w-9" disabled={currentPage === 1 || loading} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="px-3 py-1 font-medium min-w-[3rem] text-center">{currentPage} / {totalPages || 1}</div>
                <Button variant="outline" size="icon" className="h-9 w-9" disabled={currentPage >= totalPages || loading} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
