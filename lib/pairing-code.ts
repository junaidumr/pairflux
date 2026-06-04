/** Random 3-digit code in range 100–999. */
export function generatePairingCode(): string {
  return String(Math.floor(100 + Math.random() * 900));
}

export function isValidPairingCodeInput(value: string): boolean {
  return /^\d{3}$/.test(value) && Number(value) >= 100 && Number(value) <= 999;
}
