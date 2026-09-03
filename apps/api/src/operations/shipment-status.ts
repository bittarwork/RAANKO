export const SHIPMENT_STATUSES = [
  'draft',
  'booked',
  'in_transit',
  'arrived',
  'delivered',
  'cancelled',
] as const;

export type ShipmentStatusValue = (typeof SHIPMENT_STATUSES)[number];

/** Allowed next statuses for each current shipment status. */
export const SHIPMENT_TRANSITIONS: Record<
  ShipmentStatusValue,
  ShipmentStatusValue[]
> = {
  draft: ['booked', 'cancelled'],
  booked: ['in_transit', 'cancelled'],
  in_transit: ['arrived', 'cancelled'],
  arrived: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

export function canTransitionShipment(
  from: string,
  to: string,
): boolean {
  const allowed = SHIPMENT_TRANSITIONS[from as ShipmentStatusValue];
  if (!allowed) return false;
  return allowed.includes(to as ShipmentStatusValue);
}
