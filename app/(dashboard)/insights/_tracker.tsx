'use client';

import { useEffect } from 'react';
import { logInsightsTabViewed } from '@/lib/analytics/client';

export function InsightsTracker() {
  useEffect(() => {
    logInsightsTabViewed();
  }, []);

  return null;
}
