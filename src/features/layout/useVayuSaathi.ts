'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  SCENARIOS,
  DEFAULT_PROFILE,
  computeDeterministicImpact,
  type HouseholdProfile,
  type LocationScenario,
} from '@/domain/scenarios';
import { findSafeVentilationWindow } from '@/domain/naqi';
import { buildDeterministicPlaybook } from '@/domain/playbookEngine';
import { type PlaybookData } from '@/domain/playbookEngine';
import { INITIAL_HOTSPOTS, type HotspotReport } from '@/features/community/SmogPinboard';
import type { ChatMessage } from '@/features/copilot/CopilotChat';
import { fetchLiveIndianCity } from './fetchLiveCity';
import { useToast } from './ToastContainer';

const STORAGE = {
  profile: 'vayusaathi_profile_v1',
  pledges: 'vayusaathi_pledges_v1',
  hotspots: 'vayusaathi_hotspots_v1',
  upvotes: 'vayusaathi_upvotes_v1',
  lastCity: 'vayusaathi_last_city',
};

function loadStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function useVayuSaathi() {
  const { showToast } = useToast();
  const [scenarioKey, setScenarioKey] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<LocationScenario | null>(null);
  const [isLoadingCity, setIsLoadingCity] = useState(false);
  const [cityError, setCityError] = useState<string | null>(null);
  const [lastCityQuery, setLastCityQuery] = useState<string | null>(null);
  const [profile, setProfile] = useState<HouseholdProfile>(DEFAULT_PROFILE);
  const [activeTab, setActiveTab] = useState<'playbook' | 'copilot' | 'community'>('playbook');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [hotspots, setHotspots] = useState<HotspotReport[]>(INITIAL_HOTSPOTS);
  const [upvotedIds, setUpvotedIds] = useState<string[]>([]);
  const [playbookSource, setPlaybookSource] = useState('Smart Local Engine');
  const [aiPlaybook, setAiPlaybook] = useState<PlaybookData | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const loadLiveCity = useCallback(async (cityQuery: string) => {
    setIsLoadingCity(true);
    setCityError(null);
    setLastCityQuery(cityQuery);
    try {
      const newLoc = await fetchLiveIndianCity(cityQuery);
      if (!newLoc) {
        setCityError(`Could not find "${cityQuery}". Try Delhi, Lucknow, or Patna.`);
        return;
      }
      setSelectedLocation(newLoc);
      setScenarioKey('');
      setAiPlaybook(null);
      setPlaybookSource('Smart Local Engine');
      try {
        localStorage.setItem(STORAGE.lastCity, cityQuery);
      } catch {
        // ignore
      }
    } catch {
      setCityError('Live air quality provider unavailable. Retry or enter AQI manually.');
    } finally {
      setIsLoadingCity(false);
    }
  }, []);

  useEffect(() => {
    setProfile(loadStorage(STORAGE.profile, DEFAULT_PROFILE));
    setCompletedIds(loadStorage(STORAGE.pledges, []));
    setHotspots(loadStorage(STORAGE.hotspots, INITIAL_HOTSPOTS));
    setUpvotedIds(loadStorage(STORAGE.upvotes, []));
    try {
      const savedCity = localStorage.getItem(STORAGE.lastCity);
      if (savedCity && savedCity.trim().length >= 2) {
        void loadLiveCity(savedCity);
      }
    } catch {
      // ignore
    }
  }, [loadLiveCity]);

  const vent = useMemo(
    () =>
      selectedLocation
        ? findSafeVentilationWindow(selectedLocation.hourlyPM25, selectedLocation.hourlyWind)
        : null,
    [selectedLocation]
  );
  const impact = useMemo(
    () => (selectedLocation ? computeDeterministicImpact(selectedLocation, profile) : null),
    [selectedLocation, profile]
  );
  const playbook = useMemo(() => {
    if (!selectedLocation || !vent || !impact) return null;
    return aiPlaybook || buildDeterministicPlaybook(selectedLocation, profile, vent, impact);
  }, [aiPlaybook, selectedLocation, profile, vent, impact]);

  const initGreeting = useCallback((loc: LocationScenario) => {
    const { naqi, band } = computeDeterministicImpact(loc, DEFAULT_PROFILE).aqi;
    const v = findSafeVentilationWindow(loc.hourlyPM25, loc.hourlyWind);
    setChatMessages([
      {
        role: 'assistant',
        text: `Namaste! I'm **VayuSaathi**. Right now **${loc.city}** is at **CPCB NAQI ${naqi} (${band.label})** with PM2.5 at ${loc.pm25} µg/m³.\n\nYour safest cross-ventilation slot today is **${v.windowLabel}**. Ask me anything in English, Hindi, or Hinglish!`,
      },
    ]);
  }, []);

  useEffect(() => {
    if (selectedLocation) initGreeting(selectedLocation);
  }, [selectedLocation, initGreeting]);

  const handleScenarioChange = (key: string) => {
    const clean = key.replace(/^demo:/, '');
    if (SCENARIOS[clean]) {
      setScenarioKey(`demo:${clean}`);
      setSelectedLocation({ ...SCENARIOS[clean] });
      setCityError(null);
      setAiPlaybook(null);
      setPlaybookSource('Smart Local Engine');
      showToast(`Loaded demo scenario: ${SCENARIOS[clean].city} (synthetic data).`, 'info');
    }
  };

  const handleSaveProfile = (newProfile: HouseholdProfile) => {
    setProfile(newProfile);
    setAiPlaybook(null);
    setPlaybookSource('Smart Local Engine');
    try {
      localStorage.setItem(STORAGE.profile, JSON.stringify(newProfile));
    } catch {
      // ignore
    }
    showToast('Household profile saved — recalculating impact!', 'success');
  };

  const togglePledge = (id: string) => {
    const next = completedIds.includes(id)
      ? completedIds.filter((x) => x !== id)
      : [...completedIds, id];
    setCompletedIds(next);
    try {
      localStorage.setItem(STORAGE.pledges, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const toggleUpvote = (id: string) => {
    const isUp = upvotedIds.includes(id);
    const nextUpvotes = isUp ? upvotedIds.filter((x) => x !== id) : [...upvotedIds, id];
    setUpvotedIds(nextUpvotes);
    setHotspots((prev) =>
      prev.map((h) => (h.id === id ? { ...h, upvotes: isUp ? h.upvotes - 1 : h.upvotes + 1 } : h))
    );
    try {
      localStorage.setItem(STORAGE.upvotes, JSON.stringify(nextUpvotes));
    } catch {
      // ignore
    }
  };

  const addHotspot = (item: HotspotReport) => {
    const next = [item, ...hotspots];
    setHotspots(next);
    setUpvotedIds((prev) => [...prev, item.id]);
    try {
      localStorage.setItem(STORAGE.hotspots, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const clearAllData = () => {
    try {
      Object.values(STORAGE).forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignore
    }
    setSelectedLocation(null);
    setScenarioKey('');
    setCityError(null);
    setLastCityQuery(null);
    setProfile(DEFAULT_PROFILE);
    setCompletedIds([]);
    setHotspots(INITIAL_HOTSPOTS);
    setUpvotedIds([]);
    setAiPlaybook(null);
    setChatMessages([]);
    showToast('All browser data cleared.', 'info');
  };

  return {
    scenarioKey,
    location: selectedLocation,
    selectedLocation,
    setLocation: setSelectedLocation,
    isLoadingCity,
    cityError,
    lastCityQuery,
    loadLiveCity,
    profile,
    activeTab,
    setActiveTab,
    isProfileOpen,
    setIsProfileOpen,
    vent,
    impact,
    playbook,
    playbookSource,
    setPlaybookSource,
    completedIds,
    hotspots,
    upvotedIds,
    chatMessages,
    setChatMessages,
    isGeneratingAI,
    setIsGeneratingAI,
    isChatLoading,
    setIsChatLoading,
    handleScenarioChange,
    handleSaveProfile,
    togglePledge,
    toggleUpvote,
    addHotspot,
    initGreeting,
    setAiPlaybook,
    clearAllData,
  };
}
