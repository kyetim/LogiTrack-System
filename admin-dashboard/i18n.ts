import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async () => {
    // Get locale from cookie or default to Turkish
    const locale = 'tr'; // We'll make this dynamic later

    return {
        locale,
        messages: (await import(`./messages/${locale}.json`)).default
    };
});
