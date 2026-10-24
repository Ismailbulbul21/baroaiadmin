const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export function generateCode(length = 6): string {
  let code = ''
  for (let i = 0; i < length; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return code
}
