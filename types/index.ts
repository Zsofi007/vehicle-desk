export type Vehicle = {
  id: string;
  user_id: string;
  make: string;
  model: string;
  vehicle_type: string;
  year: number;
  license_plate: string;
  odometer: number;
  created_at: string;
};

export type MaintenanceRecord = {
  id: string;
  vehicle_id: string;
  type: string;
  date: string;
  odometer: number;
  notes: string | null;
};

export type ExpiryItem = {
  id: string;
  vehicle_id: string;
  type: string;
  expiry_date: string;
  cost: string | number | null;
};

export type Invite = {
  id: string;
  email: string;
  token: string;
  expires_at: string;
  used: boolean;
  created_at: string;
};
