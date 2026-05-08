export type Vehicle = {
  id: string;
  user_id: string;
  organization_id?: string;
  make: string;
  model: string;
  vehicle_type: string;
  year: number;
  license_plate: string;
  odometer: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  last_odometer_update_at?: string;
  last_odometer_reminder_sent_at?: string | null;
};

export type MaintenanceType =
  | "OIL_CHANGE"
  | "BRAKES"
  | "TIRES"
  | "BATTERY"
  | "FILTERS"
  | "TIMING_BELT"
  | "OTHER";

export type MaintenanceRecord = {
  id: string;
  vehicle_id: string;
  type: MaintenanceType;
  date: string;
  odometer: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
};

export type ExpiryType =
  | "ITP"
  | "RCA"
  | "CASCO"
  | "VIGNETTE"
  | "ROVINIETA"
  | "OTHER";

export type ExpiryItem = {
  id: string;
  vehicle_id: string;
  type: ExpiryType;
  expiry_date: string;
  cost: string | number | null;
  is_active?: boolean;
  negated_at?: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
};

export type Invite = {
  id: string;
  email: string;
  token: string;
  expires_at: string;
  used: boolean;
  created_at: string;
};
