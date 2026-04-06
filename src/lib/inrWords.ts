const ones = [
  "",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];

const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function twoDigits(n: number): string {
  if (n < 20) return ones[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return o ? `${tens[t]} ${ones[o]}` : tens[t];
}

function threeDigits(n: number): string {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  const tail = rest ? twoDigits(rest) : "";
  if (h === 0) return tail;
  return tail ? `${ones[h]} hundred ${tail}` : `${ones[h]} hundred`;
}

/** 0 .. 99_99_99_999 */
function rupeesToWords(n: number): string {
  if (n === 0) return "zero";
  const crore = Math.floor(n / 1_00_00_000);
  n %= 1_00_00_000;
  const lakh = Math.floor(n / 1_00_000);
  n %= 1_00_000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const last = n;
  const parts: string[] = [];
  if (crore) parts.push(`${threeDigits(crore)} crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} thousand`);
  if (last) parts.push(threeDigits(last));
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

/** Indian GST-style amount in words (rupees + paise), from paise-rounded total (avoids float drift). */
export function inrAmountInWords(amount: number): string {
  if (!Number.isFinite(amount) || amount < 0) return "";
  const totalPaise = Math.round(Number(amount.toFixed(2)) * 100);
  const rupees = Math.floor(totalPaise / 100);
  const paise = totalPaise % 100;
  const r = rupeesToWords(rupees);
  const cap = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());
  const rupeeWord = rupees === 1 ? "rupee" : "rupees";
  if (paise === 0) {
    return `${cap(r)} ${rupeeWord} only`;
  }
  const p = rupeesToWords(paise);
  return `${cap(r)} ${rupeeWord} and ${cap(p)} paise only`;
}
