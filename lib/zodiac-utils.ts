export interface ZodiacSign {
  name: string
  symbol: string
}

export function getZodiacSign(birthDate: Date): ZodiacSign {
  const month = birthDate.getMonth() + 1
  const day = birthDate.getDate()

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) {
    return { name: "Aries", symbol: "♈" }
  }
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) {
    return { name: "Tauro", symbol: "♉" }
  }
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) {
    return { name: "Géminis", symbol: "♊" }
  }
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) {
    return { name: "Cáncer", symbol: "♋" }
  }
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) {
    return { name: "Leo", symbol: "♌" }
  }
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) {
    return { name: "Virgo", symbol: "♍" }
  }
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) {
    return { name: "Libra", symbol: "♎" }
  }
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) {
    return { name: "Escorpio", symbol: "♏" }
  }
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) {
    return { name: "Sagitario", symbol: "♐" }
  }
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) {
    return { name: "Capricornio", symbol: "♑" }
  }
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) {
    return { name: "Acuario", symbol: "♒" }
  }
  return { name: "Piscis", symbol: "♓" }
}

export function calculateAge(birthDate: Date): number {
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  return age
}

export function isAtLeast18YearsOld(birthDate: Date): boolean {
  return calculateAge(birthDate) >= 18
}
