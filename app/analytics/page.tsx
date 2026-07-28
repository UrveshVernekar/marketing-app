"use client";

import { useState, useEffect, useMemo } from "react";
import api from "@/app/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  LineChart,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  Activity,
  Layers,
  Calendar,
  ShoppingBag,
  Award,
  Globe2,
  Filter,
  Check,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Tag,
  ChevronUp,
  ChevronDown,
  LineChart as LineChartIcon,
  IndianRupee,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BranchMarketShareItem {
  state: string;
  industry_volume: number;
  brand_shares: Record<string, number>;
  brand_units: Record<string, number>;
  brand_trends: Record<string, number | null>;
}

interface CapacityGridItem {
  brand: string;
  units: Record<string, number>;
  shares: Record<string, number>;
}

interface CapacityTrendItem {
  period: string;
  year: number;
  month: number;
  capacity_data: Record<string, Record<string, { units: number; share: number }>>;
}

interface CapacityMarketShareResponse {
  grid: CapacityGridItem[];
  capacity_totals: Record<string, number>;
  trend: CapacityTrendItem[];
  states: string[];
  cities: string[];
  state_city_map: { state: string; city: string }[];
  brands: string[];
}

interface SkuStandingItem {
  sku: string;
  volume: number;
  asp: number;
}

interface MopTableItem {
  brand: string;
  capacity: string;
  mop: number;
  rank: number;
  volume?: number;
  revenue?: number;
}

interface MopTrendItem {
  period: string;
  year: number;
  month: number;
  capacity_trends: Record<string, Record<string, number>>;
}

interface MopTrendsResponse {
  table: MopTableItem[];
  trend: MopTrendItem[];
}

// Brand color mapping for premium look
const brandColors: Record<string, string> = {
  IFB: "#ec1c24",       // Premium Deep Red
  SAMSUNG: "#1f4e99",   // Classic Corporate Blue
  LG: "#c61a5b",        // Deep Pink/Magenta
  BOSCH: "#005691",     // Clean Cyan/Blue
  GODREJ: "#107c41",    // Emerald Green
  Unknown: "#71717a",   // Zinc Gray
};

const getBrandColor = (brand: string) => {
  const upperBrand = brand.toUpperCase();
  return brandColors[upperBrand] || brandColors.Unknown;
};

const capacityBuckets = ["6 kg", "7 kg", "8 kg", "9 kg", "10 kg", "11 kg", "12 kg", "13 kg", "14 kg", "> 14 kg"];

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

interface MultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder: string;
}

function MultiSelect({ options, selected, onChange, placeholder }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localSelected, setLocalSelected] = useState<string[]>(selected);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setLocalSelected(selected);
  }, [selected]);

  const filteredOptions = useMemo(() => {
    if (!searchQuery) return options;
    const lowerQuery = searchQuery.toLowerCase();
    return options.filter((opt) => opt.toLowerCase().includes(lowerQuery));
  }, [options, searchQuery]);

  const toggleOption = (opt: string) => {
    if (localSelected.includes(opt)) {
      setLocalSelected(localSelected.filter((x) => x !== opt));
    } else {
      setLocalSelected([...localSelected, opt]);
    }
  };

  const selectAll = () => {
    const newSelection = Array.from(new Set([...localSelected, ...filteredOptions]));
    setLocalSelected(newSelection);
  };

  const clearAll = () => {
    setLocalSelected(localSelected.filter((x) => !filteredOptions.includes(x)));
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchQuery("");
    onChange(localSelected);
  };

  const toggleDropdown = () => {
    if (isOpen) {
      handleClose();
    } else {
      setIsOpen(true);
    }
  };

  return (
    <div className="relative inline-block w-full sm:w-[200px]">
      <div
        onClick={toggleDropdown}
        className="bg-muted/60 border border-border/60 px-3 py-1.5 rounded-xl text-xs flex items-center justify-between cursor-pointer select-none text-foreground"
      >
        <span className="truncate">
          {localSelected.length === 0
            ? placeholder
            : localSelected.length === options.length
              ? "All Selected"
              : localSelected.join(", ")}
        </span>
        <ChevronDown className="w-3.5 h-3.5 ml-2 opacity-60 flex-shrink-0" />
      </div>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={handleClose} />
          <div className="absolute right-0 mt-1 w-full bg-card border border-border rounded-xl shadow-lg z-20 max-h-72 overflow-y-auto p-2 space-y-1">
            {/* Search Input Box */}
            <div className="px-1.5 pb-1.5 mb-1.5 border-b border-border/50">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-muted border border-border px-2 py-1 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-foreground"
                onClick={(e) => e.stopPropagation()} // Prevent close on click
              />
            </div>
            
            <div className="flex justify-between border-b border-border pb-1.5 mb-1.5 text-[10px] text-muted-foreground font-semibold px-1">
              <button onClick={selectAll} className="hover:text-foreground cursor-pointer">Select All</button>
              <button onClick={clearAll} className="hover:text-foreground cursor-pointer">Clear All</button>
            </div>
            {filteredOptions.length === 0 ? (
              <div className="text-center py-4 text-[10px] text-muted-foreground">No options found</div>
            ) : (
              filteredOptions.map((opt) => {
                const isChecked = localSelected.includes(opt);
                return (
                  <label
                    key={opt}
                    className="flex items-center gap-2 px-2 py-1 hover:bg-muted/60 rounded-lg cursor-pointer text-xs select-none text-foreground"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleOption(opt)}
                      className="rounded border-border text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                    />
                    <span>{opt}</span>
                  </label>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  // Global filters
  const [applianceType, setApplianceType] = useState<"WM" | "AC">("WM");
  const [category, setCategory] = useState<"ALL" | "FL" | "TL" | "WDR">("ALL");
  const [duration, setDuration] = useState<"all" | "1m" | "3m" | "6m" | "12m" | "custom">("all");
  const [startPeriod, setStartPeriod] = useState<string>("");
  const [endPeriod, setEndPeriod] = useState<string>("");
  const [globalPeriods, setGlobalPeriods] = useState<Array<{ year: number; month: number; label: string; value: string }>>([]);

  // Global states, cities & brands fetched on mount
  const [globalStates, setGlobalStates] = useState<string[]>([]);
  const [globalCities, setGlobalCities] = useState<string[]>([]);
  const [globalBrands, setGlobalBrands] = useState<string[]>([]);
  const [stateCityMap, setStateCityMap] = useState<{ state: string; city: string }[]>([]);

  // Chart 1 States & section specific filters
  const [chart1Data, setChart1Data] = useState<BranchMarketShareItem[]>([]);
  const [loading1, setLoading1] = useState(true);
  const [error1, setError1] = useState("");
  const [section1SelectedStates, setSection1SelectedStates] = useState<string[]>([]);
  const [section1SelectedCities, setSection1SelectedCities] = useState<string[]>([]);
  const [section1SelectedBrands, setSection1SelectedBrands] = useState<string[]>(["IFB", "LG", "BOSCH", "SAMSUNG"]);
  const [compareOffset, setCompareOffset] = useState<"1m" | "3m" | "6m" | "12m">("1m");

  // Chart 2 States & section specific filters
  const [viewType2, setViewType2] = useState<"shares" | "units">("shares");
  const [selectedCapacity, setSelectedCapacity] = useState<string>("6 kg");
  const [chart2Data, setChart2Data] = useState<CapacityMarketShareResponse | null>(null);
  const [loading2, setLoading2] = useState(true);
  const [error2, setError2] = useState("");
  const [section2SelectedStates, setSection2SelectedStates] = useState<string[]>([]);
  const [section2SelectedCities, setSection2SelectedCities] = useState<string[]>([]);
  const [section2SelectedBrands, setSection2SelectedBrands] = useState<string[]>(["IFB", "LG", "BOSCH", "SAMSUNG"]);

  // Chart 3 (SKUs) States & section specific filters
  const [skuData, setSkuData] = useState<Record<string, SkuStandingItem[]>>({});
  const [loading3, setLoading3] = useState(true);
  const [error3, setError3] = useState("");
  const [brandSorts, setBrandSorts] = useState<Record<string, { key: "sku" | "volume" | "asp"; direction: "asc" | "desc" }>>({});
  const [isSkuSectionCollapsed, setIsSkuSectionCollapsed] = useState(false);
  const [skuType, setSkuType] = useState<"item" | "capacity">("capacity");
  const [section3SelectedStates, setSection3SelectedStates] = useState<string[]>([]);
  const [section3SelectedCities, setSection3SelectedCities] = useState<string[]>([]);
  const [section3SelectedBrands, setSection3SelectedBrands] = useState<string[]>(["IFB", "LG", "BOSCH", "SAMSUNG"]);

  // Chart 4 (MOP) States & section specific filters
  const [mopData, setMopData] = useState<MopTrendsResponse | null>(null);
  const [loading4, setLoading4] = useState(true);
  const [error4, setError4] = useState("");
  const [selectedMopCapacity, setSelectedMopCapacity] = useState<string>("6 kg");
  const [isMopSectionCollapsed, setIsMopSectionCollapsed] = useState(false);
  const [section4SelectedStates, setSection4SelectedStates] = useState<string[]>([]);
  const [section4SelectedCities, setSection4SelectedCities] = useState<string[]>([]);
  const [section4SelectedBrands, setSection4SelectedBrands] = useState<string[]>(["IFB", "LG", "BOSCH", "SAMSUNG"]);
  const [mopRankBy, setMopRankBy] = useState<"price" | "volume" | "revenue">("price");

  // Fetch Chart 1
  const fetchChart1 = async () => {
    try {
      setLoading1(true);
      setError1("");
      if (applianceType === "AC") {
        setChart1Data([]);
        setLoading1(false);
        return;
      }
      const params: any = { category, duration, compare_offset: compareOffset };
      if (duration === "custom") {
        params.start_period = startPeriod || undefined;
        params.end_period = endPeriod || undefined;
      }
      if (section1SelectedStates.length > 0) {
        params.states = section1SelectedStates.join(",");
      }
      if (section1SelectedCities.length > 0) {
        params.cities = section1SelectedCities.join(",");
      }
      if (section1SelectedBrands.length > 0) {
        params.brands = section1SelectedBrands.join(",");
      }
      const res = await api.get("/analytics/branch-market-share", { params });
      setChart1Data(res.data);
    } catch (err: any) {
      console.error(err);
      setError1("Failed to fetch branch market share data.");
    } finally {
      setLoading1(false);
    }
  };

  // Fetch Chart 2
  const fetchChart2 = async () => {
    try {
      setLoading2(true);
      setError2("");
      if (applianceType === "AC") {
        setChart2Data(null);
        setLoading2(false);
        return;
      }
      const params: any = { duration };
      if (duration === "custom") {
        params.start_period = startPeriod || undefined;
        params.end_period = endPeriod || undefined;
      }
      if (section2SelectedStates.length > 0) {
        params.states = section2SelectedStates.join(",");
      }
      if (section2SelectedCities.length > 0) {
        params.cities = section2SelectedCities.join(",");
      }
      if (section2SelectedBrands.length > 0) {
        params.brands = section2SelectedBrands.join(",");
      }
      const res = await api.get("/analytics/capacity-market-share", { params });
      setChart2Data(res.data);
    } catch (err: any) {
      console.error(err);
      setError2("Failed to fetch capacity market share data.");
    } finally {
      setLoading2(false);
    }
  };

  // Fetch Chart 3
  const fetchChart3 = async () => {
    try {
      setLoading3(true);
      setError3("");
      if (applianceType === "AC") {
        setSkuData({});
        setLoading3(false);
        return;
      }
      const params: any = { duration, sku_type: skuType };
      if (duration === "custom") {
        params.start_period = startPeriod || undefined;
        params.end_period = endPeriod || undefined;
      }
      if (section3SelectedStates.length > 0) {
        params.states = section3SelectedStates.join(",");
      }
      if (section3SelectedCities.length > 0) {
        params.cities = section3SelectedCities.join(",");
      }
      if (section3SelectedBrands.length > 0) {
        params.brands = section3SelectedBrands.join(",");
      }
      const res = await api.get("/analytics/sku-standings", { params });
      setSkuData(res.data);
    } catch (err: any) {
      console.error(err);
      setError3("Failed to fetch SKU standings data.");
    } finally {
      setLoading3(false);
    }
  };

  // Fetch Chart 4
  const fetchChart4 = async () => {
    try {
      setLoading4(true);
      setError4("");
      if (applianceType === "AC") {
        setMopData(null);
        setLoading4(false);
        return;
      }
      const params: any = { duration, rank_by: mopRankBy };
      if (duration === "custom") {
        params.start_period = startPeriod || undefined;
        params.end_period = endPeriod || undefined;
      }
      if (section4SelectedStates.length > 0) {
        params.states = section4SelectedStates.join(",");
      }
      if (section4SelectedCities.length > 0) {
        params.cities = section4SelectedCities.join(",");
      }
      if (section4SelectedBrands.length > 0) {
        params.brands = section4SelectedBrands.join(",");
      }
      const res = await api.get("/analytics/mop-trends", { params });
      setMopData(res.data);
    } catch (err: any) {
      console.error(err);
      setError4("Failed to fetch MOP trends data.");
    } finally {
      setLoading4(false);
    }
  };

  useEffect(() => {
    fetchChart1();
  }, [applianceType, category, duration, section1SelectedStates, section1SelectedCities, section1SelectedBrands, startPeriod, endPeriod, compareOffset]);

  useEffect(() => {
    fetchChart2();
  }, [applianceType, duration, section2SelectedStates, section2SelectedCities, section2SelectedBrands, startPeriod, endPeriod]);

  useEffect(() => {
    fetchChart3();
  }, [applianceType, duration, skuType, section3SelectedStates, section3SelectedCities, section3SelectedBrands, startPeriod, endPeriod]);

  useEffect(() => {
    fetchChart4();
  }, [applianceType, duration, section4SelectedStates, section4SelectedCities, section4SelectedBrands, startPeriod, endPeriod, mopRankBy]);

  // Load global filter metadata when chart2Data resolves
  useEffect(() => {
    if (chart2Data) {
      if (globalStates.length === 0 && chart2Data.states) {
        setGlobalStates(chart2Data.states);
      }
      if (globalCities.length === 0 && chart2Data.cities) {
        setGlobalCities(chart2Data.cities);
      }
      if (stateCityMap.length === 0 && chart2Data.state_city_map) {
        setStateCityMap(chart2Data.state_city_map);
      }
      if (globalBrands.length === 0 && chart2Data.brands) {
        setGlobalBrands(chart2Data.brands);
      }
      if (globalPeriods.length === 0 && (chart2Data as any).periods) {
        const pList = (chart2Data as any).periods;
        setGlobalPeriods(pList);
        if (pList.length > 0) {
          // periods are sorted DESC (newest first). Let's set defaults.
          setEndPeriod(pList[0].value);
          setStartPeriod(pList[pList.length - 1].value);
        }
      }
    }
  }, [chart2Data, globalStates.length, globalCities.length, stateCityMap.length, globalBrands.length, globalPeriods.length]);

  // Section 1 available cities list filtered based on state selections
  const section1AvailableCities = useMemo(() => {
    if (section1SelectedStates.length === 0) {
      return globalCities;
    }
    const allowedCities = stateCityMap
      .filter((item) => section1SelectedStates.includes(item.state))
      .map((item) => item.city);
    return globalCities.filter((city) => allowedCities.includes(city));
  }, [globalCities, section1SelectedStates, stateCityMap]);

  // Reset selected cities if they are no longer valid under selected states
  useEffect(() => {
    const nextCities = section1SelectedCities.filter((city) => section1AvailableCities.includes(city));
    if (nextCities.length !== section1SelectedCities.length) {
      setSection1SelectedCities(nextCities);
    }
  }, [section1SelectedStates, section1AvailableCities, section1SelectedCities]);

  // Section 2 available cities list filtered based on state selections
  const section2AvailableCities = useMemo(() => {
    if (section2SelectedStates.length === 0) {
      return globalCities;
    }
    const allowedCities = stateCityMap
      .filter((item) => section2SelectedStates.includes(item.state))
      .map((item) => item.city);
    return globalCities.filter((city) => allowedCities.includes(city));
  }, [globalCities, section2SelectedStates, stateCityMap]);

  // Reset selected cities if they are no longer valid under selected states
  useEffect(() => {
    const nextCities = section2SelectedCities.filter((city) => section2AvailableCities.includes(city));
    if (nextCities.length !== section2SelectedCities.length) {
      setSection2SelectedCities(nextCities);
    }
  }, [section2SelectedStates, section2AvailableCities, section2SelectedCities]);

  // Section 3 available cities list filtered based on state selections
  const section3AvailableCities = useMemo(() => {
    if (section3SelectedStates.length === 0) {
      return globalCities;
    }
    const allowedCities = stateCityMap
      .filter((item) => section3SelectedStates.includes(item.state))
      .map((item) => item.city);
    return globalCities.filter((city) => allowedCities.includes(city));
  }, [globalCities, section3SelectedStates, stateCityMap]);

  // Reset selected cities if they are no longer valid under selected states
  useEffect(() => {
    const nextCities = section3SelectedCities.filter((city) => section3AvailableCities.includes(city));
    if (nextCities.length !== section3SelectedCities.length) {
      setSection3SelectedCities(nextCities);
    }
  }, [section3SelectedStates, section3AvailableCities, section3SelectedCities]);

  // Section 4 available cities list filtered based on state selections
  const section4AvailableCities = useMemo(() => {
    if (section4SelectedStates.length === 0) {
      return globalCities;
    }
    const allowedCities = stateCityMap
      .filter((item) => section4SelectedStates.includes(item.state))
      .map((item) => item.city);
    return globalCities.filter((city) => allowedCities.includes(city));
  }, [globalCities, section4SelectedStates, stateCityMap]);

  // Reset selected cities if they are no longer valid under selected states
  useEffect(() => {
    const nextCities = section4SelectedCities.filter((city) => section4AvailableCities.includes(city));
    if (nextCities.length !== section4SelectedCities.length) {
      setSection4SelectedCities(nextCities);
    }
  }, [section4SelectedStates, section4AvailableCities, section4SelectedCities]);

  // Dynamically compile list of all brands from globalBrands metadata
  const allBrands = useMemo(() => {
    if (globalBrands.length > 0) {
      return globalBrands;
    }
    return ["IFB", "SAMSUNG", "LG", "BOSCH", "GODREJ"];
  }, [globalBrands]);

  // Extract all unique brands dynamically for Chart 1
  const uniqueBrands1 = useMemo(() => {
    const brandsSet = new Set<string>();
    chart1Data.forEach((item) => {
      Object.keys(item.brand_shares).forEach((brand) => {
        brandsSet.add(brand);
      });
    });
    return Array.from(brandsSet);
  }, [chart1Data]);

  // Prepare data for recharts (Chart 1)
  const chartData1 = useMemo(() => {
    return chart1Data.map((item) => {
      const row: any = {
        state: item.state,
        industry_volume: item.industry_volume,
      };
      uniqueBrands1.forEach((brand) => {
        row[brand] = item.brand_shares[brand] || 0;
      });
      return row;
    });
  }, [chart1Data, uniqueBrands1]);

  // Check if comparison past data is available based on selected range
  const showComparison = useMemo(() => {
    if (duration === "all") return false;
    if (duration === "custom") {
      const oldestPeriod = globalPeriods[globalPeriods.length - 1]?.value;
      if (!startPeriod || startPeriod === oldestPeriod) {
        return false;
      }
    }
    return true;
  }, [duration, startPeriod, globalPeriods]);

  // Compute overall totals for metrics cards (Chart 1)
  const totalIndustryVolume = useMemo(() => {
    return chart1Data.reduce((acc, curr) => acc + curr.industry_volume, 0);
  }, [chart1Data]);

  const topBranch = useMemo(() => {
    if (chart1Data.length === 0) return null;
    return chart1Data[0]; // Already sorted by industry volume descending
  }, [chart1Data]);

  const leadingBrandOverall = useMemo(() => {
    if (chart1Data.length === 0) return { name: "N/A", share: 0 };

    const brandTotals: Record<string, number> = {};
    chart1Data.forEach((item) => {
      Object.entries(item.brand_units).forEach(([brand, units]) => {
        brandTotals[brand] = (brandTotals[brand] || 0) + units;
      });
    });

    const totalUnits = Object.values(brandTotals).reduce((a, b) => a + b, 0);
    if (totalUnits === 0) return { name: "N/A", share: 0 };

    let topBrandName = "N/A";
    let topBrandUnits = 0;

    Object.entries(brandTotals).forEach(([brand, units]) => {
      if (units > topBrandUnits) {
        topBrandUnits = units;
        topBrandName = brand;
      }
    });

    return {
      name: topBrandName,
      share: ((topBrandUnits / totalUnits) * 100).toFixed(1),
    };
  }, [chart1Data]);

  // Render tooltip details for Chart 1
  const CustomTooltip1 = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const stateItem = chart1Data.find((item) => item.state === label);
      if (!stateItem) return null;

      return (
        <div className="bg-background/95 border border-border p-4 rounded-xl shadow-xl backdrop-blur-md max-w-sm">
          <p className="font-bold text-sm text-foreground mb-1.5 border-b border-border pb-1.5">
            {label}
          </p>
          <div className="space-y-1 mb-2.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Total Industry Vol:</span>
              <span className="font-semibold text-foreground">
                {stateItem.industry_volume.toLocaleString()} units
              </span>
            </div>
          </div>
          <div className="space-y-1.5">
            {Object.entries(stateItem.brand_shares)
              .sort((a, b) => b[1] - a[1])
              .map(([brand, share]) => {
                const units = stateItem.brand_units[brand] || 0;
                return (
                  <div key={brand} className="flex items-center justify-between gap-6 text-xs">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: getBrandColor(brand) }}
                      />
                      <span className="font-medium text-foreground">{brand}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">({units.toLocaleString()} u)</span>
                      <span className="font-bold" style={{ color: getBrandColor(brand) }}>
                        {share}%
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      );
    }
    return null;
  };

  // --- CHART 2 COMPUTED PROPERTIES ---

  // Dynamic unique brands present in Chart 2 data
  const uniqueBrands2 = useMemo(() => {
    if (!chart2Data) return [];
    return chart2Data.grid.map((item) => item.brand);
  }, [chart2Data]);

  // Formatted line chart trend data based on selected Capacity and viewType2 (units vs shares)
  const lineChartData2 = useMemo(() => {
    if (!chart2Data) return [];
    return chart2Data.trend.map((p) => {
      const row: any = {
        period: p.period,
      };
      uniqueBrands2.forEach((brand) => {
        const brandData = p.capacity_data[selectedCapacity]?.[brand];
        row[brand] = viewType2 === "shares" ? (brandData?.share || 0) : (brandData?.units || 0);
      });
      return row;
    });
  }, [chart2Data, selectedCapacity, viewType2, uniqueBrands2]);

  // Render tooltip details for Line Chart (Chart 2)
  const CustomTooltip2 = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 border border-border p-4 rounded-xl shadow-xl backdrop-blur-md min-w-[200px]">
          <p className="font-bold text-sm text-foreground mb-1.5 border-b border-border pb-1.5">
            {label} ({selectedCapacity})
          </p>
          <div className="space-y-1.5">
            {payload
              .sort((a: any, b: any) => b.value - a.value)
              .map((p: any) => (
                <div key={p.name} className="flex items-center justify-between gap-6 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getBrandColor(p.name) }}
                    />
                    <span className="font-medium text-foreground">{p.name}</span>
                  </div>
                  <span className="font-bold" style={{ color: getBrandColor(p.name) }}>
                    {viewType2 === "shares" ? `${p.value}%` : `${p.value.toLocaleString()} units`}
                  </span>
                </div>
              ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // --- CHART 3 (SKUs) HELPERS ---

  const handleBrandSort = (brand: string, key: "sku" | "volume" | "asp") => {
    setBrandSorts((prev) => {
      const current = prev[brand] || { key: "volume", direction: "desc" };
      let nextDirection: "asc" | "desc" = "desc";
      if (current.key === key) {
        nextDirection = current.direction === "desc" ? "asc" : "desc";
      }
      return {
        ...prev,
        [brand]: { key, direction: nextDirection }
      };
    });
  };

  const getSortedSkus = (brand: string, skus: SkuStandingItem[]) => {
    const sort = brandSorts[brand] || { key: "volume", direction: "desc" };
    return [...skus].sort((a, b) => {
      let valA = a[sort.key];
      let valB = b[sort.key];
      if (typeof valA === "string" && typeof valB === "string") {
        return sort.direction === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }
      // Number sorts
      return sort.direction === "asc"
        ? (valA as number) - (valB as number)
        : (valB as number) - (valA as number);
    });
  };

  const renderSortIndicator = (brand: string, key: "sku" | "volume" | "asp") => {
    const sort = brandSorts[brand] || { key: "volume", direction: "desc" };
    if (sort.key !== key) {
      return <ArrowUpDown className="w-3 h-3 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors flex-shrink-0" />;
    }
    return sort.direction === "asc"
      ? <ArrowUp className="w-3 h-3 text-blue-600 dark:text-blue-400 flex-shrink-0" />
      : <ArrowDown className="w-3 h-3 text-blue-600 dark:text-blue-400 flex-shrink-0" />;
  };

  // --- CHART 4 (MOP) HELPERS ---

  // Format MOP data as Brand vs Capacity Matrix Grid
  const mopGridData = useMemo(() => {
    if (!mopData) return [];
    const brands = Array.from(new Set(mopData.table.map(item => item.brand)));
    return brands.map((brand) => {
      const row: any = { brand };
      capacityBuckets.forEach((cap) => {
        const match = mopData.table.find(t => t.brand === brand && t.capacity === cap);
        row[cap] = match ? { mop: match.mop, rank: match.rank, volume: match.volume, revenue: match.revenue } : null;
      });
      return row;
    });
  }, [mopData]);

  // Unique Brands from MOP Table
  const uniqueBrands4 = useMemo(() => {
    if (!mopData) return [];
    return Array.from(new Set(mopData.table.map((item) => item.brand)));
  }, [mopData]);

  // Format Recharts Line Chart MOP Trend Data
  const lineChartData4 = useMemo(() => {
    if (!mopData) return [];
    return mopData.trend.map((p) => {
      const row: any = {
        period: p.period,
      };
      uniqueBrands4.forEach((brand) => {
        row[brand] = p.capacity_trends[selectedMopCapacity]?.[brand] || null;
      });
      return row;
    });
  }, [mopData, selectedMopCapacity, uniqueBrands4]);

  const CustomTooltip4 = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 border border-border p-4 rounded-xl shadow-xl backdrop-blur-md min-w-[200px]">
          <p className="font-bold text-sm text-foreground mb-1.5 border-b border-border pb-1.5">
            {label} ({selectedMopCapacity})
          </p>
          <div className="space-y-1.5">
            {payload
              .sort((a: any, b: any) => b.value - a.value)
              .map((p: any) => (
                <div key={p.name} className="flex items-center justify-between gap-6 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getBrandColor(p.name) }}
                    />
                    <span className="font-medium text-foreground">{p.name}</span>
                  </div>
                  <span className="font-bold text-foreground">
                    {formatCurrency(p.value)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50/70 dark:bg-zinc-950 p-4 md:p-6 lg:p-8 font-sans transition-colors">
      <div className="max-w-[1400px] mx-auto space-y-8">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <BarChart3 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              Marketing Intelligence Analytics
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Perform deep market share analysis, competitor comparisons, and branch volume tracking
            </p>
          </div>
        </div>

        {/* CONTROLS BAR */}
        <Card className="shadow-sm border-border bg-card">
          <CardContent className="p-4 flex flex-col lg:flex-row items-center justify-between gap-4">

            {/* Appliance Selector */}
            <div className="flex flex-col gap-2.5 w-full lg:w-auto">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <ShoppingBag className="w-3.5 h-3.5" />
                Appliance:
              </span>
              <div className="flex bg-muted/60 p-1 rounded-xl border border-border/60">
                <button
                  onClick={() => setApplianceType("WM")}
                  className={cn(
                    "text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all",
                    applianceType === "WM"
                      ? "bg-background text-foreground shadow-sm font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  WM
                </button>
                <button
                  onClick={() => setApplianceType("AC")}
                  className={cn(
                    "text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all",
                    applianceType === "AC"
                      ? "bg-background text-foreground shadow-sm font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  AC
                </button>
              </div>
            </div>

            {/* Category Selector (If WM selected) */}
            {applianceType === "WM" && (
              <div className="flex flex-col gap-2.5 w-full lg:w-auto">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" />
                  Category:
                </span>
                <div className="flex bg-muted/60 p-1 rounded-xl border border-border/60">
                  <button
                    onClick={() => setCategory("ALL")}
                    className={cn(
                      "text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all",
                      category === "ALL"
                        ? "bg-background text-foreground shadow-sm font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    ALL
                  </button>
                  <button
                    onClick={() => setCategory("FL")}
                    className={cn(
                      "text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all",
                      category === "FL"
                        ? "bg-background text-foreground shadow-sm font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Front Load
                  </button>
                  <button
                    onClick={() => setCategory("TL")}
                    className={cn(
                      "text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all",
                      category === "TL"
                        ? "bg-background text-foreground shadow-sm font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Top Load
                  </button>
                  <button
                    onClick={() => setCategory("WDR")}
                    className={cn(
                      "text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all",
                      category === "WDR"
                        ? "bg-background text-foreground shadow-sm font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    WDR
                  </button>
                </div>
              </div>
            )}

            {/* Duration Selector */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
              <div className="flex flex-col gap-2.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Duration:
                </span>
                <div className="flex bg-muted/60 p-1 rounded-xl border border-border/60 flex-wrap gap-0.5">
                  {[
                    { id: "all", label: "All Time" },
                    { id: "1m", label: "1 Month" },
                    { id: "3m", label: "3 Months" },
                    { id: "6m", label: "6 Months" },
                    { id: "12m", label: "12 Months" },
                    { id: "custom", label: "Custom Range" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setDuration(item.id as any)}
                      className={cn(
                        "text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all",
                        duration === item.id
                          ? "bg-background text-foreground shadow-sm font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {duration === "custom" && globalPeriods.length > 0 && (
                <div className="flex items-center gap-2 mt-4 sm:mt-6 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">From</span>
                    <select
                      value={startPeriod}
                      onChange={(e) => setStartPeriod(e.target.value)}
                      className="bg-muted/50 border border-border px-2.5 py-1.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-foreground cursor-pointer"
                    >
                      {[...globalPeriods].reverse().map((p) => (
                        <option key={`from-${p.value}`} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">To</span>
                    <select
                      value={endPeriod}
                      onChange={(e) => setEndPeriod(e.target.value)}
                      className="bg-muted/50 border border-border px-2.5 py-1.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-foreground cursor-pointer"
                    >
                      {globalPeriods.map((p) => (
                        <option key={`to-${p.value}`} value={p.value} disabled={p.value < startPeriod}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

          </CardContent>
        </Card>

        {/* METRICS ROW */}
        {chart1Data.length > 0 && !loading1 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <Card className="shadow-sm border-border bg-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                    <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Total Industry Volume
                  </div>
                </div>
                <div className="text-3xl font-bold tracking-tight text-foreground">
                  {totalIndustryVolume.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Sum of all brand sales units in selected scope
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border bg-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
                    <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Market Leader
                  </div>
                </div>
                <div className="text-3xl font-bold tracking-tight text-foreground flex items-baseline gap-2">
                  <span>{leadingBrandOverall.name}</span>
                  <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    {leadingBrandOverall.share}% Share
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Top performing brand overall in chosen period
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border bg-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
                    <Globe2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Largest Branch (State)
                  </div>
                </div>
                <div className="text-3xl font-bold tracking-tight text-foreground flex items-baseline gap-2 truncate">
                  <span className="truncate">{topBranch?.state || "N/A"}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Branch with highest volume ({topBranch?.industry_volume.toLocaleString()} units)
                </p>
              </CardContent>
            </Card>

          </div>
        )}

        {/* ERROR STATE */}
        {error1 && (
          <Card className="border-red-100 bg-red-50 dark:bg-red-950/20 dark:border-red-900/50">
            <CardContent className="p-4 flex items-center gap-3 text-red-600 dark:text-red-400">
              <Activity className="w-5 h-5 flex-shrink-0 animate-pulse" />
              <span className="text-sm font-semibold">{error1}</span>
            </CardContent>
          </Card>
        )}

        {/* CHART 1: BRANCH MARKET SHARE */}
        {loading1 ? (
          <Card className="shadow-sm border-border h-[450px] flex items-center justify-center bg-card">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Activity className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-sm font-semibold">Generating Market Share Analytics...</p>
            </div>
          </Card>
        ) : chart1Data.length > 0 ? (
          <div className="space-y-6">

            {/* CHART CARD */}
            <Card className="shadow-sm border-border overflow-hidden bg-card">
              <CardHeader className="bg-muted/10 border-b border-border pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                  <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Branch Market Share (%) & Industry Volume (Units)
                </CardTitle>
                <CardDescription>
                  Grouped bars show market share percentage (left Y-axis); Purple line shows total Industry Volume (right Y-axis).
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {/* Local Section 1 Filters Controls Row */}
                <div className="flex flex-col sm:flex-row sm:items-center flex-wrap gap-4 p-4 bg-muted/20 border border-border/40 rounded-2xl mb-6">
                  <div className="flex flex-wrap items-center gap-4">
                    {/* Multiselect Brands */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Brand:
                      </span>
                      <MultiSelect
                        options={allBrands}
                        selected={section1SelectedBrands}
                        onChange={setSection1SelectedBrands}
                        placeholder="All Brands"
                      />
                    </div>

                    {/* Multiselect States */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Branch:
                      </span>
                      <MultiSelect
                        options={globalStates}
                        selected={section1SelectedStates}
                        onChange={setSection1SelectedStates}
                        placeholder="All Branches (States)"
                      />
                    </div>

                    {/* Multiselect Cities */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        City:
                      </span>
                      <MultiSelect
                        options={section1AvailableCities}
                        selected={section1SelectedCities}
                        onChange={setSection1SelectedCities}
                        placeholder="All Cities"
                      />
                    </div>
                  </div>
                </div>

                <div className="h-[400px] w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <ComposedChart data={chartData1} margin={{ top: 20, right: 20, left: -10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                      <XAxis
                        dataKey="state"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#888888', fontWeight: 500 }}
                        dy={10}
                      />
                      <YAxis
                        yAxisId="left"
                        domain={[0, 100]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#888888' }}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#888888' }}
                        tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
                      />
                      <RechartsTooltip content={<CustomTooltip1 />} />
                      <Legend
                        verticalAlign="top"
                        height={36}
                        iconType="circle"
                        wrapperStyle={{ fontSize: 12 }}
                      />
                      {uniqueBrands1.map((brand) => (
                        <Bar
                          key={brand}
                          yAxisId="left"
                          dataKey={brand}
                          name={brand}
                          fill={getBrandColor(brand)}
                          radius={[4, 4, 0, 0]}
                          maxBarSize={30}
                        />
                      ))}
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="industry_volume"
                        name="Industry Volume"
                        stroke="#8b5cf6"
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                        activeDot={{ r: 6 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* DETAIL DATA GRID */}
            <Card className="shadow-sm border-border bg-card overflow-hidden">
              <CardHeader className="bg-muted/10 border-b border-border pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-bold text-foreground">Branch In-depth Share Details</CardTitle>
                  <CardDescription>
                    Detailed report of volume sales and brand standings per branch.
                  </CardDescription>
                </div>

                {/* Comparison Period Selector */}
                {showComparison && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 animate-in fade-in duration-200">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Compare share with:
                    </span>
                    <div className="flex bg-muted/65 p-0.5 rounded-lg border border-border/60">
                      {[
                        { id: "1m", label: "1 Month Ago" },
                        { id: "3m", label: "3 Months Ago" },
                        { id: "6m", label: "6 Months Ago" },
                        { id: "12m", label: "12 Months Ago" },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => setCompareOffset(opt.id as any)}
                          className={cn(
                            "text-[10px] px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer",
                            compareOffset === opt.id
                              ? "bg-background text-foreground shadow-sm font-semibold"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto w-full">
                  <table className="text-xs w-full min-w-max border-collapse">
                    <thead>
                      <tr className="bg-muted/40 border-b border-border text-muted-foreground text-left font-semibold">
                        <th className="py-2.5 px-4">Branch (State)</th>
                        <th className="py-2.5 px-4 text-right">Industry Volume</th>
                        {uniqueBrands1.map((brand) => (
                          <th key={brand} className="py-2.5 px-4 text-right">{brand} Share</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-foreground">
                      {chart1Data.map((row) => (
                        <tr key={row.state} className="hover:bg-muted/10 transition-colors h-9">
                          <td className="py-1 px-4 font-semibold">{row.state}</td>
                          <td className="py-1 px-4 text-right font-medium">{row.industry_volume.toLocaleString()} units</td>
                          {uniqueBrands1.map((brand) => {
                            const share = row.brand_shares[brand] || 0.0;
                            const trend = row.brand_trends ? row.brand_trends[brand] : null;
                            return (
                              <td key={brand} className="py-1 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <span className="font-bold" style={{ color: getBrandColor(brand) }}>
                                    {share}%
                                  </span>
                                  {trend !== null && trend !== undefined && (
                                    trend > 0 ? (
                                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center shrink-0" title={`Increased by +${trend}%`}>
                                        <ArrowUp className="w-2.5 h-2.5 mr-0.5 fill-emerald-600 dark:fill-emerald-400" />
                                        {trend}%
                                      </span>
                                    ) : trend < 0 ? (
                                      <span className="text-[10px] text-red-600 dark:text-red-400 font-semibold flex items-center shrink-0" title={`Decreased by ${trend}%`}>
                                        <ArrowDown className="w-2.5 h-2.5 mr-0.5 fill-red-600 dark:fill-red-400" />
                                        {Math.abs(trend)}%
                                      </span>
                                    ) : null
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

          </div>
        ) : (
          <Card className="h-[250px] border border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-muted-foreground bg-card shadow-sm">
            <BarChart3 className="w-12 h-12 opacity-25 mb-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-bold text-foreground">No Analytics Data Found</h3>
            <p className="text-sm mt-1 text-center">
              There are no matching marketing records for the selected filters.
            </p>
          </Card>
        )}

        {/* --- CHART 2: CAPACITY MARKET SHARE DASHBOARD --- */}
        <div className="border-t border-border/80 pt-8 mt-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Layers className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                Market Share Dashboard (by Capacity)
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Analyze competitive brand sales split by washing machine load capacity with interactive trend tracking
              </p>
            </div>
          </div>

          {/* CAPACITY CONTROLS ROW */}
          <div className="flex flex-col sm:flex-row sm:items-center flex-wrap gap-4 p-4 bg-muted/20 border border-border/40 rounded-2xl mb-6">
            <div className="flex flex-wrap items-center gap-4">
              {/* Multiselect Brands */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Brand:
                </span>
                <MultiSelect
                  options={allBrands}
                  selected={section2SelectedBrands}
                  onChange={setSection2SelectedBrands}
                  placeholder="All Brands"
                />
              </div>

              {/* Multiselect States */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Branch:
                </span>
                <MultiSelect
                  options={globalStates}
                  selected={section2SelectedStates}
                  onChange={setSection2SelectedStates}
                  placeholder="All Branches (States)"
                />
              </div>

              {/* Multiselect Cities */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  City:
                </span>
                <MultiSelect
                  options={section2AvailableCities}
                  selected={section2SelectedCities}
                  onChange={setSection2SelectedCities}
                  placeholder="All Cities"
                />
              </div>
            </div>

            {/* Grid metrics View Mode: Volume vs Percentage */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto sm:ml-auto justify-between sm:justify-start">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Activity className="w-3.5 h-3.5" />
                View Standings:
              </span>
              <div className="flex bg-muted/60 p-1 rounded-xl border border-border/60">
                <button
                  onClick={() => setViewType2("shares")}
                  className={cn(
                    "text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all",
                    viewType2 === "shares"
                      ? "bg-background text-foreground shadow-sm font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Market Share (%)
                </button>
                <button
                  onClick={() => setViewType2("units")}
                  className={cn(
                    "text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all",
                    viewType2 === "units"
                      ? "bg-background text-foreground shadow-sm font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Sales Volume (Units)
                </button>
              </div>
            </div>
          </div>

          {/* CAPACITY MAIN CONTENT */}
          {loading2 ? (
            <Card className="shadow-sm border-border h-[450px] flex items-center justify-center bg-card">
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Activity className="w-8 h-8 animate-spin text-purple-600" />
                <p className="text-sm font-semibold">Generating Capacity Market Analytics...</p>
              </div>
            </Card>
          ) : chart2Data && chart2Data.grid.length > 0 ? (
            <div className="space-y-6">

              {/* GRID MATRIX TABLE */}
              <Card className="shadow-sm border-border bg-card overflow-hidden">
                <CardHeader className="bg-muted/10 border-b border-border pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-bold text-foreground">Capacity Share matrix Grid</CardTitle>
                    <CardDescription>
                      Click on any capacity column header to track its monthly trend in the chart below.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Currently Selected:</span>
                    <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold px-2 py-0.5 rounded-lg">
                      {selectedCapacity}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto w-full">
                    <table className="text-xs w-full min-w-max border-collapse">
                      <thead>
                        <tr className="bg-muted/40 border-b border-border text-muted-foreground text-left font-semibold">
                          <th className="py-2.5 px-4 border-r border-border">Brand</th>
                          {capacityBuckets.map((cap) => {
                            const isSelected = selectedCapacity === cap;
                            return (
                              <th
                                key={cap}
                                onClick={() => setSelectedCapacity(cap)}
                                className={cn(
                                  "py-2.5 px-3 text-right cursor-pointer hover:bg-muted transition-all select-none border-r border-border last:border-r-0",
                                  isSelected && "bg-blue-50/70 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-extrabold border-b-2 border-b-blue-600"
                                )}
                              >
                                <div className="flex items-center justify-end gap-1">
                                  <span>{cap}</span>
                                  {isSelected && <Check className="w-3 h-3 flex-shrink-0" />}
                                </div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border text-foreground">
                        {chart2Data.grid.map((row) => (
                          <tr key={row.brand} className="hover:bg-muted/10 transition-colors h-9">
                            <td className="py-1 px-4 font-semibold border-r border-border flex items-center gap-2 h-9">
                              <div
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: getBrandColor(row.brand) }}
                              />
                              <span>{row.brand}</span>
                            </td>
                            {capacityBuckets.map((cap) => {
                              const isSelected = selectedCapacity === cap;
                              const share = row.shares[cap] || 0.0;
                              const units = row.units[cap] || 0;
                              return (
                                <td
                                  key={cap}
                                  onClick={() => setSelectedCapacity(cap)}
                                  className={cn(
                                    "py-1 px-3 text-right cursor-pointer border-r border-border last:border-r-0 transition-colors",
                                    isSelected && "bg-blue-50/30 dark:bg-blue-950/20 font-bold text-foreground"
                                  )}
                                >
                                  {viewType2 === "shares" ? (
                                    <span style={{ color: getBrandColor(row.brand) }}>
                                      {share}%
                                    </span>
                                  ) : (
                                    <span>{units.toLocaleString()}</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                        {/* Total Row */}
                        <tr className="bg-muted/20 font-semibold h-9 border-t border-border">
                          <td className="py-2 px-4 border-r border-border">Industry Volume</td>
                          {capacityBuckets.map((cap) => {
                            const isSelected = selectedCapacity === cap;
                            const total = chart2Data.capacity_totals[cap] || 0;
                            return (
                              <td
                                key={cap}
                                onClick={() => setSelectedCapacity(cap)}
                                className={cn(
                                  "py-2 px-3 text-right cursor-pointer border-r border-border last:border-r-0 transition-colors",
                                  isSelected && "bg-blue-50/40 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-bold"
                                )}
                              >
                                {total.toLocaleString()}
                              </td>
                            );
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* MONTHLY LINE CHART TREND */}
              <Card className="shadow-sm border-border overflow-hidden bg-card">
                <CardHeader className="bg-muted/10 border-b border-border pb-4">
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                    <LineChartIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    Monthly Brand standings for {selectedCapacity} ({viewType2 === "shares" ? "Market Share %" : "Volume u"})
                  </CardTitle>
                  <CardDescription>
                    Tracks how the brands compare month-over-month specifically within the selected {selectedCapacity} capacity.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {lineChartData2.length > 0 ? (
                    <div className="h-[300px] w-full min-w-0">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <LineChart data={lineChartData2} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                          <XAxis
                            dataKey="period"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#888888' }}
                            dy={10}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#888888' }}
                            tickFormatter={(value) => viewType2 === "shares" ? `${value}%` : (value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value)}
                          />
                          <RechartsTooltip content={<CustomTooltip2 />} />
                          <Legend
                            verticalAlign="top"
                            height={36}
                            iconType="circle"
                            wrapperStyle={{ fontSize: 12 }}
                          />
                          {uniqueBrands2.map((brand) => (
                            <Line
                              key={brand}
                              type="monotone"
                              dataKey={brand}
                              name={brand}
                              stroke={getBrandColor(brand)}
                              strokeWidth={3}
                              dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                              activeDot={{ r: 6 }}
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                      No monthly trend data available in this scope.
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>
          ) : (
            <Card className="h-[250px] border border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-muted-foreground bg-card shadow-sm">
              <LineChartIcon className="w-12 h-12 opacity-25 mb-4 text-purple-600 dark:text-purple-400" />
              <h3 className="text-lg font-bold text-foreground">No Capacity Analytics Found</h3>
              <p className="text-sm mt-1 text-center">
                There are no matching capacity records. Try changing State or City filters.
              </p>
            </Card>
          )}

        </div>

        {/* --- CHART 3: SKU STANDINGS & AVG SELLING PRICE --- */}
        <div className="border-t border-border/80 pt-8 mt-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Tag className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                SKU based Vol and Avg Selling price per brand
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                {skuType === "item"
                  ? "Shows top item models (SKUs) sold per brand, their sales volume standings, and weighted Average Selling Price (ASP)."
                  : "Shows load capacities sold per brand, their sales volume standings, and weighted Average Selling Price (ASP)."}
              </p>
            </div>

            <div className="flex items-center gap-4 self-end md:self-auto">
              {/* Switch Switcher */}
              <div className="flex bg-muted/60 p-1 rounded-xl border border-border/60">
                <button
                  onClick={() => setSkuType("item")}
                  className={cn(
                    "text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all",
                    skuType === "item"
                      ? "bg-background text-foreground shadow-sm font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Item SKUs
                </button>
                <button
                  onClick={() => setSkuType("capacity")}
                  className={cn(
                    "text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all",
                    skuType === "capacity"
                      ? "bg-background text-foreground shadow-sm font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Capacity SKUs
                </button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSkuSectionCollapsed(!isSkuSectionCollapsed)}
                className="gap-1.5 text-xs hover:bg-muted font-semibold transition-all px-3 py-1.5 rounded-xl flex-shrink-0"
              >
                {isSkuSectionCollapsed ? (
                  <>
                    <span>Expand</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    <span>Minimize</span>
                    <ChevronUp className="w-3.5 h-3.5" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {!isSkuSectionCollapsed && (
            <div className="space-y-6">
              {/* Local SKU Filters Controls Row */}
              <div className="flex flex-col sm:flex-row sm:items-center flex-wrap gap-4 p-4 bg-muted/20 border border-border/40 rounded-2xl">
                <div className="flex flex-wrap items-center gap-4">
                  {/* Multiselect Brands */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Brand:
                    </span>
                    <MultiSelect
                      options={allBrands}
                      selected={section3SelectedBrands}
                      onChange={setSection3SelectedBrands}
                      placeholder="All Brands"
                    />
                  </div>

                  {/* Multiselect States */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Branch:
                    </span>
                    <MultiSelect
                      options={globalStates}
                      selected={section3SelectedStates}
                      onChange={setSection3SelectedStates}
                      placeholder="All Branches (States)"
                    />
                  </div>

                  {/* Multiselect Cities */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      City:
                    </span>
                    <MultiSelect
                      options={section3AvailableCities}
                      selected={section3SelectedCities}
                      onChange={setSection3SelectedCities}
                      placeholder="All Cities"
                    />
                  </div>
                </div>
              </div>

              {loading3 ? (
                <Card className="shadow-sm border-border h-[300px] flex items-center justify-center bg-card">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <Activity className="w-8 h-8 animate-spin text-blue-600" />
                    <p className="text-sm font-semibold">Generating SKU Standings...</p>
                  </div>
                </Card>
              ) : Object.keys(skuData).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {Object.entries(skuData).map(([brand, skus]) => {
                    const sortedSkus = getSortedSkus(brand, skus);
                    return (
                      <Card key={brand} className="shadow-sm border-border bg-card overflow-hidden">
                        <CardHeader className="py-3 px-4 border-b border-border flex flex-row items-center justify-between" style={{ borderLeft: `4px solid ${getBrandColor(brand)}` }}>
                          <CardTitle className="text-sm font-bold text-foreground uppercase tracking-wider">
                            {brand}
                          </CardTitle>
                          <span className="text-[10px] text-muted-foreground font-semibold px-2 py-0.5 bg-muted rounded-full">
                            {skus.length} {skuType === "item" ? "SKUs" : "Capacities"}
                          </span>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="overflow-x-auto w-full">
                            <table className="text-xs w-full min-w-[280px] border-collapse">
                              <thead>
                                <tr className="bg-muted/30 border-b border-border text-muted-foreground font-semibold text-left select-none">
                                  <th
                                    onClick={() => handleBrandSort(brand, "sku")}
                                    className="py-2 px-3 cursor-pointer hover:text-foreground group transition-colors"
                                  >
                                    <div className="flex items-center gap-1">
                                      <span>{skuType === "item" ? "SKU" : "Capacity"}</span>
                                      {renderSortIndicator(brand, "sku")}
                                    </div>
                                  </th>
                                  <th
                                    onClick={() => handleBrandSort(brand, "volume")}
                                    className="py-2 px-3 text-right cursor-pointer hover:text-foreground group transition-colors"
                                  >
                                    <div className="flex items-center justify-end gap-1">
                                      <span>Vol</span>
                                      {renderSortIndicator(brand, "volume")}
                                    </div>
                                  </th>
                                  <th
                                    onClick={() => handleBrandSort(brand, "asp")}
                                    className="py-2 px-3 text-right cursor-pointer hover:text-foreground group transition-colors"
                                  >
                                    <div className="flex items-center justify-end gap-1">
                                      <span>ASP</span>
                                      {renderSortIndicator(brand, "asp")}
                                    </div>
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border text-foreground">
                                {sortedSkus.map((item) => (
                                  <tr key={item.sku} className="hover:bg-muted/10 transition-colors h-8">
                                    <td className="py-1 px-3 font-semibold font-mono truncate max-w-[120px]">{item.sku}</td>
                                    <td className="py-1 px-3 text-right font-medium">{item.volume.toLocaleString()}</td>
                                    <td className="py-1 px-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                                      {formatCurrency(item.asp)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="h-[200px] border border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-muted-foreground bg-card shadow-sm">
                  <Tag className="w-12 h-12 opacity-25 mb-4 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-lg font-bold text-foreground">No Records Found</h3>
                  <p className="text-sm mt-1 text-center">
                    There are no matching SKU records for the selected filters.
                  </p>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* --- CHART 4: MARKET OPERATING PRICE (MOP) ANALYTICS --- */}
        <div className="border-t border-border/80 pt-8 mt-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <IndianRupee className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                Market Operating Price (MOP) Analytics
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Analyzes the Market Operating Price (MOP) and pricing positioning rank of competitive brands per washing machine capacity.
              </p>
            </div>

            <div className="flex items-center gap-4 self-end md:self-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMopSectionCollapsed(!isMopSectionCollapsed)}
                className="gap-1.5 text-xs hover:bg-muted font-semibold transition-all px-3 py-1.5 rounded-xl flex-shrink-0"
              >
                {isMopSectionCollapsed ? (
                  <>
                    <span>Expand</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    <span>Minimize</span>
                    <ChevronUp className="w-3.5 h-3.5" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {!isMopSectionCollapsed && (
            <div className="space-y-6">
              {/* Local MOP Filters Controls Row */}
              <div className="flex flex-col sm:flex-row sm:items-center flex-wrap gap-4 p-4 bg-muted/20 border border-border/40 rounded-2xl">
                <div className="flex flex-wrap items-center gap-4">
                  {/* Multiselect Brands */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Brand:
                    </span>
                    <MultiSelect
                      options={allBrands}
                      selected={section4SelectedBrands}
                      onChange={setSection4SelectedBrands}
                      placeholder="All Brands"
                    />
                  </div>

                  {/* Multiselect States */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Branch:
                    </span>
                    <MultiSelect
                      options={globalStates}
                      selected={section4SelectedStates}
                      onChange={setSection4SelectedStates}
                      placeholder="All Branches (States)"
                    />
                  </div>

                  {/* Multiselect Cities */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      City:
                    </span>
                    <MultiSelect
                      options={section4AvailableCities}
                      selected={section4SelectedCities}
                      onChange={setSection4SelectedCities}
                      placeholder="All Cities"
                    />
                  </div>
                </div>
              </div>

              {loading4 ? (
                <Card className="shadow-sm border-border h-[300px] flex items-center justify-center bg-card">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <Activity className="w-8 h-8 animate-spin text-emerald-600" />
                    <p className="text-sm font-semibold">Generating MOP Standings...</p>
                  </div>
                </Card>
              ) : mopData && mopGridData.length > 0 ? (
                <div className="space-y-6">

                  {/* MOP STANDINGS TABLE MATRIX */}
                  <Card className="shadow-sm border-border bg-card overflow-hidden">
                    <CardHeader className="bg-muted/10 border-b border-border pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <CardTitle className="text-base font-bold text-foreground">
                          Brand MOP matrix Grid
                        </CardTitle>
                        <CardDescription>
                          Compare average Market Operating Prices across all load capacities. Click on any capacity column header to track its monthly trend below.
                        </CardDescription>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4">
                        {/* Rank By switcher */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            Rank By:
                          </span>
                          <div className="flex bg-muted/65 p-0.5 rounded-lg border border-border/60">
                            {[
                              { id: "price", label: "Avg Price" },
                              { id: "volume", label: "Max Volume" },
                              { id: "revenue", label: "Max Vol * Price" },
                            ].map((opt) => (
                              <button
                                key={opt.id}
                                onClick={() => setMopRankBy(opt.id as any)}
                                className={cn(
                                  "text-[10px] px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer",
                                  mopRankBy === opt.id
                                    ? "bg-background text-foreground shadow-sm font-semibold"
                                    : "text-muted-foreground hover:text-foreground"
                                )}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground">Currently Selected:</span>
                          <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-lg">
                            {selectedMopCapacity}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto w-full">
                        <table className="text-xs w-full min-w-max border-collapse">
                          <thead>
                            <tr className="bg-muted/40 border-b border-border text-muted-foreground text-left font-semibold">
                              <th className="py-2.5 px-4 border-r border-border">Brand</th>
                              {capacityBuckets.map((cap) => {
                                const isSelected = selectedMopCapacity === cap;
                                return (
                                  <th
                                    key={cap}
                                    onClick={() => setSelectedMopCapacity(cap)}
                                    className={cn(
                                      "py-2.5 px-3 text-right cursor-pointer hover:bg-muted transition-all select-none border-r border-border last:border-r-0",
                                      isSelected && "bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-extrabold border-b-2 border-b-emerald-600"
                                    )}
                                  >
                                    <div className="flex items-center justify-end gap-1">
                                      <span>{cap}</span>
                                      {isSelected && <Check className="w-3 h-3 flex-shrink-0" />}
                                    </div>
                                  </th>
                                );
                              })}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border text-foreground">
                            {mopGridData.map((row) => (
                              <tr key={row.brand} className="hover:bg-muted/10 transition-colors h-11">
                                <td className="py-1 px-4 font-semibold border-r border-border flex items-center gap-2 h-11">
                                  <div
                                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: getBrandColor(row.brand) }}
                                  />
                                  <span>{row.brand}</span>
                                </td>
                                {capacityBuckets.map((cap) => {
                                  const isSelected = selectedMopCapacity === cap;
                                  const cell = row[cap];
                                  if (!cell) {
                                    return (
                                      <td
                                        key={cap}
                                        onClick={() => setSelectedMopCapacity(cap)}
                                        className={cn(
                                          "py-1 px-3 text-right cursor-pointer border-r border-border last:border-r-0 text-muted-foreground/30 transition-colors",
                                          isSelected && "bg-emerald-50/20 dark:bg-emerald-950/10"
                                        )}
                                      >
                                        -
                                      </td>
                                    );
                                  }
                                  const isHighest = cell.rank === 1;
                                  return (
                                    <td
                                      key={cap}
                                      onClick={() => setSelectedMopCapacity(cap)}
                                      className={cn(
                                        "py-1 px-3 text-right cursor-pointer border-r border-border last:border-r-0 transition-colors",
                                        isSelected && "bg-emerald-50/30 dark:bg-emerald-950/20 font-bold",
                                        isHighest && "bg-emerald-50/50 dark:bg-emerald-950/30"
                                      )}
                                    >
                                      <div className="flex flex-col items-end justify-center">
                                        <span className={cn(
                                          "font-bold text-foreground",
                                          isHighest && "text-emerald-700 dark:text-emerald-400 font-extrabold"
                                        )}>
                                          {mopRankBy === "price"
                                            ? formatCurrency(cell.mop)
                                            : mopRankBy === "volume"
                                              ? `${cell.volume?.toLocaleString()} units`
                                              : formatLargeCurrency(cell.revenue || 0)}
                                        </span>
                                        <span className={cn(
                                          "text-[9px] font-medium text-muted-foreground",
                                          isHighest && "text-emerald-600 dark:text-emerald-400 font-extrabold"
                                        )}>
                                          Rank {cell.rank}
                                        </span>
                                      </div>
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* MONTHLY MOP TREND LINE CHART */}
                  <Card className="shadow-sm border-border overflow-hidden bg-card">
                    <CardHeader className="bg-muted/10 border-b border-border pb-4">
                      <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                        <LineChartIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        Monthly MOP trends for {selectedMopCapacity}
                      </CardTitle>
                      <CardDescription>
                        Tracks average pricing trends month-over-month specifically for the selected {selectedMopCapacity} capacity.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      {lineChartData4.length > 0 ? (
                        <div className="h-[300px] w-full min-w-0">
                          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <LineChart data={lineChartData4} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                              <XAxis
                                dataKey="period"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: '#888888' }}
                                dy={10}
                              />
                              <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: '#888888' }}
                                tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
                              />
                              <RechartsTooltip content={<CustomTooltip4 />} />
                              <Legend
                                verticalAlign="top"
                                height={36}
                                iconType="circle"
                                wrapperStyle={{ fontSize: 12 }}
                              />
                              {uniqueBrands4.map((brand) => (
                                <Line
                                  key={brand}
                                  type="monotone"
                                  dataKey={brand}
                                  name={brand}
                                  stroke={getBrandColor(brand)}
                                  strokeWidth={3}
                                  dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                                  activeDot={{ r: 6 }}
                                  connectNulls
                                />
                              ))}
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                          No monthly pricing trend data available in this scope.
                        </div>
                      )}
                    </CardContent>
                  </Card>

                </div>
              ) : (
                <Card className="h-[200px] border border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-muted-foreground bg-card shadow-sm">
                  <IndianRupee className="w-12 h-12 opacity-25 mb-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-lg font-bold text-foreground">No MOP Standings Found</h3>
                  <p className="text-sm mt-1 text-center">
                    There are no matching market operating price records for the selected scope.
                  </p>
                </Card>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
