"use client";

import { useState, useEffect, useMemo } from "react";
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
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Filter,
  X,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface MarketingRecord {
  marketing_id: number;
  sp_cell: string;
  city: string | null;
  month: number;
  year: number;
  state: string | null;
  brand: string | null;
  item: string | null;
  drying_function: string | null;
  loading: string | null;
  capacity: number | null;
  steam_funct_int: string | null;
  first_activity: string | null;
  sales_units: number;
  sales_value: number;
  price: number;
  motor_type: string | null;
  steam_function: string | null;
  created_at: string;
  updated_at: string;
}

interface DashboardTableProps {
  allItems: MarketingRecord[];
  loading: boolean;
  onRefresh?: () => void;
}

const getMonthName = (m: number) => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months[m - 1] || "";
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
};

export function DashboardTable({
  allItems,
  loading,
  onRefresh,
}: DashboardTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pageSize, setPageSize] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc" | null;
  }>({
    key: "",
    direction: null,
  });

  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    sp_cell: 120,
    brand: 110,
    item: 140,
    period: 95,
    state: 110,
    city: 110,
    sales_units: 100,
    sales_value: 125,
    price: 105,
    capacity: 100,
    motor_type: 110,
    steam_function: 125,
  });

  const toggleableColumns = useMemo(
    () => [
      { id: "sp_cell", label: "Channel" },
      { id: "brand", label: "Brand" },
      { id: "item", label: "Item Model" },
      { id: "period", label: "Period" },
      { id: "state", label: "State" },
      { id: "city", label: "City" },
      { id: "sales_units", label: "Sales Units" },
      { id: "sales_value", label: "Sales Value" },
      { id: "price", label: "Unit Price" },
      { id: "capacity", label: "Capacity" },
      { id: "motor_type", label: "Motor Type" },
      { id: "steam_function", label: "Steam Function" },
    ],
    []
  );

  const toggleColumnVisibility = (columnId: string) => {
    setHiddenColumns((prev) =>
      prev.includes(columnId)
        ? prev.filter((col) => col !== columnId)
        : [...prev, columnId]
    );
  };

  const startResize = (e: React.PointerEvent, columnKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = columnWidths[columnKey];

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const minWidth = 50;
      const newWidth = Math.max(minWidth, startWidth + deltaX);
      setColumnWidths((prev) => ({
        ...prev,
        [columnKey]: newWidth,
      }));
    };

    const handlePointerUp = () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
  };

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        if (prev.direction === "asc") {
          return { key, direction: "desc" };
        } else if (prev.direction === "desc") {
          return { key: "", direction: null };
        }
      }
      return { key, direction: "asc" };
    });
  };

  const renderSortIcon = (key: string) => {
    const isSorted = sortConfig.key === key;
    if (!isSorted) {
      return (
        <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100 transition-opacity flex-shrink-0" />
      );
    }
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="w-3 h-3 text-blue-500 flex-shrink-0" />
    ) : (
      <ArrowDown className="w-3 h-3 text-blue-500 flex-shrink-0" />
    );
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(1);
  };

  const matchStringFilter = (
    val: string | undefined | null,
    filterStr: string
  ): boolean => {
    if (!filterStr) return true;
    if (!val) return false;
    return val.toLowerCase().includes(filterStr.toLowerCase().trim());
  };

  const matchNumericFilter = (
    val: number | undefined | null,
    filterStr: string
  ): boolean => {
    if (!filterStr) return true;
    if (val === undefined || val === null) return false;

    const conditions = filterStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (conditions.length === 0) return true;

    return conditions.every((cond) => {
      if (cond.startsWith(">=")) {
        const num = parseFloat(cond.slice(2).trim());
        return isNaN(num) ? true : val >= num;
      }
      if (cond.startsWith("<=")) {
        const num = parseFloat(cond.slice(2).trim());
        return isNaN(num) ? true : val <= num;
      }
      if (cond.startsWith("!=")) {
        const num = parseFloat(cond.slice(2).trim());
        return isNaN(num) ? true : val !== num;
      }
      if (cond.startsWith(">")) {
        const num = parseFloat(cond.slice(1).trim());
        return isNaN(num) ? true : val > num;
      }
      if (cond.startsWith("<")) {
        const num = parseFloat(cond.slice(1).trim());
        return isNaN(num) ? true : val < num;
      }
      if (cond.startsWith("=")) {
        const num = parseFloat(cond.slice(1).trim());
        return isNaN(num) ? true : val === num;
      }

      if (cond.includes("..")) {
        const parts = cond.split("..");
        if (parts.length === 2) {
          const min = parseFloat(parts[0].trim());
          const max = parseFloat(parts[1].trim());
          const matchMin = isNaN(min) ? true : val >= min;
          const matchMax = isNaN(max) ? true : val <= max;
          return matchMin && matchMax;
        }
      }

      const rangeParts = cond.split("-");
      if (
        rangeParts.length === 2 &&
        rangeParts[0].trim() !== "" &&
        rangeParts[1].trim() !== ""
      ) {
        const min = parseFloat(rangeParts[0].trim());
        const max = parseFloat(rangeParts[1].trim());
        if (!isNaN(min) && !isNaN(max)) {
          return val >= min && val <= max;
        }
      }

      const num = parseFloat(cond);
      return isNaN(num) ? val.toString().includes(cond) : val === num;
    });
  };

  const renderFilterInput = (key: string) => {
    const isNumericKey = ["sales_units", "sales_value", "price", "capacity"].includes(key);

    return (
      <div className="relative w-full">
        <Filter className="absolute left-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-muted-foreground/50 pointer-events-none" />
        <Input
          className="h-6 text-[10px] pl-5 pr-4 bg-background border border-muted-foreground/20 rounded font-normal w-full shadow-none focus-visible:ring-1 focus-visible:ring-blue-500"
          value={filters[key] || ""}
          onChange={(e) => handleFilterChange(key, e.target.value)}
          placeholder={isNumericKey ? ">=10, !=0" : "Filter..."}
        />
        {(filters[key] || "").length > 0 && (
          <button
            onClick={() => handleFilterChange(key, "")}
            className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-[10px] p-0.5 line-none font-bold"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  };

  const renderHeader = (
    key: string,
    label: string,
    align: "left" | "right" | "center" = "left"
  ) => {
    if (hiddenColumns.includes(key)) return null;

    return (
      <TableHead
        style={{ width: columnWidths[key] }}
        className={cn(
          "font-medium text-muted-foreground relative group select-none overflow-hidden whitespace-normal break-words h-auto align-middle pb-2.5 pt-2 px-2",
          align === "right" && "text-right",
          align === "center" && "text-center"
        )}
      >
        <div className="flex flex-col gap-1.5 h-full justify-between">
          <div
            className={cn(
              "flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors leading-tight text-[11px]",
              align === "right" && "justify-end",
              align === "center" && "justify-center"
            )}
            onClick={() => handleSort(key)}
          >
            <div className="truncate font-semibold">{label}</div>
            <div className="flex-shrink-0">{renderSortIcon(key)}</div>
          </div>

          <div className="mt-1 w-full" onClick={(e) => e.stopPropagation()}>
            {renderFilterInput(key)}
          </div>
        </div>

        <div
          onPointerDown={(e) => startResize(e, key)}
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/50 active:bg-primary z-10 select-none group-hover:bg-muted-foreground/30 transition-colors"
        />
      </TableHead>
    );
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredItems = useMemo(() => {
    let result = allItems;

    if (debouncedSearch) {
      const lower = debouncedSearch.toLowerCase();
      result = result.filter(
        (item) =>
          (item.brand?.toLowerCase() || "").includes(lower) ||
          (item.item?.toLowerCase() || "").includes(lower) ||
          (item.city?.toLowerCase() || "").includes(lower) ||
          (item.state?.toLowerCase() || "").includes(lower) ||
          (item.sp_cell?.toLowerCase() || "").includes(lower)
      );
    }

    Object.entries(filters).forEach(([key, filterVal]) => {
      if (!filterVal) return;

      if (["sales_units", "sales_value", "price", "capacity"].includes(key)) {
        result = result.filter((item) =>
          matchNumericFilter(item[key as keyof MarketingRecord] as number, filterVal)
        );
      } else if (key === "period") {
        result = result.filter((item) => {
          const pStr = `${getMonthName(item.month)}-${item.year}`.toLowerCase();
          return pStr.includes(filterVal.toLowerCase().trim());
        });
      } else {
        result = result.filter((item) =>
          matchStringFilter(item[key as keyof MarketingRecord] as string, filterVal)
        );
      }
    });

    if (sortConfig.key && sortConfig.direction) {
      const { key, direction } = sortConfig;
      result = [...result].sort((a, b) => {
        let valA = a[key as keyof MarketingRecord];
        let valB = b[key as keyof MarketingRecord];

        if (key === "period") {
          const scoreA = a.year * 12 + a.month;
          const scoreB = b.year * 12 + b.month;
          return direction === "asc" ? scoreA - scoreB : scoreB - scoreA;
        }

        if (valA === null || valA === undefined) return direction === "asc" ? 1 : -1;
        if (valB === null || valB === undefined) return direction === "asc" ? -1 : 1;

        if (typeof valA === "number" && typeof valB === "number") {
          return direction === "asc" ? valA - valB : valB - valA;
        }

        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        return direction === "asc" ? strA.localeCompare(strB) : strB.localeCompare(strA);
      });
    }

    return result;
  }, [allItems, debouncedSearch, filters, sortConfig]);

  // Pagination metrics
  const limit = parseInt(pageSize);
  const totalPages = Math.ceil(filteredItems.length / limit);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * limit;
    return filteredItems.slice(start, start + limit);
  }, [filteredItems, currentPage, limit]);

  const handleResetAllFilters = () => {
    setFilters({});
    setSearchQuery("");
    setSortConfig({ key: "", direction: null });
    setCurrentPage(1);
  };

  const exportToExcel = () => {
    setIsExporting(true);
    try {
      const exportData = filteredItems.map((row) => ({
        "Channel": row.sp_cell,
        "Brand": row.brand || "",
        "Item Model": row.item || "",
        "Period": `${getMonthName(row.month)}-${row.year}`,
        "State": row.state || "",
        "City": row.city || "",
        "Sales Units": row.sales_units,
        "Sales Value (INR)": row.sales_value,
        "Unit Price (INR)": row.price,
        "Capacity": row.capacity || "",
        "Motor Type": row.motor_type || "",
        "Steam Function": row.steam_function || "",
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Marketing Data");
      XLSX.writeFile(workbook, "marketing-data-export.xlsx");
    } catch (err) {
      console.error("Export failed", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card className="shadow-sm border-border overflow-hidden bg-card">
      {/* TOOLBAR */}
      <div className="p-4 border-b border-border flex flex-col md:flex-row items-center justify-between gap-4 bg-muted/10">
        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
          {/* Main Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search across all fields..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background border border-border pl-10 pr-4 py-2 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-muted-foreground transition-all text-foreground"
            />
          </div>

          {/* Reset Filters */}
          {(Object.keys(filters).some((k) => filters[k]) || searchQuery || sortConfig.key) && (
            <Button
              variant="ghost"
              onClick={handleResetAllFilters}
              className="text-xs h-9 text-muted-foreground hover:text-foreground gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              Reset Filters
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
          {/* Refresh button */}
          {onRefresh && (
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              onClick={onRefresh}
              title="Refresh Data"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
          )}

          {/* Column Visibility Trigger */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="text-xs gap-1.5 h-9">
                Columns <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 max-h-80 overflow-y-auto bg-background border border-border">
              <DropdownMenuLabel className="text-xs">Toggle Visibility</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {toggleableColumns.map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  className="text-xs cursor-pointer"
                  checked={!hiddenColumns.includes(col.id)}
                  onCheckedChange={() => toggleColumnVisibility(col.id)}
                  onSelect={(e) => e.preventDefault()}
                >
                  {col.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Excel Export Button */}
          <Button
            onClick={exportToExcel}
            disabled={isExporting || allItems.length === 0}
            variant="outline"
            className="text-xs gap-1.5 h-9"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            )}
            Export Excel
          </Button>
        </div>
      </div>

      {/* TABLE WORKSPACE */}
      <CardContent className="p-0">
        <div className="overflow-x-auto w-full">
          <Table className="text-xs w-full min-w-max border-collapse">
            <TableHeader className="bg-muted/40 border-b border-border">
              <TableRow className="hover:bg-transparent">
                {renderHeader("sp_cell", "Channel")}
                {renderHeader("brand", "Brand")}
                {renderHeader("item", "Item Model")}
                {renderHeader("period", "Period")}
                {renderHeader("state", "State")}
                {renderHeader("city", "City")}
                {renderHeader("sales_units", "Sales Units", "right")}
                {renderHeader("sales_value", "Sales Value", "right")}
                {renderHeader("price", "Unit Price", "right")}
                {renderHeader("capacity", "Capacity")}
                {renderHeader("motor_type", "Motor Type")}
                {renderHeader("steam_function", "Steam Function")}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border text-foreground">
              {loading ? (
                <TableRow>
                  <td colSpan={toggleableColumns.length} className="text-center p-12 text-muted-foreground select-none">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                    Fetching data...
                  </td>
                </TableRow>
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <td colSpan={toggleableColumns.length} className="text-center p-10 text-muted-foreground select-none">
                    No matching marketing records found.
                  </td>
                </TableRow>
              ) : (
                paginatedData.map((row) => (
                  <TableRow key={row.marketing_id} className="hover:bg-muted/10 transition-colors h-8">
                    {!hiddenColumns.includes("sp_cell") && (
                      <TableCell className="py-1 px-2 font-semibold text-zinc-900 dark:text-zinc-100">{row.sp_cell}</TableCell>
                    )}
                    {!hiddenColumns.includes("brand") && (
                      <TableCell className="py-1 px-2">{row.brand || "—"}</TableCell>
                    )}
                    {!hiddenColumns.includes("item") && (
                      <TableCell className="py-1 px-2 font-mono text-blue-600 dark:text-blue-400">{row.item || "—"}</TableCell>
                    )}
                    {!hiddenColumns.includes("period") && (
                      <TableCell className="py-1 px-2 whitespace-nowrap">
                        {getMonthName(row.month)}-{String(row.year).slice(-2)}
                      </TableCell>
                    )}
                    {!hiddenColumns.includes("state") && (
                      <TableCell className="py-1 px-2">{row.state || "—"}</TableCell>
                    )}
                    {!hiddenColumns.includes("city") && (
                      <TableCell className="py-1 px-2 text-zinc-600 dark:text-zinc-400">{row.city || "—"}</TableCell>
                    )}
                    {!hiddenColumns.includes("sales_units") && (
                      <TableCell className="py-1 px-2 text-right">{row.sales_units.toLocaleString()}</TableCell>
                    )}
                    {!hiddenColumns.includes("sales_value") && (
                      <TableCell className="py-1 px-2 text-right font-medium text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(row.sales_value)}
                      </TableCell>
                    )}
                    {!hiddenColumns.includes("price") && (
                      <TableCell className="py-1 px-2 text-right">{formatCurrency(row.price)}</TableCell>
                    )}
                    {!hiddenColumns.includes("capacity") && (
                      <TableCell className="py-1 px-2">{row.capacity ? `${row.capacity} kg` : "—"}</TableCell>
                    )}
                    {!hiddenColumns.includes("motor_type") && (
                      <TableCell className="py-1 px-2">{row.motor_type || "—"}</TableCell>
                    )}
                    {!hiddenColumns.includes("steam_function") && (
                      <TableCell className="py-1 px-2 whitespace-nowrap">{row.steam_function || "—"}</TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* PAGINATION FOOTER */}
        {filteredItems.length > 0 && (
          <div className="p-3 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 bg-card text-xs select-none">
            <p className="text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{((currentPage - 1) * limit) + 1}</span> to{" "}
              <span className="font-semibold text-foreground">
                {Math.min(currentPage * limit, filteredItems.length)}
              </span>{" "}
              of <span className="font-semibold text-foreground">{filteredItems.length}</span> entries
            </p>

            <div className="flex items-center gap-4">
              {/* Rows per page selector */}
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-muted/50 border border-border px-2 py-1 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-foreground cursor-pointer"
                >
                  {["5", "10", "20", "50", "100"].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>

              {/* Page navigate buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 px-2 text-xs"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="h-8 px-2 text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
