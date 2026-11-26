'use client';

import React from 'react';
import type { LocationScenario, HouseholdProfile } from '@/domain/scenarios';
import type { VentilationWindow } from '@/domain/naqi';
import { CopilotChat, type ChatMessage } from './CopilotChat';
import { MultimodalAudit } from './MultimodalAudit';

interface CopilotTabProps {
  location: LocationScenario;
  profile: HouseholdProfile;
  vent: VentilationWindow;
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
    <section
      aria-label="Copilot and Multimodal Inspection"
      className="grid grid-cols-1 lg:grid-cols-12 gap-5"
    >
      <div className="lg:col-span-7">
        <CopilotChat
          location={location}
          profile={profile}
          vent={vent}
          messages={messages}
          onSendMessage={onSendMessage}
          onResetChat={onResetChat}
          isLoading={isLoading}
        />
      </div>
      <div className="lg:col-span-5">
        <MultimodalAudit location={location} profile={profile} />
      </div>
    </section>
  );
}
