import createMiddleware from "next-intl/middleware";

const locales = ["uz", "ru", "en"];
const defaultLocale = "uz";

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
});

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
