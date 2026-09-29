import quotes from "./quotes.json";

export const QUOTES: string[] = quotes as string[];

export function getQuoteOfTheDay(date: Date = new Date()): string {
  const dayNumber = Math.floor(date.getTime() / (1000 * 60 * 60 * 24));
  const index = dayNumber % QUOTES.length;
  return QUOTES[index];
}

export function getRandomQuote(): string {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}
