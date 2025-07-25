'use client';
// This file creates a provider that:

// Connects your React app (frontend) to tRPC (your backend API).

// Connects your app to React Query (which fetches/caches your data).

// Makes sure it works correctly in both server and browser environments.

// ^-- to make sure we can mount the Provider from a server component
import superjson from 'superjson';
import type { QueryClient } from '@tanstack/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTRPCClient, httpBatchLink } from '@trpc/client'; // Connects the browser to your tRPC API.
import { createTRPCContext } from '@trpc/tanstack-react-query'; // Prepares tools to use tRPC in React.
import { useState } from 'react';
import { makeQueryClient } from './query-client'; // A helper that makes a QueryClient
import type { AppRouter } from './routers/_app';
// TRPCProvider: Wraps your app so it can use tRPC.
// useTRPC: A hook to access tRPC in your components.
export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();

let browserQueryClient: QueryClient;
// This function makes sure we get one query client — like one shared door to get data.

// On server: always make a new door.

// On browser: reuse the same door, don’t keep making new ones.

// This avoids problems when React renders things multiple times (called “suspense”).
function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient();
  }
  // Browser: make a new query client if we don't already have one
  // This is very important, so we don't re-make a new client if React
  // suspends during the initial render. This may not be needed if we
  // have a suspense boundary BELOW the creation of the query client
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

// This function builds the correct URL to talk to the API:
// On browser: use '' (same origin).
// On server:
// use NEXT_PUBLIC_APP_URL
function getUrl() {
  const base = (() => {
    if (typeof window !== 'undefined') return '';
    return process.env.NEXT_PUBLIC_APP_URL;
  })();
  return `${base}/api/trpc`;
}
// This is your main wrapper for the app.
// It:
// Creates a queryClient
// Creates a trpcClient (only once using useState)
export function TRPCReactProvider(
  props: Readonly<{
    children: React.ReactNode;
  }>
) {
  // NOTE: Avoid useState when initializing the query client if you don't
  //       have a suspense boundary between this and the code that may
  //       suspend because React will throw away the client on the initial
  //       render if it suspends and there is no boundary
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          transformer: superjson, 
          url: getUrl(),
        }),
      ],
    })
  );
  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {props.children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}

// So you can use useTRPC().example.someQuery() in your React app.

// React Query will cache, refetch, and track loading states.

// tRPC will talk to your backend API safely and smartly.
