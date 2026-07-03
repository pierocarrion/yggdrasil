import { MarketingHome } from '@/components/marketing/Home';

export default function Home() {
  // Marketing homepage ("The Ascent"). Signed-in users are redirected to the
  // app from within MarketingHome once the auth state resolves.
  return <MarketingHome />;
}
