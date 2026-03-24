import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import BottomNav from "./components/BottomNav";
import Header from "./components/Header";
import Player from "./components/Player";
import ProfileSetupModal from "./components/ProfileSetupModal";
import Sidebar from "./components/Sidebar";
import { PlayerProvider } from "./context/PlayerContext";
import { useActor } from "./hooks/useActor";
import { InternetIdentityProvider } from "./hooks/useInternetIdentity";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useCallerProfile } from "./hooks/useQueries";
import ArtistPage from "./pages/ArtistPage";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import SearchPage from "./pages/SearchPage";
import UploadPage from "./pages/UploadPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

// Root layout component
function RootLayout() {
  const { identity, isInitializing } = useInternetIdentity();
  const { isFetching: actorFetching } = useActor();
  const {
    data: profile,
    isLoading: profileLoading,
    isFetched,
  } = useCallerProfile();

  // While auth is initializing, show a loading screen
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <img
          src="/assets/uploads/img-20260324-wa0012_3-019d2186-3c1a-7650-b08c-92b83c484338-1.jpg"
          alt="Kulongo Play"
          className="w-16 h-16 rounded-2xl object-cover shadow-glow animate-pulse"
        />
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  // If not authenticated, show auth gate
  if (!identity) {
    return <AuthPage />;
  }

  const showProfileSetup =
    !!identity &&
    !actorFetching &&
    !profileLoading &&
    isFetched &&
    profile === null;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Header />
      <main className="md:pl-56 pt-14 pb-24 md:pb-28">
        <div className="px-4 md:px-6 py-6 max-w-screen-xl mx-auto">
          <Outlet />
        </div>
      </main>
      <BottomNav />
      <Player />
      <ProfileSetupModal
        open={showProfileSetup}
        onComplete={() => {
          queryClient.invalidateQueries({ queryKey: ["profile"] });
        }}
      />
    </div>
  );
}

const rootRoute = createRootRoute({ component: RootLayout });

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});
const searchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/search",
  component: SearchPage,
});
const uploadRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/upload",
  component: UploadPage,
});
const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: ProfilePage,
});
const artistRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/artist/$name",
  component: ArtistPage,
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  searchRoute,
  uploadRoute,
  profileRoute,
  artistRoute,
]);

const router = createRouter({ routeTree, defaultPreload: "intent" });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <InternetIdentityProvider>
        <PlayerProvider>
          <RouterProvider router={router} />
          <Toaster
            position="top-right"
            toastOptions={{
              classNames: {
                toast: "bg-card border-border text-foreground",
                success: "border-l-4 border-l-green-500",
                error: "border-l-4 border-l-destructive",
              },
            }}
          />
        </PlayerProvider>
      </InternetIdentityProvider>
    </QueryClientProvider>
  );
}
