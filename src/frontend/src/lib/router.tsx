import { Layout } from "@/components/Layout";
import { ChatPage } from "@/pages/Chat";
import { DocumentDetailPage } from "@/pages/DocumentDetail";
import { DocumentsPage } from "@/pages/Documents";
import { Home } from "@/pages/Home";
import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

export interface DocumentsSearch {
  q?: string;
  type?: "pdf" | "txt" | "markdown";
}

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
  validateSearch: (search: Record<string, unknown>): DocumentsSearch => ({
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

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  scrollRestoration: true,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
