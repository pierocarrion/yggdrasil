import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth } from '@/lib/firebase/admin';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__session')?.value;

  let isAdmin = false;
  if (sessionCookie) {
    try {
      const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
      isAdmin = decoded.admin === true;
    } catch {
      // Invalid/expired/revoked session cookie — treat as unauthenticated.
      isAdmin = false;
    }
  }

  // redirect() throws a control-flow signal, so keep it out of the try/catch above.
  if (!isAdmin) {
    redirect('/admin/login');
  }

  return <>{children}</>;
}
