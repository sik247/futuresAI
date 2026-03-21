export type Dictionary = {
  home: string;
  dashboard: string;
  news: string;
  exchanges: string;
  community: string;
  services: string;
  calculator: string;
  charts: string;
  sns: string;
  markets: string;
  whales: string;
  payback: string;
  live: string;
  team: string;
  login: string;
  signup: string;
  insights: string;
  signals: string;
}

const dictionaries = {
  en: () => import('./en.json').then((module) => module.default as Dictionary),
  ko: () => import('./ko.json').then((module) => module.default as Dictionary),
};

export type ValidLocale = keyof typeof dictionaries;

export const getDictionary = async (locale: string | undefined) => {
  const validLocale = locale && locale in dictionaries ? locale as ValidLocale : 'en';
  
  try {
    return await dictionaries[validLocale]();
  } catch (error) {
    console.error(`Failed to load dictionary for locale '${validLocale}'`, error);
    return dictionaries.en();
  }
};