/** Stored in `vehicles.vehicle_type` and form field `vehicle_type`. */
export enum VehicleType {
  CarUnder2t = "car_under_2t",
  Minivan = "minivan",
  Truck = "truck",
  Motorcycle = "motorcycle",
  Trailer = "trailer",
  Bus = "bus",
  ElectricCar = "electric_car",
  Other = "other",
}

/** Display / form order (matches previous inline arrays). */
export const VEHICLE_TYPES: [VehicleType, ...VehicleType[]] = [
  VehicleType.CarUnder2t,
  VehicleType.Minivan,
  VehicleType.Truck,
  VehicleType.Motorcycle,
  VehicleType.Trailer,
  VehicleType.Bus,
  VehicleType.ElectricCar,
  VehicleType.Other,
];

const VEHICLE_TYPE_ICON: Record<VehicleType, string> = {
  [VehicleType.CarUnder2t]: "/vehicle_icons/vehicle_icons_01.png",
  [VehicleType.Minivan]: "/vehicle_icons/vehicle_icons_02.png",
  [VehicleType.Truck]: "/vehicle_icons/vehicle_icons_03.png",
  [VehicleType.Motorcycle]: "/vehicle_icons/vehicle_icons_04.png",
  [VehicleType.Trailer]: "/vehicle_icons/vehicle_icons_05.png",
  [VehicleType.Bus]: "/vehicle_icons/vehicle_icons_06.png",
  [VehicleType.ElectricCar]: "/vehicle_icons/vehicle_icons_07.png",
  [VehicleType.Other]: "/vehicle_icons/vehicle_icons_08.png",
};

export function getVehicleTypeIconSrc(type: VehicleType): string {
  return VEHICLE_TYPE_ICON[type];
}
