import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import BottomNav from "./components/BottomNav";
import Header from "./components/Header";
import Player from "./components/Player";
import ProfileSetupModal from "./components/ProfileSetupModal";
import Sidebar from "./components/Sidebar";
import { PlayerProvider } from "./context/PlayerContext";
import { useActor } from "./hooks/useActor";
import { InternetIdentityProvider } from "./hooks/useInternetIdentity";
import { useCallerProfile } from "./hooks/useQueries";
import AdminPage from "./pages/AdminPage";
import ArtistPage from "./pages/ArtistPage";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import PlaylistPage from "./pages/PlaylistPage";
import ProfilePage from "./pages/ProfilePage";
import SearchPage from "./pages/SearchPage";
import SubscriptionPage from "./pages/SubscriptionPage";
import UploadPage from "./pages/UploadPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function getCurrentSession() {
  try {
    return JSON.parse(localStorage.getItem("kulongo_session") ?? "null");
  } catch {
    return null;
  }
}

// Root layout component
function RootLayout() {
  const { isFetching: actorFetching } = useActor();
  const {
    data: profile,
    isLoading: profileLoading,
    isFetched,
  } = useCallerProfile();

  const session = getCurrentSession();

  // If not logged in via local session, show auth gate
  if (!session) {
    return <AuthPage />;
  }

  const isListener =
    session.role === "ouvinte" ||
    localStorage.getItem("kulongo_user_role") === "ouvinte";

  const showProfileSetup =
    !actorFetching &&
    !profileLoading &&
    isFetched &&
    profile === null &&
    !isListener;

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

const rootRoute = createRootRoute({ component: () => <Outlet /> });

// App layout (auth-gated)
const appLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "app-layout",
  component: RootLayout,
});

// Admin route (no auth gate from RootLayout)
const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminPage,
});

const homeRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/",
  component: HomePage,
});
const searchRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/search",
  component: SearchPage,
});
const uploadRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/upload",
  component: UploadPage,
});
const profileRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/profile",
  component: ProfilePage,
});
const artistRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/artist/$name",
  component: ArtistPage,
});
const playlistRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/playlist/$mood",
  component: PlaylistPage,
});

const subscriptionRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/subscription",
  component: SubscriptionPage,
});

const routeTree = rootRoute.addChildren([
  appLayoutRoute.addChildren([
    homeRoute,
    searchRoute,
    uploadRoute,
    profileRoute,
    artistRoute,
    playlistRoute,
    subscriptionRoute,
  ]),
  adminRoute,
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
