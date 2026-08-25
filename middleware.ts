import createMiddleware from "next-intl/middleware";

export default createMiddleware({
  // A list of all locales that are supported
  locales: ["en", "am"],

  // If this locale is matched, pathnames work without a prefix (e.g. `/about`)
  defaultLocale: "en",
});

export const config = {
  // Skip all paths that should not be internationalized
  // This matches all paths except api, _next, and any files with extensions (like .jpg)
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
