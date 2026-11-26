export interface HotspotReport {
  id: string;
  city: string;
  category: 'Open Waste Burning' | 'Uncovered Construction Dust' | 'Traffic Choke Point';
  locality: string;
  description: string;
  upvotes: number;
  timeAgo: string;
  createdAt?: string;
  isSample?: boolean;
}

// Zero fake seeded citizen reports on fresh install — truthful device-local data
export const INITIAL_HOTSPOTS: HotspotReport[] = [];
