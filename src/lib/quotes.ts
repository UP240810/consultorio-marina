import quotes from "./quotes.json";

/** 500 frases distintas — ver scripts/generate_quotes.py para su origen. */
export const QUOTES: string[] = quotes as string[];

/**
 * Determinista por día: la misma frase se muestra todo el día (útil si la
 * psicóloga cierra sesión y vuelve a entrar), pero cambia cada día natural.
 */
export function getQuoteOfTheDay(date: Date = new Date()): string {
  const dayNumber = Math.floor(date.getTime() / (1000 * 60 * 60 * 24));
  const index = dayNumber % QUOTES.length;
  return QUOTES[index];
}

export function getRandomQuote(): string {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}
