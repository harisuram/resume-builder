const ONES = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen",
];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

/** English words for 0–99 ("forty", "thirty-one"); digits beyond that. Copy
 * that spells out a count reads better than "40" in running text. */
export function numberToWords(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 99) return String(n);
  if (n < 20) return ONES[n];
  const tens = TENS[Math.floor(n / 10)];
  const ones = n % 10;
  return ones ? `${tens}-${ONES[ones]}` : tens;
}

/** Same, capitalised for the start of a sentence or title ("Forty"). */
export function capitalizedNumberWords(n: number): string {
  const words = numberToWords(n);
  return words.charAt(0).toUpperCase() + words.slice(1);
}
