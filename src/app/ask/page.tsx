import React from 'react';
import { AssistantPage } from '@/features/assistant/AssistantPage';

export default async function AskPage({
  searchParams,
}: {
  searchParams: Promise<{ consent?: string }>;
}) {
  const params = await searchParams;
  return <AssistantPage consentEnabled={params.consent !== 'off'} />;
}
