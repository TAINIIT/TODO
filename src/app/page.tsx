import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to tasks page (auth check happens in dashboard layout)
  redirect('/tasks');
}
