// "Book a Session" form on the groups/private-lessons pages (the original's BookingPress booking form).
// Locations, sessions, coaches and schedule are the form's own settings on the live site.

export type BookingStepKey = 'location' | 'service' | 'staffmembers' | 'datetime' | 'cart' | 'basic_details' | 'summary';

export type BookingStep = {
  key: BookingStepKey;
  label: string;
  /** Steps the menu lets you jump to at any time (the others open once reached). */
  alwaysOpen?: boolean;
};

export const bookingSteps: BookingStep[] = [
  { key: 'location', label: 'Location', alwaysOpen: true },
  { key: 'service', label: 'Sessions' },
  { key: 'staffmembers', label: 'Coaches' },
  { key: 'datetime', label: 'Date & Time' },
  { key: 'cart', label: 'Cart Items', alwaysOpen: true },
  { key: 'basic_details', label: 'Basic Details' },
  { key: 'summary', label: 'Summary' },
];

export type BookingCategory = { id: string; name: string };

/** "ALL" first, then the service categories; the form opens on the first real category. */
export const bookingCategories: BookingCategory[] = [
  { id: 'all', name: 'ALL' },
  { id: '1', name: 'GROUPS / PRIVATE LESSONS' },
  { id: '2', name: 'STRENGTH & CONDITIONING' },
];

export type BookingService = { id: string; categoryId: string; name: string; price: number; durationMinutes: number; durationLabel: string };

export const bookingServices: BookingService[] = [
  { id: '4', categoryId: '1', name: 'Baseball', price: 1, durationMinutes: 60, durationLabel: '1 h' },
  { id: '5', categoryId: '1', name: 'Basketball', price: 50, durationMinutes: 60, durationLabel: '1 h' },
  { id: '6', categoryId: '1', name: 'Pickleball', price: 50, durationMinutes: 60, durationLabel: '1 h' },
  { id: '7', categoryId: '1', name: 'Esports', price: 10, durationMinutes: 30, durationLabel: '30 m' },
  { id: '8', categoryId: '1', name: 'Fútbol(Soccer)', price: 10, durationMinutes: 30, durationLabel: '30 m' },
  { id: '9', categoryId: '1', name: 'Golfing', price: 10, durationMinutes: 30, durationLabel: '30 m' },
  { id: '10', categoryId: '2', name: 'Baseball', price: 10, durationMinutes: 60, durationLabel: '60 m' },
];

export type BookingStaff = { id: string; name: string; serviceIds: string[] };

export const bookingStaff: BookingStaff[] = [
  { id: '1', name: 'John CLP', serviceIds: ['5', '6', '9', '10', '4'] },
  { id: '2', name: 'Lucy CLP', serviceIds: ['5', '6', '8', '7', '4'] },
];

export type BookingLocation = {
  id: string;
  name: string;
  address: string;
  /** Sessions offered here, in display order. */
  serviceIds: string[];
  /** Which sessions each coach gives at this location. */
  staffServices: Record<string, string[]>;
};

export const bookingLocations: BookingLocation[] = [
  { id: '1', name: 'Boston Machessutes', address: 'XTZ fdfdfd', serviceIds: ['4', '5', '7', '10'], staffServices: { '1': ['5', '10', '4'], '2': ['7'] } },
  { id: '2', name: 'New York, NY', address: 'test', serviceIds: ['4', '6', '8', '9'], staffServices: { '1': ['5', '10', '4', '9'], '2': ['7', '6', '8', '4'] } },
];

/** Working day: sessions start from 09:15 back to back and must end by 16:15; weekends are days off. */
export const bookingSchedule = { start: '09:15', end: '16:15', daysOff: [0, 6], bookableYears: 2 };

export const bookingText = {
  validation: {
    location: 'Please select any location to book an appointment.',
    service: 'Please select any service to book an appointment.',
    staff: 'Please select staff member',
    date: 'Please select appointment date to proceed with the booking.',
    time: 'Please select a time slot to proceed with the booking.',
  },
  slotsLeft: 'Slots left',
  cartEmpty: 'Your cart is empty!',
  bookButton: 'Book a Session',
  totalAmount: 'Total Amount Payable',
  packageLogin: 'You must be logged in to continue.',
};
