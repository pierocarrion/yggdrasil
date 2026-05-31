import { redirect } from 'next/navigation';

export default function Home() {
  // Landing / redirect to login
  redirect('/login');
}
