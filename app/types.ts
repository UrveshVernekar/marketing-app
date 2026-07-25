export type AlternativePart = {
  part_code: string;
  part_description: string;
};

export type UserCheckDetail = {
  email: string;
  first_name: string;
  last_name: string;
  is_checked: boolean;
  checked_at?: string;
  unchecked_at?: string;
};

export type Item = {
  material_code: string;
  material_description: string;
  vendor: string;
  machine_population: number;
  current_stock: number;
  coverage_days: number;
  three_m_avg: number;
  twelve_m_avg: number;
  price: number;
  status: string;
  product_category?: string;
  lead_time: number;
  lead_time_qty?: number;
  pending_reorders?: number;
  delta: number;
  total_lead_time: number;
  month1_prediction?: number;
  month1_prediction_days?: number;
  month1_po?: number;
  month1_po_days?: number;
  month1_mes?: number;
  month1_mes_days?: number;
  month2_prediction?: number;
  month2_prediction_days?: number;
  month2_po?: number;
  month2_po_days?: number;
  month2_mes?: number;
  month2_mes_days?: number;
  month3_prediction?: number;
  month3_prediction_days?: number;
  month3_po?: number;
  month3_po_days?: number;
  month3_mes?: number;
  month3_mes_days?: number;
  month1_date?: string;
  month2_date?: string;
  month3_date?: string;
  is_checked?: boolean;
  checks?: UserCheckDetail[];
  remarks?: string;
  actual_month1_po?: number | null;
  actual_month1_mes?: number | null;
  actual_month1_mes_days?: number | null;
  actual_month2_po?: number | null;
  actual_month2_mes?: number | null;
  actual_month2_mes_days?: number | null;
  actual_month3_po?: number | null;
  actual_month3_mes?: number | null;
  actual_month3_mes_days?: number | null;
  alternative_parts?: AlternativePart[];
  part_type?: string;
};

export type TrendData = {
  year: number;
  month: number;
  formatted_date: string;
  total_consumption: number;
};

export type KPIs = {
  total_materials: number;
  active_materials: number;
  critical_stock: number;
  low_stock: number;
  avg_coverage_days: number;
  obsolete_count: number;
};

export type PurchaseOrder = {
  id: number;
  material_code: string;
  po_number: string;
  order_qty: number;
  receive_qty: number;
  year: number;
  month: number;
  period_date?: string;
  user_id?: number | null;
  user?: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  created_at?: string;
  updated_at?: string;
};
