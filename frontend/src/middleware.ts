import createMiddleware from "next-intl/proxy";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: [
    // Match all pathnames except static files and api routes
    "/((?!_next|_vercel|.*\\..*).*)",
  ],
};
