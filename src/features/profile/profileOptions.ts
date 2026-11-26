// Profile options and metadata
import { Baby, UserCheck, HeartPulse, Shield, Car, Bike, TrainFront, Laptop } from 'lucide-react';

export const VULNERABILITY_OPTIONS = [
  { key: 'kids', label: 'Kids (<12 yrs)', icon: Baby },
  { key: 'seniors', label: 'Seniors (60+)', icon: UserCheck },
  { key: 'asthma', label: 'Asthma / Resp.', icon: HeartPulse },
  { key: 'none', label: 'None / General', icon: Shield },
] as const;

export const PURIFIER_OPTIONS = [
  { key: 'none', label: 'None' },
  { key: 'one_room', label: '1 Room HEPA' },
  { key: 'whole_home', label: 'Whole Home' },
] as const;

export const COMMUTE_OPTIONS = [
  { key: 'solo_car', label: 'Solo Petrol Car', icon: Car },
  { key: 'two_wheeler', label: 'Two-Wheeler', icon: Bike },
  { key: 'public_transit', label: 'Metro / Bus', icon: TrainFront },
  { key: 'wfh', label: 'Work From Home', icon: Laptop },
] as const;

export const BUDGET_OPTIONS = [
  {
    key: 'zero_cost',
    title: 'Zero-Cost Behavioural Hacks (₹0)',
    desc: 'Wet mopping, damp towel gap sealing, timed ventilation, exhaust routines',
  },
  {
    key: 'diy_2000',
    title: 'DIY Fixes Under ₹2,000',
    desc: 'Weatherstripping tape, DIY box-fan + HEPA/MERV filter, N95 multipacks',
  },
  {
    key: 'paid_upgrades',
    title: 'Paid Upgrades & Devices',
    desc: 'True HEPA H13 purifiers, PM2.5 indoor monitors, induction swaps',
  },
] as const;
