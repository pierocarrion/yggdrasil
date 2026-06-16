'use client';

import { useEffect } from 'react';
import { logLivingTreeViewed } from '@/lib/analytics/client';

export function RootsTracker() {
  useEffect(() => {
    logLivingTreeViewed();
  }, []);

  return null;
}
