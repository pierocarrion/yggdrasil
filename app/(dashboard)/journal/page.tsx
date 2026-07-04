import { Composer } from "@/components/journal/Composer";

interface JournalPageProps {
  searchParams: Promise<{ rootId?: string }>;
}

export default async function JournalPage({ searchParams }: JournalPageProps) {
  const { rootId } = await searchParams;

  return (
    <div className="max-w-5xl mx-auto py-6 md:py-12 px-4 sm:px-6 w-full flex flex-col md:h-full">
      <div className="mb-6 md:mb-10">
        <h1 className="text-2xl sm:text-3xl font-display text-foreground mb-3">Write Entry</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Capture your thoughts, mood, and reflections using text or voice.
        </p>
      </div>
      <div className="flex-1">
        <Composer linkRootId={rootId ?? null} />
      </div>
    </div>
  );
}
