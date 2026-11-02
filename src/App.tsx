import { createBrowserRouter, Link, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, RequireAuth } from '@/auth/AuthContext';
import { ToastProvider } from '@/components/ui/Toast';
import { AppLayout } from '@/components/layout/AppLayout';
import { Logo } from '@/components/ui/Logo';
import { Splash } from '@/pages/auth/Splash';
import { Onboarding } from '@/pages/auth/Onboarding';
import { Login } from '@/pages/auth/Login';
import { SignUp } from '@/pages/auth/SignUp';
import { ForgotPassword } from '@/pages/auth/ForgotPassword';
import { Otp } from '@/pages/auth/Otp';
import { CreatePassword } from '@/pages/auth/CreatePassword';
import { SetupProfile } from '@/pages/auth/SetupProfile';
import { Home } from '@/pages/app/Home';
import { Transactions } from '@/pages/app/Transactions';
import { AddTransaction } from '@/pages/app/AddTransaction';
import { EditTransaction } from '@/pages/app/EditTransaction';
import { Analytics } from '@/pages/app/Analytics';
import { Budget } from '@/pages/app/Budget';
import { SetBudget } from '@/pages/app/SetBudget';
import { Notifications } from '@/pages/app/Notifications';
import { Profile } from '@/pages/app/Profile';
import { EditProfile } from '@/pages/app/EditProfile';
import { Landing } from '@/pages/Landing';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function NotFound() {
  return (
    <main className="app-shell flex min-h-[100dvh] flex-col items-center justify-center px-8 text-center">
      <Logo size={56} />
      <p className="mt-6 text-caption font-semibold uppercase tracking-[0.2em] text-brand-700">404</p>
      <h1 className="mt-2 text-h5 text-ink-900">This page wandered off</h1>
      <p className="mt-2 text-psm text-ink-500">
        The page you’re looking for doesn’t exist. Let’s get you back on track.
      </p>
      <Link
        to="/app"
        className="mt-6 inline-flex min-h-[48px] items-center rounded-[12px] bg-brand-700 px-6 text-pmd font-medium text-white shadow-brand transition hover:bg-brand-600"
      >
        Go to dashboard
      </Link>
      <Link to="/landing" className="mt-3 text-psm font-medium text-brand-700 hover:underline">
        Visit the landing page
      </Link>
    </main>
  );
}

const router = createBrowserRouter([
  { path: '/', element: <Splash /> },
  { path: '/onboarding', element: <Onboarding /> },
  { path: '/login', element: <Login /> },
  { path: '/signup', element: <SignUp /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/otp', element: <Otp /> },
  { path: '/create-password', element: <CreatePassword /> },
  {
    path: '/setup',
    element: (
      <RequireAuth skipProfileCheck>
        <SetupProfile />
      </RequireAuth>
    ),
  },
  {
    path: '/app',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Home /> },
      { path: 'transactions', element: <Transactions /> },
      { path: 'transactions/new', element: <AddTransaction /> },
      { path: 'transactions/:id/edit', element: <EditTransaction /> },
      { path: 'analytics', element: <Analytics /> },
      { path: 'budget', element: <Budget /> },
      { path: 'budget/set', element: <SetBudget /> },
      { path: 'notifications', element: <Notifications /> },
      { path: 'profile', element: <Profile /> },
      { path: 'profile/edit', element: <EditProfile /> },
    ],
  },
  { path: '/landing', element: <Landing /> },
  { path: '*', element: <NotFound /> },
]);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <RouterProvider router={router} future={{ v7_startTransition: true }} />
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
