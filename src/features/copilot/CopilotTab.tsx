'use client';

import React from 'react';
import type { LocationScenario, HouseholdProfile } from '@/domain/scenarios';
import type { VentilationWindow } from '@/domain/naqi';
import { CopilotChat, type ChatMessage } from './CopilotChat';

interface CopilotTabProps {
  location: LocationScenario;
  profile: HouseholdProfile;
  vent: VentilationWindow | null;
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  onResetChat: () => void;
  isLoading: boolean;
}

export function CopilotTab({
  location,
  profile,
  vent,
  messages,
  onSendMessage,
  onResetChat,
  isLoading,
}: CopilotTabProps) {
  return (
    <section aria-label="Ask AI Copilot" className="max-w-4xl mx-auto">
      <CopilotChat
        location={location}
        profile={profile}
        vent={vent}
        messages={messages}
        onSendMessage={onSendMessage}
        onResetChat={onResetChat}
        isLoading={isLoading}
      />
    </section>
  );
}
