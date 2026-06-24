// Tiny coloured logger (no deps).
const c = (n: number) => (s: string) => `\x1b[${n}m${s}\x1b[0m`
const dim = c(2), cyan = c(36), green = c(32), red = c(31), yellow = c(33)

export const log = {
  step: (s: string) => console.log(`${cyan('›')} ${s}`),
  info: (s: string) => console.log(`  ${dim(s)}`),
  ok: (s: string) => console.log(`${green('✓')} ${s}`),
  warn: (s: string) => console.warn(`${yellow('!')} ${s}`),
  err: (s: string) => console.error(`${red('✗')} ${s}`),
}
