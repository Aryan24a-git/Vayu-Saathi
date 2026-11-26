import React from 'react';
import { AssistantPage } from '@/features/assistant/AssistantPage';

export default function AskPage({ searchParams }: { searchParams: { consent?: string } }) {
  return <AssistantPage consentEnabled={searchParams.consent !== 'off'} />;
}
