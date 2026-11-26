// Satisfies: REQ-001, REQ-002, REQ-003, REQ-004, REQ-007, REQ-010, REQ-015
'use client';

import React from 'react';
import { ToastProvider, useToast } from '@/features/layout/ToastContainer';
import { useVayuSaathi } from '@/features/layout/useVayuSaathi';
import { TopHeader } from '@/features/layout/TopHeader';
import { MobileNav } from '@/features/layout/MobileNav';
import { HeroSection } from '@/features/hero/HeroSection';
import { LandingEmptyState } from '@/features/hero/LandingEmptyState';
import { DailyPlaybookTab } from '@/features/playbook/DailyPlaybookTab';
import { CopilotTab } from '@/features/copilot/CopilotTab';
import { CommunityTab } from '@/features/community/CommunityTab';
import { ProfileDrawer } from '@/features/profile/ProfileDrawer';
import { fetchLiveByCoords, buildManualScenario } from '@/features/layout/fetchLiveCity';
import { getChatFallbackReply } from '@/features/copilot/chatFallback';

function VayuSaathiApp() {
  const { showToast } = useToast();
  const state = useVayuSaathi();

  const handleFetchLiveCity = async (cityQuery: string) => {
    await state.loadLiveCity(cityQuery);
  };

  const handleUseGeolocation = async () => {
    if (!navigator.geolocation) {
      showToast('Geolocation not supported in this browser.', 'warning');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const loc = await fetchLiveByCoords(pos.coords.latitude, pos.coords.longitude);
          state.setLocation(loc);
          state.setPlaybookSource('basic');
          state.setAiPlaybook(null);
          showToast('Loaded live air quality for your approximate area.', 'success');
        } catch {
          showToast('Live Open-Meteo service unavailable. Enter AQI manually.', 'warning');
        }
      },
      () => showToast('Location permission denied. Search your city above.', 'info')
    );
  };

  const handleManualPm25 = (pm25: number) => {
    state.setLocation(buildManualScenario(pm25));
    state.setAiPlaybook(null);
    state.setPlaybookSource('basic');
    showToast(`Applied manual PM2.5 reading (${pm25} µg/m³).`, 'info');
  };

  const handleGenerateAI = async () => {
    if (!state.location || !state.impact) return;
    state.setIsGeneratingAI(true);
    try {
      const res = await fetch('/api/playbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: state.location,
          profile: state.profile,
          vent: state.vent,
          impact: state.impact,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const src: 'ai' | 'basic' = data.source === 'ai' ? 'ai' : 'basic';
        state.setAiPlaybook(data.playbook);
        state.setPlaybookSource(src);
        showToast(
          src === 'ai' ? 'Fresh AI Playbook synthesized!' : 'Generated playbook in Basic mode.',
          src === 'ai' ? 'success' : 'info'
        );
      } else {
        state.setPlaybookSource('basic');
        showToast('Generated playbook from local rules engine.', 'info');
      }
    } catch {
      state.setPlaybookSource('basic');
      showToast('Generated playbook from local rules engine.', 'info');
    } finally {
      state.setIsGeneratingAI(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!state.location || !state.impact) return;
    state.setChatMessages((prev) => [...prev, { role: 'user', text }]);
    state.setIsChatLoading(true);
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: text,
          aqi: state.impact.aqi.naqi,
          pm25: state.location.pm25,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const fullAnswer = data.disclaimer ? `${data.answer}\n\n*${data.disclaimer}*` : data.answer;
        const src: 'ai' | 'basic' = data.source === 'ai' && !data.fallback ? 'ai' : 'basic';
        state.setChatMessages((prev) => [
          ...prev,
          { role: 'assistant', text: fullAnswer, source: src },
        ]);
      } else {
        const reply = getChatFallbackReply(text, state.location, state.impact, state.vent);
        state.setChatMessages((prev) => [
          ...prev,
          { role: 'assistant', text: reply, source: 'basic' },
        ]);
      }
    } catch {
      const reply = getChatFallbackReply(text, state.location, state.impact, state.vent);
      state.setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', text: reply, source: 'basic' },
      ]);
    } finally {
      state.setIsChatLoading(false);
    }
  };

  const userCo2 = state.completedIds.length * 0.35;
  const ready = state.location && state.impact && state.playbook;

  return (
    <div className="font-sans antialiased overflow-x-hidden pb-24 md:pb-12 bg-[#F7F6F2] min-h-screen">
      <TopHeader
        activeLocation={state.location}
        profile={state.profile}
        activeTab={state.activeTab}
        onTabChange={state.setActiveTab}
        onOpenProfile={() => state.setIsProfileOpen(true)}
        onFetchLiveCity={handleFetchLiveCity}
      />

      <main id="main-content" className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 space-y-6">
        {state.location?.isSynthetic && (
          <div
            role="status"
            className="rounded-xl bg-amber-50 border border-amber-300 px-4 py-2.5 text-xs font-semibold text-amber-900 flex items-center justify-between gap-2"
          >
            <span>Demo scenario (synthetic data) — not live station telemetry.</span>
            <button
              type="button"
              onClick={state.clearAllData}
              className="underline hover:text-amber-950"
            >
              Switch to live city
            </button>
          </div>
        )}

        {!ready || state.isLoadingCity ? (
          <LandingEmptyState
            isLoading={state.isLoadingCity}
            error={state.cityError}
            lastCityQuery={state.lastCityQuery}
            onFetchCity={handleFetchLiveCity}
            onUseGeolocation={handleUseGeolocation}
            onManualPm25={handleManualPm25}
          />
        ) : (
          <>
            <HeroSection location={state.location!} impact={state.impact!} vent={state.vent} />

            {state.activeTab === 'playbook' && (
              <DailyPlaybookTab
                playbook={state.playbook!}
                impact={state.impact!}
                completedIds={state.completedIds}
                playbookSource={state.playbookSource}
                isGeneratingAI={state.isGeneratingAI}
                onTogglePledge={state.togglePledge}
                onGenerateAI={handleGenerateAI}
              />
            )}

            {state.activeTab === 'copilot' && (
              <CopilotTab
                location={state.location!}
                profile={state.profile}
                vent={state.vent}
                messages={state.chatMessages}
                onSendMessage={handleSendMessage}
                onResetChat={() => state.initGreeting(state.location!)}
                isLoading={state.isChatLoading}
              />
            )}

            {state.activeTab === 'community' && (
              <CommunityTab
                location={state.location!}
                profile={state.profile}
                vent={state.vent}
                impact={state.impact!}
                completedPledgesCount={state.completedIds.length}
                userCo2Kg={userCo2}
                hotspots={state.hotspots}
                upvotedIds={state.upvotedIds}
                onAddHotspot={state.addHotspot}
                onToggleUpvote={state.toggleUpvote}
              />
            )}
          </>
        )}
      </main>

      <MobileNav activeTab={state.activeTab} onTabChange={state.setActiveTab} />

      <ProfileDrawer
        isOpen={state.isProfileOpen}
        onClose={() => state.setIsProfileOpen(false)}
        profile={state.profile}
        onSaveProfile={state.handleSaveProfile}
        onClearData={state.clearAllData}
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <ToastProvider>
      <VayuSaathiApp />
    </ToastProvider>
  );
}
