const BLOCKED_KEYWORDS = [
  'wire money',
  'wire transfer',
  'send money',
  'transfer money',
  'bitcoin',
  'crypto',
  'cryptocurrency',
  'gift card',
  'itunes card',
  'google play card',
  'amazon card',
  'password',
  'bank details',
  'sort code',
  'account number',
  'routing number',
  'social security',
  'national insurance',
]

export function containsBlockedContent(text: string): boolean {
  const lower = text.toLowerCase()
  return BLOCKED_KEYWORDS.some((keyword) => lower.includes(keyword))
}

export const BLOCKED_RESPONSE =
  "For your safety, I can't help with that. Please speak to a family member or visit your bank in person if you need help with money or accounts."
