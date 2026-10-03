import { Layout } from "@/components/Layout";
import { ChatPage } from "@/pages/Chat";
import { DocumentDetailPage } from "@/pages/DocumentDetail";
import { DocumentsPage } from "@/pages/Documents";
import { Home } from "@/pages/Home";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";

/**
 * The app's route tree, rebuilt for tests with a memory history so a test can
 * mount any route at a chosen URL. Route ids and paths mirror `@/lib/router`
 * exactly, because pages read `useSearch({ from: "/layout/documents" })` and
 * `useParams({ from: "/layout/documents/$id" })` by those ids.
 */
function buildTestRouter(initialPath: string) {
  const rootRoute = createRootRoute({
    component: () => <Outlet />,
  });

  const layoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: "layout",
    component: Layout,
  });

  const homeRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: "/",
    component: Home,
  });

  const documentsRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: "/documents",
    validateSearch: (search: Record<string, unknown>) => ({
      q:
        typeof search.q === "string" && search.q.length > 0
          ? search.q
          : undefined,
      type:
        search.type === "pdf" ||
        search.type === "txt" ||
        search.type === "markdown"
          ? search.type
          : undefined,
    }),
    component: DocumentsPage,
  });

  const documentDetailRoute = createRoute({
    getParentRoute: () => documentsRoute,
    path: "$id",
    component: DocumentDetailPage,
  });

  const chatRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: "/chat",
    component: ChatPage,
  });

  const routeTree = rootRoute.addChildren([
    layoutRoute.addChildren([
      homeRoute,
      documentsRoute.addChildren([documentDetailRoute]),
      chatRoute,
    ]),
  ]);

  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
}

export interface RenderAppOptions {
  /** URL to mount, e.g. `/documents?type=pdf`. Defaults to `/`. */
  path?: string;
}

/**
 * Render the real app shell (Layout + routed page) at `path` inside a fresh
 * QueryClient. Returns the router so a test can assert navigation.
 *
 * `RouterProvider` mounts its matched route asynchronously, so the router is
 * loaded before the first render and the returned promise resolves once the
 * initial route has committed. Awaiting this helper is what makes a synchronous
 * `getBy*` query see the page instead of an empty container.
 */
export async function renderApp({ path = "/" }: RenderAppOptions = {}) {
  const router = buildTestRouter(path);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });

  await router.load();

  const ui: ReactElement = (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );

  return { ...render(ui), router, queryClient };
}
