import type { RoleId } from './roles';

export interface HotelUser {
  id: string;
  name: string;
  role_id: RoleId;
}

export type Lookup = { email: string } | { hotelId: string };

/**
 * STEP 1: find the users who can log in to a hotel.
 * MOCK DATA — replace with POST /auth/partner/login { hotelId } (backend returns { step: 2, users }).
 * The backend has no email lookup yet, so the `email` branch needs a new endpoint.
 */
export async function findHotelUsers(_lookup: Lookup): Promise<{ hotelName: string; users: HotelUser[] }> {
  await new Promise((r) => setTimeout(r, 600));
  return {
    hotelName: 'Hotel Empire',
    users: [
      { id: 'pu1', name: 'Empire Admin', role_id: 'prole1' },
      { id: 'pu2', name: 'Priya Nair', role_id: 'prole2' },
      { id: 'pu3', name: 'Rahul Verma', role_id: 'prole3' },
      { id: 'pu4', name: 'Meena Das', role_id: 'prole4' },
      { id: 'pu5', name: 'Arjun Rao', role_id: 'prole5' },
    ],
  };
}

/**
 * STEP 2: log in as one user.
 * MOCK — replace with POST /auth/partner/login { hotelId, userId, userPassword }.
 * On success the backend returns { token, user: { id, name, role_id, hotel_id } }.
 */
export async function loginAsUser(_userId: string, _password: string): Promise<never> {
  await new Promise((r) => setTimeout(r, 900));
  throw new Error('Login is not connected to the server yet.');
}
