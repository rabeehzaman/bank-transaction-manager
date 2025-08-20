export interface BankColor {
  name: string
  background: string
  text: string
  accent?: string
}

export const bankColors: Record<string, BankColor> = {
  'Rajhi': {
    name: 'Al Rajhi Bank',
    background: '#4B4FC7',
    text: '#ffffff'
  },
  'Ahli': {
    name: 'Saudi National Bank',
    background: '#1B5E3F',
    text: '#ffffff'
  },
  'Alinma': {
    name: 'Alinma Bank',
    background: '#744C42',
    text: '#ffffff'
  },
  'GIB': {
    name: 'Gulf International Bank',
    background: '#5C6670',
    text: '#ffffff',
    accent: '#FDB913'
  },
  'Riyad': {
    name: 'Riyad Bank',
    background: '#5B4C8C',
    text: '#ffffff',
    accent: '#00A19A'
  }
}

export function getBankColor(bankName: string): BankColor {
  return bankColors[bankName] || {
    name: bankName,
    background: '#6B7280',
    text: '#ffffff'
  }
}