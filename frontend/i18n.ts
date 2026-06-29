import { getRequestConfig } from "next-intl/server";

const locales = ["uz", "ru", "en"];
const defaultLocale = "uz";

export { locales, defaultLocale };

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;
  return {
    locale: locale || defaultLocale,
    messages: (await import(`./messages/${locale || defaultLocale}.json`)).default,
  };
});
