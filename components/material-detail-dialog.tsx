import { useState, useEffect, useMemo } from "react";
import api from "@/app/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Info, Loader2, Plus, Edit, Calendar } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import { Item, TrendData, PurchaseOrder } from "@/app/types";

interface MaterialDetailDialogProps {
  selectedMaterial: Item | null;
  onClose: () => void;
  onPOAddedOrUpdated?: () => void;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function MaterialDetailDialog({
  selectedMaterial,
  onClose,
  onPOAddedOrUpdated,
}: MaterialDetailDialogProps) {
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loadingTrend, setLoadingTrend] = useState(false);
  const [trendError, setTrendError] = useState("");

  // Remarks State
  const [remarks, setRemarks] = useState("");
  const [isSavingRemarks, setIsSavingRemarks] = useState(false);
  const [remarksError, setRemarksError] = useState("");
  const [remarksSuccess, setRemarksSuccess] = useState("");

  const predictionMonthNames = useMemo(() => {
    if (selectedMaterial && selectedMaterial.month1_date) {
      const formatDateStr = (dateStr: string) => {
        try {
          const dateObj = new Date(dateStr);
          const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          return `${months[dateObj.getMonth()]}-${dateObj.getFullYear().toString().slice(-2)} Forecast`;
        } catch (e) {
          return null;
        }
      };
      const m1 = formatDateStr(selectedMaterial.month1_date);
      const m2 = selectedMaterial.month2_date ? formatDateStr(selectedMaterial.month2_date) : null;
      const m3 = selectedMaterial.month3_date ? formatDateStr(selectedMaterial.month3_date) : null;

      if (m1 && m2 && m3) {
        return [m1, m2, m3];
      }
    }
    return ["Month 1 Forecast", "Month 2 Forecast", "Month 3 Forecast"];
  }, [selectedMaterial]);

  const computedCoverageDays = useMemo(() => {
    if (!selectedMaterial) return "—";
    if (selectedMaterial.twelve_m_avg && selectedMaterial.twelve_m_avg > 0) {
      const val = (selectedMaterial.current_stock / selectedMaterial.twelve_m_avg) * 30;
      if (isFinite(val) && !isNaN(val)) {
        return `${val.toFixed(0)} days`;
      }
    }
    return selectedMaterial.current_stock > 0 ? "—" : "0 days";
  }, [selectedMaterial]);

  // Tab State
  const [activeTab, setActiveTab] = useState<"overview" | "purchase_orders">("overview");

  // Purchase Orders State
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loadingPOs, setLoadingPOs] = useState(false);
  const [poError, setPoError] = useState("");

  // PO Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [formData, setFormData] = useState({
    po_number: "",
    order_qty: 0,
    receive_qty: 0,
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });

  const fetchPurchaseOrders = async () => {
    if (!selectedMaterial) return;
    try {
      setLoadingPOs(true);
      setPoError("");
      const res = await api.get("/purchase_orders/", {
        params: { material_code: selectedMaterial.material_code },
      });
      setPurchaseOrders(res.data.items || []);
    } catch (err) {
      setPoError("Failed to fetch purchase orders.");
    } finally {
      setLoadingPOs(false);
    }
  };

  const [trendMonths, setTrendMonths] = useState<number>(12);

  // Reset modal UI state when a new material is selected
  useEffect(() => {
    if (!selectedMaterial) {
      setTrendData([]);
      setTrendError("");
      setPurchaseOrders([]);
      setActiveTab("overview");
      setIsFormOpen(false);
      setEditingPO(null);
      setFormError("");
      setFormSuccess("");
      setTrendMonths(12);
      setRemarks("");
      setRemarksError("");
      setRemarksSuccess("");
      return;
    }
    setActiveTab("overview");
    setIsFormOpen(false);
    setEditingPO(null);
    setFormError("");
    setFormSuccess("");
    setTrendMonths(12);
    setRemarks(selectedMaterial.remarks || "");
    setRemarksError("");
    setRemarksSuccess("");
  }, [selectedMaterial]);

  // Fetch consumption trend data based on selected range
  useEffect(() => {
    if (!selectedMaterial) return;

    let isMounted = true;
    const fetchTrend = async () => {
      try {
        setLoadingTrend(true);
        setTrendError("");
        const res = await api.get("/analytics/monthly-trend", {
          params: { 
            material_code: selectedMaterial.material_code,
            limit: trendMonths
          },
        });
        if (isMounted) {
          setTrendData(res.data.data || []);
        }
      } catch (err) {
        if (isMounted) {
          setTrendError("Failed to fetch consumption trend data.");
        }
      } finally {
        if (isMounted) setLoadingTrend(false);
      }
    };

    fetchTrend();

    return () => {
      isMounted = false;
    };
  }, [selectedMaterial, trendMonths]);

  // Close dialog on Escape key press
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  // Fetch purchase orders when PO tab becomes active
  useEffect(() => {
    if (selectedMaterial && activeTab === "purchase_orders") {
      fetchPurchaseOrders();
    }
  }, [selectedMaterial, activeTab]);

  if (!selectedMaterial) return null;

  const handleOpenAddForm = () => {
    setFormData({
      po_number: "",
      order_qty: 0,
      receive_qty: 0,
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
    });
    setEditingPO(null);
    setFormError("");
    setFormSuccess("");
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (po: PurchaseOrder) => {
    setFormData({
      po_number: po.po_number,
      order_qty: Number(po.order_qty),
      receive_qty: Number(po.receive_qty),
      year: po.year,
      month: po.month,
    });
    setEditingPO(po);
    setFormError("");
    setFormSuccess("");
    setIsFormOpen(true);
  };

  const handleSubmitPO = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!formData.po_number.trim()) {
      setFormError("PO Number is required");
      return;
    }
    if (formData.order_qty < 0) {
      setFormError("Order quantity must be non-negative");
      return;
    }
    if (formData.receive_qty < 0) {
      setFormError("Receive quantity must be non-negative");
      return;
    }
    if (Number(formData.receive_qty) > Number(formData.order_qty)) {
      setFormError("Receive quantity cannot exceed order quantity");
      return;
    }
    if (formData.year < 1900 || formData.year > 2100) {
      setFormError("Year must be between 1900 and 2100");
      return;
    }
    if (formData.month < 1 || formData.month > 12) {
      setFormError("Month must be between 1 and 12");
      return;
    }

    try {
      if (editingPO) {
        await api.put(`/purchase_orders/${editingPO.id}`, {
          po_number: formData.po_number.trim(),
          order_qty: Number(formData.order_qty),
          receive_qty: Number(formData.receive_qty),
          year: Number(formData.year),
          month: Number(formData.month),
        });
        setFormSuccess("Purchase Order updated successfully!");
        onPOAddedOrUpdated?.();
        setTimeout(() => {
          setIsFormOpen(false);
          setEditingPO(null);
          fetchPurchaseOrders();
        }, 1000);
      } else {
        await api.post("/purchase_orders/", {
          material_code: selectedMaterial.material_code,
          po_number: formData.po_number.trim(),
          order_qty: Number(formData.order_qty),
          receive_qty: Number(formData.receive_qty),
          year: Number(formData.year),
          month: Number(formData.month),
        });
        setFormSuccess("Purchase Order added successfully!");
        onPOAddedOrUpdated?.();
        setTimeout(() => {
          setIsFormOpen(false);
          fetchPurchaseOrders();
        }, 1000);
      }
    } catch (err: any) {
      console.error("PO submit error:", err);
      if (err.response && err.response.data && err.response.data.detail) {
        const detail = err.response.data.detail;
        if (detail.includes("already exists") || detail.includes("unique constraint")) {
          setFormError(`Purchase Order "${formData.po_number}" already exists.`);
        } else {
          setFormError(detail);
        }
      } else {
        setFormError("An error occurred. Please try again.");
      }
    }
  };

  const handleSaveRemarks = async () => {
    if (!selectedMaterial) return;
    try {
      setIsSavingRemarks(true);
      setRemarksError("");
      setRemarksSuccess("");
      await api.post("/dashboard/remarks", {
        material_code: selectedMaterial.material_code,
        remarks: remarks.trim(),
      });
      setRemarksSuccess("Remarks saved successfully!");
      onPOAddedOrUpdated?.();
      setTimeout(() => setRemarksSuccess(""), 3000);
    } catch (err) {
      setRemarksError("Failed to save remarks.");
    } finally {
      setIsSavingRemarks(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
          <p className="font-semibold text-xs text-muted-foreground uppercase mb-1">{label}</p>
          <p className="text-sm font-bold text-primary">
            {payload[0].value.toLocaleString()} units
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-background border border-border rounded-2xl max-w-4xl w-full shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-start justify-between p-6 border-b">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                {selectedMaterial.material_code}
              </h2>
              <Badge
                variant="secondary"
                className={cn(
                  "font-medium",
                  selectedMaterial.status === "Running" &&
                  "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
                  selectedMaterial.status === "Obsolete" &&
                  "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
                  selectedMaterial.status === "New" &&
                  "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                )}
              >
                {selectedMaterial.status}
              </Badge>
            </div>
            <p className="text-muted-foreground text-xs font-semibold">
              {selectedMaterial.material_description || "No description provided"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full cursor-pointer"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* CONTENT BODY */}
        <div className="p-6 overflow-y-auto max-h-[75vh]">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            
            {/* LEFT COLUMN: QUICK STATS */}
            <div className="col-span-1 md:col-span-5 space-y-4">
              
              {/* MATERIAL STATS CARD */}
              <div className="bg-muted/10 border rounded-xl p-3.5 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground font-medium">Vendor</span>
                  <span className="font-semibold text-foreground truncate max-w-[150px]" title={selectedMaterial.vendor}>
                    {selectedMaterial.vendor || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground font-medium">Current Stock</span>
                  <span className="font-semibold text-foreground">
                    {selectedMaterial.current_stock?.toLocaleString(undefined, {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    }) || "0.0"} units
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground font-medium">Lead Time Qty</span>
                  <span className="font-semibold text-foreground">
                    {selectedMaterial.lead_time_qty?.toLocaleString(undefined, {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    }) || "0.0"} units
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground font-medium">Pending Reorders</span>
                  <span className="font-semibold text-foreground">
                    {selectedMaterial.pending_reorders?.toLocaleString(undefined, {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    }) || "0.0"} units
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground font-medium">Unit Price</span>
                  <span className="font-semibold text-foreground">
                    ₹{selectedMaterial.price?.toFixed(2) || "0.00"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs border-t pt-2 border-border/40">
                  <span className="text-muted-foreground font-medium">Coverage Days</span>
                  <span className="font-semibold text-foreground">
                    {computedCoverageDays}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground font-medium">Status</span>
                  <span className="font-semibold text-foreground">
                    {selectedMaterial.status || "N/A"}
                  </span>
                </div>
                {selectedMaterial.product_category && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-medium">Category</span>
                    <span className="font-semibold text-foreground">
                      {selectedMaterial.product_category}
                    </span>
                  </div>
                )}
              </div>

              {/* LEAD TIME DETAILS */}
              <div className="bg-muted/5 border rounded-xl p-3 grid grid-cols-3 gap-2 divide-x divide-border">
                <div className="text-center">
                  <div className="text-[10px] font-medium text-muted-foreground uppercase">Lead Time</div>
                  <div className="text-sm font-bold text-foreground mt-0.5">
                    {selectedMaterial.lead_time?.toFixed(0) || "0"}d
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] font-medium text-muted-foreground uppercase">Delta</div>
                  <div className="text-sm font-bold text-foreground mt-0.5">
                    {selectedMaterial.delta?.toFixed(0) || "0"}d
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] font-medium text-muted-foreground uppercase">Total L/T</div>
                  <div className="text-sm font-bold text-primary mt-0.5">
                    {selectedMaterial.total_lead_time?.toFixed(0) || "0"}d
                  </div>
                </div>
              </div>

              {/* CONSUMPTION STATS */}
              <div className="bg-muted/5 border rounded-xl p-3 grid grid-cols-2 gap-2 divide-x divide-border">
                <div className="text-center">
                  <div className="text-[10px] font-medium text-muted-foreground uppercase">3M Avg</div>
                  <div className="text-sm font-bold text-foreground mt-0.5">
                    {selectedMaterial.three_m_avg?.toFixed(1) || "0.0"} <span className="text-[10px] font-normal text-muted-foreground">/mo</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] font-medium text-muted-foreground uppercase">12M Avg</div>
                  <div className="text-sm font-bold text-foreground mt-0.5">
                    {selectedMaterial.twelve_m_avg?.toFixed(1) || "0.0"} <span className="text-[10px] font-normal text-muted-foreground">/mo</span>
                  </div>
                </div>
              </div>

              {/* FORECAST PREDICTIONS */}
              <div className="bg-blue-50/30 dark:bg-blue-950/10 border border-blue-100/30 dark:border-blue-900/20 rounded-xl p-3 grid grid-cols-3 gap-2 divide-x divide-blue-100/30 dark:divide-blue-900/20">
                <div className="text-center">
                  <div className="text-[9px] font-semibold text-blue-600 dark:text-blue-400 uppercase truncate">
                    {predictionMonthNames[0].split(" ")[0]}
                  </div>
                  <div className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                    {selectedMaterial.month1_prediction !== null && selectedMaterial.month1_prediction !== undefined
                      ? selectedMaterial.month1_prediction.toFixed(0)
                      : "—"}
                  </div>
                  {selectedMaterial.month1_prediction !== null && selectedMaterial.month1_prediction !== undefined && (
                    <div className="text-[10px] text-blue-500/80 dark:text-blue-400/80 font-medium">
                      {selectedMaterial.month1_prediction_days ? `${selectedMaterial.month1_prediction_days.toFixed(0)}d` : "0d"}
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <div className="text-[9px] font-semibold text-blue-600 dark:text-blue-400 uppercase truncate">
                    {predictionMonthNames[1].split(" ")[0]}
                  </div>
                  <div className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                    {selectedMaterial.month2_prediction !== null && selectedMaterial.month2_prediction !== undefined
                      ? selectedMaterial.month2_prediction.toFixed(0)
                      : "—"}
                  </div>
                  {selectedMaterial.month2_prediction !== null && selectedMaterial.month2_prediction !== undefined && (
                    <div className="text-[10px] text-blue-500/80 dark:text-blue-400/80 font-medium">
                      {selectedMaterial.month2_prediction_days ? `${selectedMaterial.month2_prediction_days.toFixed(0)}d` : "0d"}
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <div className="text-[9px] font-semibold text-blue-600 dark:text-blue-400 uppercase truncate">
                    {predictionMonthNames[2].split(" ")[0]}
                  </div>
                  <div className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                    {selectedMaterial.month3_prediction !== null && selectedMaterial.month3_prediction !== undefined
                      ? selectedMaterial.month3_prediction.toFixed(0)
                      : "—"}
                  </div>
                  {selectedMaterial.month3_prediction !== null && selectedMaterial.month3_prediction !== undefined && (
                    <div className="text-[10px] text-blue-500/80 dark:text-blue-400/80 font-medium">
                      {selectedMaterial.month3_prediction_days ? `${selectedMaterial.month3_prediction_days.toFixed(0)}d` : "0d"}
                    </div>
                  )}
                </div>
              </div>

              {/* REMARKS CARD */}
              <div className="bg-muted/10 border border-border/70 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Material Remarks
                  </label>
                  {remarksSuccess && (
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 animate-in fade-in duration-200">
                      {remarksSuccess}
                    </span>
                  )}
                  {remarksError && (
                    <span className="text-[10px] font-semibold text-destructive animate-in fade-in duration-200">
                      {remarksError}
                    </span>
                  )}
                </div>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter notes or remarks for this material..."
                  className="w-full h-20 rounded-lg border border-input bg-background p-2.5 text-xs shadow-xs focus-visible:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none text-foreground"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveRemarks}
                    disabled={isSavingRemarks || remarks.trim() === (selectedMaterial.remarks || "")}
                    size="sm"
                    className="h-7 text-xs px-3.5 cursor-pointer font-semibold"
                  >
                    {isSavingRemarks ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                    ) : null}
                    Save Remarks
                  </Button>
                </div>
              </div>

              {/* ALTERNATIVE PARTS CARD */}
              {selectedMaterial.alternative_parts && selectedMaterial.alternative_parts.length > 0 && (
                <div className="bg-muted/10 border border-border/70 rounded-xl p-3.5 space-y-2.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Alternative Parts
                  </label>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {selectedMaterial.alternative_parts.map((alt) => (
                      <div key={alt.part_code} className="flex flex-col text-xs p-2 rounded-lg bg-background border border-border/60">
                        <span className="font-semibold text-foreground">{alt.part_code}</span>
                        <span className="text-[10px] text-muted-foreground line-clamp-1" title={alt.part_description}>
                          {alt.part_description}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* RIGHT COLUMN: DETAILED TABS */}
            <div className="col-span-1 md:col-span-7 space-y-4 md:border-l md:pl-6 min-h-[350px]">
              
              {/* TABS HEADER */}
              <div className="flex border-b border-border pt-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("overview")}
                  className={cn(
                    "pb-2.5 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 -mb-[1px] mr-6 focus:outline-none cursor-pointer",
                    activeTab === "overview"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  Consumption Trend
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("purchase_orders");
                    fetchPurchaseOrders();
                  }}
                  className={cn(
                    "pb-2.5 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 -mb-[1px] focus:outline-none cursor-pointer",
                    activeTab === "purchase_orders"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  Purchase Orders
                </button>
              </div>

              {/* TAB CONTENTS */}
              <div className="pt-2">
                
                {/* OVERVIEW TAB */}
                {activeTab === "overview" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                          Consumption Trend
                        </h3>
                        <select
                          value={trendMonths}
                          onChange={(e) => setTrendMonths(Number(e.target.value))}
                          className="flex h-7 w-28 rounded-md border border-input bg-background px-2 py-0.5 text-xs shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring focus:border-primary cursor-pointer font-medium text-foreground"
                        >
                          <option value={3}>3 Months</option>
                          <option value={6}>6 Months</option>
                          <option value={12}>12 Months</option>
                          <option value={24}>24 Months</option>
                        </select>
                      </div>
                      {trendData.length > 0 && (
                        <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 px-2.5 py-0.5 rounded-full">
                          {trendData.length} months of data
                        </span>
                      )}
                    </div>

                    {loadingTrend ? (
                      <div className="h-[220px] bg-muted/30 animate-pulse rounded-xl border flex items-center justify-center">
                        <div className="text-muted-foreground text-xs font-medium flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          Fetching consumption history...
                        </div>
                      </div>
                    ) : trendError ? (
                      <div className="h-[220px] rounded-xl border border-destructive/20 bg-destructive/5 text-destructive flex items-center justify-center text-xs font-medium p-4">
                        {trendError}
                      </div>
                    ) : trendData.length > 0 ? (
                      <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="h-[220px] w-full min-w-0 border rounded-xl p-4 bg-muted/10">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                              <defs>
                                <linearGradient id="dialogColorConsumption" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                              <XAxis
                                dataKey="formatted_date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 9, fill: '#888888' }}
                                dy={8}
                              />
                              <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 9, fill: '#888888' }}
                                tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val)}
                              />
                              <RechartsTooltip content={<CustomTooltip />} />
                              <Area
                                type="monotone"
                                dataKey="total_consumption"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#dialogColorConsumption)"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>

                        {/* 3-Month Forecast breakdown table */}
                        <div className="border rounded-xl overflow-hidden bg-background">
                          <div className="bg-muted/40 px-3 py-2 border-b">
                            <h4 className="text-[11px] font-bold text-foreground uppercase tracking-wide">
                              3-Month Forecast & Procurement Plan Details
                            </h4>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="border-b bg-muted/20 text-muted-foreground font-semibold">
                                  <th className="p-2.5">Month</th>
                                  <th className="p-2.5 text-right">Forecast (Qty)</th>
                                  <th className="p-2.5 text-right">Forecast (Days)</th>
                                  <th className="p-2.5 text-right text-blue-600 dark:text-blue-400">PO (Qty)</th>
                                  <th className="p-2.5 text-right text-blue-600 dark:text-blue-400">PO (Days)</th>
                                  <th className="p-2.5 text-right text-purple-600 dark:text-purple-400">MES (Qty)</th>
                                  <th className="p-2.5 text-right text-purple-600 dark:text-purple-400">MES (Days)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y text-foreground/90">
                                <tr>
                                  <td className="p-2.5 font-medium">{predictionMonthNames[0].split(" ")[0]}</td>
                                  <td className="p-2.5 text-right">{selectedMaterial.month1_prediction?.toFixed(0) || "—"}</td>
                                  <td className="p-2.5 text-right">{selectedMaterial.month1_prediction_days ? `${selectedMaterial.month1_prediction_days.toFixed(0)}d` : "0d"}</td>
                                  <td className="p-2.5 text-right font-medium text-blue-600 dark:text-blue-400">{selectedMaterial.month1_po?.toFixed(0) || "0"}</td>
                                  <td className="p-2.5 text-right text-blue-600 dark:text-blue-400">{selectedMaterial.month1_po_days ? `${selectedMaterial.month1_po_days.toFixed(0)}d` : "0d"}</td>
                                  <td className="p-2.5 text-right font-medium text-purple-600 dark:text-purple-400">{selectedMaterial.month1_mes?.toFixed(0) || "0"}</td>
                                  <td className="p-2.5 text-right text-purple-600 dark:text-purple-400">{selectedMaterial.month1_mes_days ? `${selectedMaterial.month1_mes_days.toFixed(0)}d` : "0d"}</td>
                                </tr>
                                <tr>
                                  <td className="p-2.5 font-medium">{predictionMonthNames[1].split(" ")[0]}</td>
                                  <td className="p-2.5 text-right">{selectedMaterial.month2_prediction?.toFixed(0) || "—"}</td>
                                  <td className="p-2.5 text-right">{selectedMaterial.month2_prediction_days ? `${selectedMaterial.month2_prediction_days.toFixed(0)}d` : "0d"}</td>
                                  <td className="p-2.5 text-right font-medium text-blue-600 dark:text-blue-400">{selectedMaterial.month2_po?.toFixed(0) || "0"}</td>
                                  <td className="p-2.5 text-right text-blue-600 dark:text-blue-400">{selectedMaterial.month2_po_days ? `${selectedMaterial.month2_po_days.toFixed(0)}d` : "0d"}</td>
                                  <td className="p-2.5 text-right font-medium text-purple-600 dark:text-purple-400">{selectedMaterial.month2_mes?.toFixed(0) || "0"}</td>
                                  <td className="p-2.5 text-right text-purple-600 dark:text-purple-400">{selectedMaterial.month2_mes_days ? `${selectedMaterial.month2_mes_days.toFixed(0)}d` : "0d"}</td>
                                </tr>
                                <tr>
                                  <td className="p-2.5 font-medium">{predictionMonthNames[2].split(" ")[0]}</td>
                                  <td className="p-2.5 text-right">{selectedMaterial.month3_prediction?.toFixed(0) || "—"}</td>
                                  <td className="p-2.5 text-right">{selectedMaterial.month3_prediction_days ? `${selectedMaterial.month3_prediction_days.toFixed(0)}d` : "0d"}</td>
                                  <td className="p-2.5 text-right font-medium text-blue-600 dark:text-blue-400">{selectedMaterial.month3_po?.toFixed(0) || "0"}</td>
                                  <td className="p-2.5 text-right text-blue-600 dark:text-blue-400">{selectedMaterial.month3_po_days ? `${selectedMaterial.month3_po_days.toFixed(0)}d` : "0d"}</td>
                                  <td className="p-2.5 text-right font-medium text-purple-600 dark:text-purple-400">{selectedMaterial.month3_mes?.toFixed(0) || "0"}</td>
                                  <td className="p-2.5 text-right text-purple-600 dark:text-purple-400">{selectedMaterial.month3_mes_days ? `${selectedMaterial.month3_mes_days.toFixed(0)}d` : "0d"}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-[220px] border border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground bg-muted/5">
                        <Info className="w-6 h-6 opacity-25 mb-2" />
                        <p className="text-xs font-semibold">No consumption trend data available</p>
                      </div>
                    )}
                  </div>
                )}

                {/* PURCHASE ORDERS TAB */}
                {activeTab === "purchase_orders" && (
                  <div className="space-y-4">
                    {isFormOpen ? (
                      /* ADD / EDIT PO FORM */
                      <form onSubmit={handleSubmitPO} className="bg-muted/30 border rounded-xl p-4 space-y-3 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between border-b pb-2">
                          <h3 className="text-xs font-bold text-foreground">
                            {editingPO ? `Edit PO: ${editingPO.po_number}` : "Add Purchase Order"}
                          </h3>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsFormOpen(false)}
                            className="h-7 w-7 rounded-full p-0 cursor-pointer hover:bg-muted"
                          >
                            <X className="h-3.5 h-3.5" />
                          </Button>
                        </div>

                        {formError && (
                          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-[11px] font-medium p-2.5 rounded-lg flex items-center gap-2">
                            <span>⚠️</span>
                            <div>{formError}</div>
                          </div>
                        )}

                        {formSuccess && (
                          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400 text-[11px] font-medium p-2.5 rounded-lg flex items-center gap-2">
                            <span>✅</span>
                            <div>{formSuccess}</div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-muted-foreground uppercase">
                              PO Number *
                            </label>
                            <Input
                              required
                              placeholder="e.g. PO-890213"
                              value={formData.po_number}
                              onChange={(e) => setFormData({ ...formData, po_number: e.target.value })}
                              className="bg-background h-8 text-xs"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-muted-foreground uppercase">
                              Order Qty *
                            </label>
                            <Input
                              required
                              type="number"
                              min="0"
                              step="any"
                              placeholder="e.g. 1000"
                              value={formData.order_qty || ""}
                              onChange={(e) => setFormData({ ...formData, order_qty: Number(e.target.value) })}
                              className="bg-background h-8 text-xs"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-muted-foreground uppercase">
                              Receive Qty
                            </label>
                            <Input
                              type="number"
                              min="0"
                              step="any"
                              placeholder="e.g. 500"
                              value={formData.receive_qty || "0"}
                              onChange={(e) => setFormData({ ...formData, receive_qty: Number(e.target.value) })}
                              className="bg-background h-8 text-xs"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-muted-foreground uppercase">
                                Year *
                              </label>
                              <select
                                value={formData.year}
                                onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                                className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring focus:border-primary"
                              >
                                {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map((yr) => (
                                  <option key={yr} value={yr}>
                                    {yr}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-muted-foreground uppercase">
                                Month *
                              </label>
                              <select
                                value={formData.month}
                                onChange={(e) => setFormData({ ...formData, month: Number(e.target.value) })}
                                className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring focus:border-primary"
                              >
                                {MONTH_NAMES.map((name, idx) => (
                                  <option key={idx + 1} value={idx + 1}>
                                    {name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIsFormOpen(false)}
                            className="cursor-pointer h-8 text-xs"
                          >
                            Cancel
                          </Button>
                          <Button type="submit" size="sm" className="cursor-pointer h-8 text-xs">
                            {editingPO ? "Save" : "Create"}
                          </Button>
                        </div>
                      </form>
                    ) : (
                      /* PO LIST */
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                            Purchase Orders
                          </h3>
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleOpenAddForm}
                            className="h-8 gap-1 cursor-pointer text-xs font-semibold px-3"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add PO
                          </Button>
                        </div>

                        {loadingPOs ? (
                          <div className="h-[150px] border rounded-xl flex items-center justify-center bg-muted/5">
                            <div className="text-muted-foreground text-xs font-medium flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin text-primary" />
                              Loading purchase orders...
                            </div>
                          </div>
                        ) : poError ? (
                          <div className="h-[150px] rounded-xl border border-destructive/20 bg-destructive/5 text-destructive flex items-center justify-center text-xs font-medium p-4">
                            {poError}
                          </div>
                        ) : purchaseOrders.length > 0 ? (
                          <div className="border rounded-xl overflow-hidden bg-background">
                            <div className="max-h-[220px] overflow-y-auto">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead className="sticky top-0 bg-background z-10">
                                  <tr className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                                    <th className="p-2.5">PO Number</th>
                                    <th className="p-2.5">Period</th>
                                    <th className="p-2.5 text-right">Order</th>
                                    <th className="p-2.5 text-right">Recv</th>
                                    <th className="p-2.5 text-center">Status</th>
                                    <th className="p-2.5 text-right">Action</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                  {purchaseOrders.map((po) => {
                                    const diff = Number(po.order_qty) - Number(po.receive_qty);
                                    const isCompleted = diff <= 0;
                                    const isNew = Number(po.receive_qty) === 0;
                                    return (
                                      <tr key={po.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="p-2.5 text-foreground">
                                           <div className="font-semibold">{po.po_number}</div>
                                           {po.user && (
                                             <div className="text-[10px] text-muted-foreground font-normal mt-0.5" title={po.user.email}>
                                               By: {po.user.first_name} {po.user.last_name}
                                             </div>
                                           )}
                                         </td>
                                        <td className="p-2.5 text-muted-foreground truncate max-w-[80px]">
                                          {MONTH_NAMES[po.month - 1].slice(0, 3)} {po.year}
                                        </td>
                                        <td className="p-2.5 text-right font-medium">{po.order_qty.toLocaleString()}</td>
                                        <td className="p-2.5 text-right font-medium">{po.receive_qty.toLocaleString()}</td>
                                        <td className="p-2.5 text-center">
                                          <Badge
                                            variant="secondary"
                                            className={cn(
                                              "text-[9px] font-semibold px-1.5 py-0.25",
                                              isCompleted && "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400",
                                              isNew && "bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400",
                                              !isCompleted && !isNew && "bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400"
                                            )}
                                          >
                                            {isCompleted ? "Done" : isNew ? "Open" : "Part"}
                                          </Badge>
                                        </td>
                                        <td className="p-2.5 text-right">
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 rounded-md cursor-pointer hover:bg-muted"
                                            onClick={() => handleOpenEditForm(po)}
                                            title="Edit PO"
                                          >
                                            <Edit className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                                          </Button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ) : (
                          <div className="h-[150px] border border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground bg-muted/5">
                            <Calendar className="w-5 h-5 opacity-25 mb-2" />
                            <p className="text-xs font-semibold">No purchase orders found</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              Add a purchase order using the button above.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

              </div>

            </div>

          </div>
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-end p-5 border-t bg-muted/10">
          <Button onClick={onClose} size="sm" className="cursor-pointer">
            Close Details
          </Button>
        </div>
      </div>
    </div>
  );
}
