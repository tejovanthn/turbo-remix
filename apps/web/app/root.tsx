import type {
  LinksFunction,
  LoaderFunction,
  MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";

import { MantineProvider, createEmotionCache, Container } from "@mantine/core";
import { StylesPlaceholder } from "@mantine/remix";
import { theme } from "./theme";

import { getUser } from "./session.server";
import { HeaderAction } from "./components/HeaderAction/HeaderAction";
import { useOptionalUser } from "./utils";

createEmotionCache({ key: "mantine" });

export const links: LinksFunction = () => {
  return [{ rel: "icon", href: "/_static/favicon.ico" }];
};

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "Remix Notes",
  viewport: "width=device-width,initial-scale=1",
});

type LoaderData = {
  user: Awaited<ReturnType<typeof getUser>>;
};

export const loader: LoaderFunction = async ({ request }) => {
  return json<LoaderData>({
    user: await getUser(request),
  });
};

export default function App() {
  const user = useOptionalUser();
  return (
    <MantineProvider theme={theme} withGlobalStyles withNormalizeCSS>
      <html lang="en" className="h-full">
        <head>
          <StylesPlaceholder />
          <Meta />
          <Links />
        </head>
        <body className="h-full">
          <HeaderAction links={[]} user={user} />
          <Container>
            <Outlet />
          </Container>
          <ScrollRestoration />
          <Scripts />
          <LiveReload />
        </body>
      </html>
    </MantineProvider>
  );
}
