import { InsightsTracker } from './_tracker';
import { StreakCalendar } from '@/components/insights/StreakCalendar';
import { MoodCharts } from '@/components/insights/MoodCharts';
import { EmotionalPatterns } from '@/components/insights/EmotionalPatterns';
import { ClusterMap } from '@/components/insights/ClusterMap';
import { KnowledgeGraph } from '@/components/insights/KnowledgeGraph';

export default function InsightsPage() {
  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6">
      <InsightsTracker />
      
      <div className="mb-10">
        <h1 className="text-2xl sm:text-3xl font-display text-foreground mb-3">Insights</h1>
        <p className="text-muted-foreground">
          Discover patterns in your journaling journey and visualize your growth over time.
        </p>
      </div>

      <div className="mt-8 mb-12">
        <StreakCalendar />
      </div>

      <div className="mb-12">
        <MoodCharts />
      </div>

      <div className="mb-12">
        <EmotionalPatterns />
      </div>

      <div className="mb-12">
        <KnowledgeGraph />
      </div>

      <div className="mb-12">
        <ClusterMap />
      </div>

    </div>
  );
}
