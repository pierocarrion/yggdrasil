'use client';

import { useEffect } from 'react';
import { logSettingsOpened } from '@/lib/analytics/client';

export function SettingsTracker() {
  useEffect(() => {
    logSettingsOpened();
  }, []);

  return null;
}
