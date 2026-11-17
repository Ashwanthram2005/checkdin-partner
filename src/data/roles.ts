// Mirrors the `partner_roles` table in the backend. The role a user logs in with
// decides which parts of the dashboard they can open.
export type RoleId = 'prole1' | 'prole2' | 'prole3' | 'prole4' | 'prole5';

export interface Role {
  id: RoleId;
  name: string;
  level: 'High' | 'Medium' | 'Low';
  description: string;
  permissions: string[];
}

export const ROLES: Record<RoleId, Role> = {
  prole1: { id: 'prole1', name: 'Owner', level: 'High', description: 'Full access to all hotel operations', permissions: ['all'] },
  prole2: { id: 'prole2', name: 'Manager', level: 'Medium', description: 'Manage daily operations and staff', permissions: ['bookings', 'rooms', 'staff', 'reports'] },
  prole3: { id: 'prole3', name: 'Receptionist', level: 'Low', description: 'Handle check-in/check-out and guest queries', permissions: ['bookings', 'checkin', 'checkout'] },
  prole4: { id: 'prole4', name: 'Housekeeping', level: 'Low', description: 'Manage room cleaning and maintenance', permissions: ['rooms', 'maintenance'] },
  prole5: { id: 'prole5', name: 'Night Auditor', level: 'Medium', description: 'Overnight operations and report generation', permissions: ['bookings', 'reports', 'finance'] },
};

export const can = (role: Role, permission: string) =>
  role.permissions.includes('all') || role.permissions.includes(permission);
