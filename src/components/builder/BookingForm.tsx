'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  bookingCategories,
  bookingLocations,
  bookingSchedule,
  bookingServices,
  bookingStaff,
  bookingSteps,
  bookingText,
  type BookingStepKey,
} from '@/content/booking';
import { COUNTRIES, flag } from '@/content/countries';
import styles from './BookingForm.module.css';

// ---- Material icons used by the original form (24×24 paths) ----
const ICONS: Record<string, string> = {
  location:
    'M12,2c-4.2,0-8,3.22-8,8.2c0,3.18,2.45,6.92,7.34,11.23c0.38,0.33,0.95,0.33,1.33,0C17.55,17.12,20,13.38,20,10.2 C20,5.22,16.2,2,12,2z M12,12c-1.1,0-2-0.9-2-2c0-1.1,0.9-2,2-2c1.1,0,2,0.9,2,2C14,11.1,13.1,12,12,12z',
  service:
    'M19 13H5c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2zM7 19c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM19 3H5c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM7 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z',
  staffmembers:
    'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V18c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-1.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05.02.01.03.03.04.04 1.14.83 1.93 1.94 1.93 3.41V18c0 .35-.07.69-.18 1H22c.55 0 1-.45 1-1v-1.5c0-2.33-4.67-3.5-7-3.5z',
  datetime:
    'M19 4h-1V3c0-.55-.45-1-1-1s-1 .45-1 1v1H8V3c0-.55-.45-1-1-1s-1 .45-1 1v1H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 15c0 .55-.45 1-1 1H6c-.55 0-1-.45-1-1V9h14v10zM7 11h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z',
  cart: 'M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 3c0 .55.45 1 1 1h1l3.6 7.59-1.35 2.44C4.52 15.37 5.48 17 7 17h11c.55 0 1-.45 1-1s-.45-1-1-1H7l1.1-2h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.37-.66-.11-1.48-.87-1.48H5.21l-.67-1.43c-.16-.35-.52-.57-.9-.57H2c-.55 0-1 .45-1 1zm16 15c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z',
  basic_details:
    'M19,3H5C3.9,3,3,3.9,3,5v14c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2V5C21,3.9,20.1,3,19,3z M13,17H8c-0.55,0-1-0.45-1-1 c0-0.55,0.45-1,1-1h5c0.55,0,1,0.45,1,1C14,16.55,13.55,17,13,17z M16,13H8c-0.55,0-1-0.45-1-1c0-0.55,0.45-1,1-1h8 c0.55,0,1,0.45,1,1C17,12.55,16.55,13,16,13z M16,9H8C7.45,9,7,8.55,7,8c0-0.55,0.45-1,1-1h8c0.55,0,1,0.45,1,1 C17,8.55,16.55,9,16,9z',
  summary:
    'M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9.29 16.29L6.7 13.7c-.39-.39-.39-1.02 0-1.41.39-.39 1.02-.39 1.41 0L10 14.17l5.88-5.88c.39-.39 1.02-.39 1.41 0 .39.39.39 1.02 0 1.41l-6.59 6.59c-.38.39-1.02.39-1.41 0z',
  image:
    'M13.2 7.07L10.25 11l2.25 3c.33.44.24 1.07-.2 1.4-.44.33-1.07.25-1.4-.2-1.05-1.4-2.31-3.07-3.1-4.14-.4-.53-1.2-.53-1.6 0l-4 5.33c-.49.67-.02 1.61.8 1.61h18c.82 0 1.29-.94.8-1.6l-7-9.33c-.4-.54-1.2-.54-1.6 0z',
  person: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v1c0 .55.45 1 1 1h14c.55 0 1-.45 1-1v-1c0-2.66-5.33-4-8-4z',
  next: 'M14.29,5.71L14.29,5.71c-0.39,0.39-0.39,1.02,0,1.41L18.17,11H3c-0.55,0-1,0.45-1,1v0c0,0.55,0.45,1,1,1h15.18l-3.88,3.88 c-0.39,0.39-0.39,1.02,0,1.41l0,0c0.39,0.39,1.02,0.39,1.41,0l5.59-5.59c0.39-0.39,0.39-1.02,0-1.41L15.7,5.71 C15.32,5.32,14.68,5.32,14.29,5.71z',
  back: 'M9.7,18.3L9.7,18.3c0.39-0.39,0.39-1.02,0-1.41L5.83,13H21c0.55,0,1-0.45,1-1v0c0-0.55-0.45-1-1-1H5.83l3.88-3.88 c0.39-0.39,0.39-1.02,0-1.41l0,0c-0.39-0.39-1.02-0.39-1.41,0L2.7,11.3c-0.39,0.39-0.39,1.02,0,1.41l5.59,5.59 C8.68,18.68,9.32,18.68,9.7,18.3z',
  plus: 'M18 13h-5v5c0 .55-.45 1-1 1s-1-.45-1-1v-5H6c-.55 0-1-.45-1-1s.45-1 1-1h5V6c0-.55.45-1 1-1s1 .45 1 1v5h5c.55 0 1 .45 1 1s-.45 1-1 1z',
  check:
    'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM9.29 16.29 5.7 12.7c-.39-.39-.39-1.02 0-1.41.39-.39 1.02-.39 1.41 0L10 14.17l6.88-6.88c.39-.39 1.02-.39 1.41 0 .39.39.39 1.02 0 1.41l-7.59 7.59c-.38.39-1.02.39-1.41 0z',
  error: 'M12 7c.55 0 1 .45 1 1v4c0 .55-.45 1-1 1s-1-.45-1-1V8c0-.55.45-1 1-1zm-.01-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm1-3h-2v-2h2v2z',
  store:
    'M21.9,7.89l-1.05-3.37c-0.22-0.9-1-1.52-1.91-1.52H5.05c-0.9,0-1.69,0.63-1.9,1.52L2.1,7.89C1.64,9.86,2.95,11,3,11.06V19 c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2v-7.94C22.12,9.94,22.09,8.65,21.9,7.89z M13,5h1.96l0.54,3.52C15.59,9.23,15.11,10,14.22,10 C13.55,10,13,9.41,13,8.69V5z M6.44,8.86C6.36,9.51,5.84,10,5.23,10C4.3,10,3.88,9.03,4.04,8.36L5.05,5h1.97L6.44,8.86z M11,8.69 C11,9.41,10.45,10,9.71,10c-0.75,0-1.3-0.7-1.22-1.48L9.04,5H11V8.69z M18.77,10c-0.61,0-1.14-0.49-1.21-1.14L16.98,5l1.93-0.01 l1.05,3.37C20.12,9.03,19.71,10,18.77,10z',
  card: 'M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm-1 14H5c-.55 0-1-.45-1-1v-5h16v5c0 .55-.45 1-1 1zm1-10H4V6h16v2z',
  chevronLeft: 'M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z',
  chevronRight: 'M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z',
  star: 'M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z',
  edit: 'M3 17.46v3.04c0 .28.22.5.5.5h3.04c.13 0 .26-.05.35-.15L17.81 9.94l-3.75-3.75L3.15 17.1c-.1.1-.15.22-.15.36zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
  remove: 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
};

const Icon = ({ name, className }: { name: keyof typeof ICONS; className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    <path d={ICONS[name]} />
  </svg>
);

// ---- Dates and time slots ----
const pad = (n: number) => String(n).padStart(2, '0');
const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseIso = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const clock = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${pad(h % 12 || 12)}:${pad(m)} ${h < 12 ? 'am' : 'pm'}`;
};
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const longDate = (iso: string) => {
  const d = parseIso(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};
const money = (n: number) => `$${n.toFixed(2)}`;

type Slot = { start: number; end: number };

function slotsFor(durationMinutes: number, date: string, now: Date): Slot[] {
  const slots: Slot[] = [];
  const end = toMinutes(bookingSchedule.end);
  const today = date === isoDate(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  for (let start = toMinutes(bookingSchedule.start); start + durationMinutes <= end; start += durationMinutes) {
    if (!today || start > nowMinutes) slots.push({ start, end: start + durationMinutes });
  }
  return slots;
}

const PERIODS: { label: string; from: number; to: number }[] = [
  { label: 'Morning', from: 0, to: 12 * 60 },
  { label: 'Afternoon', from: 12 * 60, to: 17 * 60 },
  { label: 'Evening', from: 17 * 60, to: 21 * 60 },
  { label: 'Night', from: 21 * 60, to: 24 * 60 },
];


type CartItem = { key: string; locationId: string; serviceId: string; staffId: string; date: string; slot: Slot };
type Details = { firstname: string; lastname: string; email: string; phone: string; note: string };
const EMPTY_DETAILS: Details = { firstname: '', lastname: '', email: '', phone: '', note: '' };
const DETAIL_ERRORS: Record<keyof Omit<Details, 'note'>, string> = {
  firstname: 'Please enter your firstname',
  lastname: 'Please enter your lastname',
  email: 'Please enter your email address',
  phone: 'Please enter your phone number',
};

const serviceById = (id: string) => bookingServices.find((s) => s.id === id)!;
const staffById = (id: string) => bookingStaff.find((s) => s.id === id)!;
const locationById = (id: string) => bookingLocations.find((l) => l.id === id)!;

/**
 * "Book a Session" wizard (BookingPress on the original): location → session → coach → date & time → cart →
 * contact details → summary, with the step menu on the left. Choosing a location, session or coach moves on by
 * itself; "Next" validates the step with the original messages.
 */
export default function BookingForm() {
  const [step, setStep] = useState<BookingStepKey>('location');
  const [reached, setReached] = useState<Set<BookingStepKey>>(() => new Set(['location']));
  const [error, setError] = useState('');
  const [locationId, setLocationId] = useState('');
  const [categoryId, setCategoryId] = useState('1');
  const [serviceId, setServiceId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState<Slot | null>(null);
  const [month, setMonth] = useState<Date | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [details, setDetails] = useState<Details>(EMPTY_DETAILS);
  const [country, setCountry] = useState('US');
  const [detailErrors, setDetailErrors] = useState<Partial<Record<keyof Details, string>>>({});
  const [coupon, setCoupon] = useState('');
  const [couponError, setCouponError] = useState('');
  const [payment, setPayment] = useState<'local' | 'card' | ''>('');
  const [now, setNow] = useState<Date | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  // "Today" is only known in the browser.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the visitor's clock
    setNow(new Date());
  }, []);

  const go = (next: BookingStepKey) => {
    setError('');
    setStep(next);
    setReached((prev) => new Set(prev).add(next));
    bodyRef.current?.scrollTo({ top: 0 });
  };

  const location = locationId ? locationById(locationId) : null;
  const services = useMemo(() => {
    if (!location) return [];
    return location.serviceIds.map(serviceById).filter((s) => categoryId === 'all' || s.categoryId === categoryId);
  }, [location, categoryId]);
  const staffForService = useMemo(() => {
    if (!location || !serviceId) return [];
    return bookingStaff.filter((st) => st.serviceIds.includes(serviceId) && location.staffServices[st.id]?.includes(serviceId));
  }, [location, serviceId]);
  const service = serviceId ? serviceById(serviceId) : null;

  // Calendar bounds: today up to two years ahead, weekends off.
  const minDate = now ? isoDate(now) : '';
  const maxDate = now ? isoDate(new Date(now.getFullYear() + bookingSchedule.bookableYears, now.getMonth(), now.getDate())) : '';
  const isOpenDay = (iso: string) => !!now && iso >= minDate && iso <= maxDate && !bookingSchedule.daysOff.includes(parseIso(iso).getDay());
  const firstOpenDay = () => {
    if (!now) return '';
    const d = new Date(now);
    for (let i = 0; i < 14; i++, d.setDate(d.getDate() + 1)) {
      const iso = isoDate(d);
      if (isOpenDay(iso) && service && slotsFor(service.durationMinutes, iso, now).length) return iso;
    }
    return '';
  };

  const openDateTime = () => {
    const first = date || firstOpenDay();
    setDate(first);
    setMonth(first ? parseIso(first) : now);
    go('datetime');
  };

  const chooseLocation = (id: string) => {
    if (id !== locationId) {
      setServiceId('');
      setStaffId('');
      setSlot(null);
    }
    setLocationId(id);
    go('service');
  };

  const chooseService = (id: string) => {
    if (id !== serviceId) {
      setStaffId('');
      setSlot(null);
    }
    setServiceId(id);
    go('staffmembers');
  };

  const chooseStaff = (id: string) => {
    setStaffId(id);
    openDateTime();
  };

  const addToCart = () => {
    const item: CartItem = { key: editing ?? `${Date.now()}`, locationId, serviceId, staffId, date, slot: slot! };
    setCart((prev) => (editing ? prev.map((i) => (i.key === editing ? item : i)) : [...prev, item]));
    setEditing(null);
    go('cart');
  };

  const addServices = () => {
    setEditing(null);
    setServiceId('');
    setStaffId('');
    setDate('');
    setSlot(null);
    go('location');
  };

  const editItem = (item: CartItem) => {
    setEditing(item.key);
    setLocationId(item.locationId);
    setServiceId(item.serviceId);
    setStaffId(item.staffId);
    setDate(item.date);
    setSlot(item.slot);
    setMonth(parseIso(item.date));
    go('datetime');
  };

  const validateDetails = () => {
    const errors: Partial<Record<keyof Details, string>> = {};
    (Object.keys(DETAIL_ERRORS) as (keyof typeof DETAIL_ERRORS)[]).forEach((k) => {
      if (!details[k].trim()) errors[k] = DETAIL_ERRORS[k];
    });
    if (!errors.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email.trim())) errors.email = 'Please enter valid email address';
    setDetailErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const next = () => {
    switch (step) {
      case 'location':
        return locationId ? go('service') : setError(bookingText.validation.location);
      case 'service':
        return serviceId ? go('staffmembers') : setError(bookingText.validation.service);
      case 'staffmembers':
        return staffId ? openDateTime() : setError(bookingText.validation.staff);
      case 'datetime':
        if (!date) return setError(bookingText.validation.date);
        if (!slot) return setError(bookingText.validation.time);
        return addToCart();
      case 'cart':
        return cart.length ? go('basic_details') : setError(bookingText.cartEmpty);
      case 'basic_details':
        return validateDetails() && go('summary');
      case 'summary':
        return submit();
    }
  };

  const back = () => {
    const i = bookingSteps.findIndex((s) => s.key === step);
    if (i > 0) go(bookingSteps[i - 1].key);
  };

  const submit = () => {
    if (!payment) return setError('Please select a payment method');
    // The booking itself is handled by the original site's booking system, which this rebuild doesn't run.
    setError('Online booking is not available at the moment. Please contact us to book this session.');
  };

  const stepIndex = bookingSteps.findIndex((s) => s.key === step);
  const nextStep = bookingSteps[stepIndex + 1];
  const canOpen = (key: BookingStepKey) => key === step || reached.has(key) || !!bookingSteps.find((s) => s.key === key)?.alwaysOpen;
  const total = cart.reduce((sum, item) => sum + serviceById(item.serviceId).price, 0);

  let body: ReactNode;
  switch (step) {
    case 'location':
      body = (
        <div className={styles.module}>
          <div className={styles.heading}>Location</div>
          <div className={styles.grid2}>
            {bookingLocations.map((l) => (
              <button key={l.id} type="button" className={`${styles.card} ${styles.locationCard} ${l.id === locationId ? styles.selected : ''}`} onClick={() => chooseLocation(l.id)}>
                <span className={styles.placeholder}>
                  <Icon name="location" />
                </span>
                <span className={styles.locationBody}>
                  <span className={styles.locationTitle}>{l.name}</span>
                  <span className={styles.locationAddress}>{l.address}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      );
      break;
    case 'service':
      body = (
        <>
          <div className={styles.module}>
            <div className={styles.heading}>Select Category</div>
            <div className={styles.pills}>
              {bookingCategories.map((c) => (
                <button key={c.id} type="button" className={`${styles.pill} ${c.id === categoryId ? styles.pillActive : ''}`} onClick={() => setCategoryId(c.id)}>
                  <span>{c.name}</span>
                  {c.id === categoryId && <Icon name="check" />}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.module}>
            <div className={styles.heading}>Select Service</div>
            <div className={styles.grid2}>
              {services.map((s) => (
                <button key={s.id} type="button" className={`${styles.card} ${styles.serviceCard} ${s.id === serviceId ? styles.selected : ''}`} onClick={() => chooseService(s.id)}>
                  <span className={`${styles.placeholder} ${styles.round}`}>
                    <Icon name="image" />
                  </span>
                  <span>
                    <span className={styles.serviceName}>{s.name}</span>
                    <span className={styles.specs}>
                      <span>
                        Duration: <strong>{s.durationLabel}</strong>
                      </span>
                      <span>
                        Price: <strong className={styles.price}>{money(s.price)}</strong>
                      </span>
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      );
      break;
    case 'staffmembers':
      body = (
        <div className={styles.module}>
          <div className={styles.heading}>Select Staff Member</div>
          <div className={styles.grid3}>
            {staffForService.map((st) => (
              <button key={st.id} type="button" className={`${styles.card} ${styles.staffCard} ${st.id === staffId ? styles.selected : ''}`} onClick={() => chooseStaff(st.id)}>
                <span className={styles.placeholder}>
                  <Icon name="person" />
                </span>
                <span className={styles.staffName}>{st.name}</span>
                <span className={styles.rating}>
                  <Icon name="star" className={styles.star} />
                  <b>0</b> (0 Review)
                </span>
              </button>
            ))}
          </div>
        </div>
      );
      break;
    case 'datetime': {
      const view = month ?? now ?? new Date();
      const first = new Date(view.getFullYear(), view.getMonth(), 1);
      const start = new Date(first);
      start.setDate(1 - ((first.getDay() + 6) % 7));
      const days = Array.from({ length: 42 }, (_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return d;
      });
      const slots = date && service && now ? slotsFor(service.durationMinutes, date, now) : [];
      const minMonth = now ? new Date(now.getFullYear(), now.getMonth(), 1) : first;
      body = (
        <div className={styles.module}>
          <div className={styles.heading}>Date &amp; Time</div>
          <div className={styles.grid2}>
            <div className={styles.calendar}>
              <div className={styles.calHeader}>
                <button
                  type="button"
                  className={styles.calArrow}
                  aria-label="Previous month"
                  disabled={first <= minMonth}
                  onClick={() => setMonth(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
                >
                  <Icon name="chevronLeft" />
                </button>
                <span className={styles.calTitle}>
                  {MONTHS[view.getMonth()]} {view.getFullYear()}
                </span>
                <button type="button" className={styles.calArrow} aria-label="Next month" onClick={() => setMonth(new Date(view.getFullYear(), view.getMonth() + 1, 1))}>
                  <Icon name="chevronRight" />
                </button>
              </div>
              <div className={styles.calGrid}>
                {WEEKDAYS.map((w) => (
                  <span key={w} className={styles.weekday}>
                    {w}
                  </span>
                ))}
                {days.map((d) => {
                  const iso = isoDate(d);
                  const open = isOpenDay(iso);
                  return (
                    <button
                      key={iso}
                      type="button"
                      className={[styles.day, !open && styles.dayDisabled, iso === date && styles.daySelected].filter(Boolean).join(' ')}
                      disabled={!open}
                      aria-label={longDate(iso)}
                      aria-pressed={iso === date}
                      onClick={() => {
                        setDate(iso);
                        setSlot(null);
                        setError('');
                        if (d.getMonth() !== view.getMonth()) setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
                      }}
                    >
                      {d.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className={styles.timeSlots}>
              <div className={styles.heading}>Time Slot</div>
              {!date || slots.length === 0 ? (
                <p className={styles.noSlots}>{date ? 'There is no time slots available' : ''}</p>
              ) : (
                PERIODS.map((p) => {
                  const inPeriod = slots.filter((s) => s.start >= p.from && s.start < p.to);
                  if (!inPeriod.length) return null;
                  return (
                    <div key={p.label} className={styles.slotRow}>
                      <div className={styles.slotHeading}>{p.label}</div>
                      <div className={styles.slotItems}>
                        {inPeriod.map((s) => (
                          <button
                            key={s.start}
                            type="button"
                            className={`${styles.slot} ${slot?.start === s.start ? styles.slotSelected : ''}`}
                            aria-pressed={slot?.start === s.start}
                            onClick={() => {
                              setSlot(s);
                              setError('');
                            }}
                          >
                            <span>
                              {clock(s.start)} - {clock(s.end)}
                            </span>
                            <span className={styles.capacity}>1 {bookingText.slotsLeft}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      );
      break;
    }
    case 'cart':
      body = (
        <div className={styles.module}>
          <div className={styles.cartHead}>
            <div className={styles.heading}>
              My Cart Items<span className={styles.counter}>{cart.length} Items</span>
            </div>
            {cart.length > 0 && (
              <button type="button" className={styles.outlineBtn} onClick={addServices}>
                <Icon name="plus" /> Add Services
              </button>
            )}
          </div>
          {cart.length === 0 ? (
            <div className={styles.cartEmpty}>
              {/* eslint-disable-next-line @next/next/no-img-element -- the form's own illustration */}
              <img src="/booking/cart-empty.svg" alt="" width={133} height={136} />
              <div className={styles.heading}>{bookingText.cartEmpty}</div>
              <button type="button" className={styles.primaryBtn} onClick={addServices}>
                <span>
                  <Icon name="plus" /> Add Services
                </span>
              </button>
            </div>
          ) : (
            <>
              <div className={styles.cartItems}>
                {cart.map((item) => {
                  const s = serviceById(item.serviceId);
                  return (
                    <div key={item.key} className={styles.cartItem}>
                      <div className={styles.cartItemMain}>
                        <span className={`${styles.placeholder} ${styles.round} ${styles.small}`}>
                          <Icon name="image" />
                        </span>
                        <div>
                          <div className={styles.serviceName}>{s.name}</div>
                          <div className={styles.cartMeta}>
                            {longDate(item.date)}, {clock(item.slot.start)} - {clock(item.slot.end)}
                          </div>
                          <div className={styles.cartMeta}>
                            Staff: {staffById(item.staffId).name} · Location: {locationById(item.locationId).name}
                          </div>
                          <div className={styles.cartMeta}>Duration: {s.durationLabel}</div>
                        </div>
                      </div>
                      <div className={styles.cartItemSide}>
                        <strong className={styles.price}>{money(s.price)}</strong>
                        <div className={styles.cartActions}>
                          <button type="button" onClick={() => editItem(item)}>
                            <Icon name="edit" /> Edit
                          </button>
                          <button type="button" onClick={() => setCart((prev) => prev.filter((i) => i.key !== item.key))}>
                            <Icon name="remove" /> Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className={styles.cartTotal}>
                <span>Cart Total</span>
                <strong>{money(total)}</strong>
              </div>
            </>
          )}
        </div>
      );
      break;
    case 'basic_details': {
      const field = (key: keyof Details, label: string, placeholder: string, required = true) => (
        <div className={`${styles.formItem} ${detailErrors[key] ? styles.hasError : ''}`}>
          <label className={styles.label} htmlFor={`bpa-${key}`}>
            {label}
            {required && <span className={styles.required}>*</span>}
          </label>
          {key === 'phone' ? (
            <div className={styles.tel}>
              <label className={styles.telCountry}>
                <span aria-hidden>{flag(country)}</span>
                <select value={country} onChange={(e) => setCountry(e.target.value)} aria-label="Country code">
                  {COUNTRIES.map(([code, name, dial]) => (
                    <option key={code} value={code}>
                      {name} (+{dial})
                    </option>
                  ))}
                </select>
              </label>
              <input
                id="bpa-phone"
                type="tel"
                className={styles.input}
                placeholder="(201) 555-0123"
                value={details.phone}
                onChange={(e) => setDetails({ ...details, phone: e.target.value })}
              />
            </div>
          ) : key === 'note' ? (
            <textarea id="bpa-note" className={`${styles.input} ${styles.textarea}`} placeholder={placeholder} value={details.note} onChange={(e) => setDetails({ ...details, note: e.target.value })} />
          ) : (
            <input
              id={`bpa-${key}`}
              type={key === 'email' ? 'email' : 'text'}
              className={styles.input}
              placeholder={placeholder}
              value={details[key]}
              onChange={(e) => setDetails({ ...details, [key]: e.target.value })}
            />
          )}
          {detailErrors[key] && (
            <div className={styles.fieldError}>
              <Icon name="error" /> {detailErrors[key]}
            </div>
          )}
        </div>
      );
      body = (
        <div className={styles.module}>
          <div className={styles.heading}>Basic Details</div>
          <form className={styles.form} onSubmit={(e) => e.preventDefault()} noValidate>
            {field('firstname', 'Firstname', 'Enter your firstname')}
            {field('lastname', 'Lastname', 'Enter your lastname')}
            {field('email', 'Email Address', 'Enter your email address')}
            {field('phone', 'Phone Number', '')}
            {field('note', 'Note', 'Enter note details', false)}
          </form>
        </div>
      );
      break;
    }
    case 'summary': {
      const dial = COUNTRIES.find(([code]) => code === country)?.[2];
      body = (
        <>
          <div className={`${styles.module} ${styles.summary}`}>
            <div className={styles.summaryHead}>
              {/* eslint-disable-next-line @next/next/no-img-element -- the form's own illustration */}
              <img src="/booking/summary.svg" alt="" width={137} height={99} />
              <div className={styles.heading}>Summary</div>
              <p>Your appointment booking summary</p>
              <div className={styles.locationChip}>
                <span className={styles.chipLabel}>Location</span>
                <span className={styles.chipValue}>
                  <Icon name="location" />
                  {cart[0] ? locationById(cart[0].locationId).name : ''}
                </span>
              </div>
            </div>
            <div className={styles.summaryRow}>
              <div className={styles.summaryItem}>
                <span>Customer</span>
                <div>
                  {[details.firstname, details.lastname].filter(Boolean).join(' ')}
                  {details.email && <small>{details.email}</small>}
                  {details.phone && (
                    <small>
                      +{dial} {details.phone}
                    </small>
                  )}
                </div>
              </div>
            </div>
            {cart.map((item) => (
              <div key={item.key} className={styles.summaryRow}>
                <div className={styles.summaryItem}>
                  <span>Service</span>
                  <div>
                    {serviceById(item.serviceId).name}
                    <small>{staffById(item.staffId).name}</small>
                  </div>
                </div>
                <div className={styles.summaryItem}>
                  <span>Date &amp; Time</span>
                  <div>
                    {longDate(item.date)}
                    <small>
                      {clock(item.slot.start)} - {clock(item.slot.end)}
                    </small>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.amounts}>
            <div className={styles.amountRow}>
              <span>Subtotal</span>
              <span>{money(total)}</span>
            </div>
            <div className={styles.couponBox}>
              <span className={styles.label}>Redeem Package</span>
              <div>
                <div className={styles.couponInner}>
                  <select className={`${styles.input} ${styles.couponInput}`} disabled aria-label="Select package">
                    <option>Select package</option>
                  </select>
                  <button type="button" className={styles.smallBtn} disabled>
                    Redeem
                  </button>
                </div>
                <p className={styles.couponError}>{bookingText.packageLogin}</p>
              </div>
            </div>
            <div className={styles.couponBox}>
              <span className={styles.label}>Have a coupon code ?</span>
              <div>
                <div className={styles.couponInner}>
                  <input
                    className={`${styles.input} ${styles.couponInput}`}
                    placeholder="Enter your coupon code"
                    value={coupon}
                    onChange={(e) => {
                      setCoupon(e.target.value);
                      setCouponError('');
                    }}
                  />
                  <button type="button" className={styles.smallBtn} onClick={() => setCouponError(coupon.trim() ? 'Coupon code is not valid' : 'Please enter coupon code')}>
                    Apply
                  </button>
                </div>
                {couponError && <p className={styles.couponError}>{couponError}</p>}
              </div>
            </div>
            <div className={`${styles.amountRow} ${styles.totalRow}`}>
              <span>{bookingText.totalAmount}</span>
              <span className={styles.totalPrice}>{money(total)}</span>
            </div>
          </div>
          <div className={styles.module}>
            <div className={styles.heading}>Select Payment Method</div>
            <div className={styles.payments}>
              <button type="button" className={`${styles.payment} ${payment === 'local' ? styles.selected : ''}`} onClick={() => setPayment('local')}>
                <Icon name="store" /> <span>Pay Locally</span>
              </button>
              <button type="button" className={`${styles.payment} ${payment === 'card' ? styles.selected : ''}`} onClick={() => setPayment('card')}>
                <Icon name="card" /> <span>Credit Card</span>
              </button>
            </div>
            {payment === 'card' && <div className={styles.cardTitle}>Card Details</div>}
          </div>
        </>
      );
      break;
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.tabs}>
        <nav className={styles.menu} aria-label="Booking steps">
          {bookingSteps.map((s) => (
            <button
              key={s.key}
              type="button"
              className={[styles.menuItem, s.key === step && styles.menuActive, !canOpen(s.key) && styles.menuDisabled].filter(Boolean).join(' ')}
              aria-current={s.key === step ? 'step' : undefined}
              onClick={() => {
                if (s.key === step || !canOpen(s.key)) return;
                if (s.key === 'datetime') openDateTime();
                else go(s.key);
              }}
            >
              <span className={styles.menuIcon}>
                <Icon name={s.key} />
              </span>
              <span className={styles.menuLabel}>{s.label}</span>
            </button>
          ))}
        </nav>
        <div className={styles.panel}>
          <div ref={bodyRef} className={styles.body}>
            {error && (
              <div className={styles.toast} role="alert">
                <Icon name="error" /> {error}
              </div>
            )}
            {body}
          </div>
          <div className={styles.footer}>
            {stepIndex > 0 && (
              <button type="button" className={styles.backBtn} onClick={back}>
                <Icon name="back" /> Go Back
              </button>
            )}
            <button type="button" className={styles.primaryBtn} onClick={next}>
              {step === 'summary' ? (
                <span>{bookingText.bookButton}</span>
              ) : (
                <span>
                  Next:&nbsp;<strong>{nextStep?.label}</strong> <Icon name="next" />
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
