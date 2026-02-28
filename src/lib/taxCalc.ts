export type Residency = 'resident' | 'non-resident';
export type Sector = 'private' | 'public';
export type NSSFSplit = '10-10' | '5-15';
export type Period = 'monthly' | 'annual';

export interface PAYEResult {
  paye: number;
  bracket: string;
}

export interface TaxResult {
  gross: number;
  employeeNSSF: number;
  employerNSSF: number;
  taxableIncome: number;
  paye: number;
  bracket: string;
  sdl: number;
  wcf: number;
  netSalary: number;
  totalEmployerCost: number;
  effectiveRate: string;
  employeeNSSFRate: number;
  employerNSSFRate: number;
}

export function fmt(n: number): string {
  return Math.round(n).toLocaleString('en-TZ');
}

export function calculatePAYE(taxableMonthly: number, residency: Residency): PAYEResult {
  if (residency === 'non-resident') {
    return { paye: taxableMonthly * 0.15, bracket: 'Flat 15% (non-resident)' };
  }

  let paye = 0;
  let bracket = '';

  if (taxableMonthly <= 270000) {
    paye = 0;
    bracket = '0% bracket (up to TZS 270,000)';
  } else if (taxableMonthly <= 520000) {
    paye = (taxableMonthly - 270000) * 0.09;
    bracket = '9% bracket (TZS 270,001 – 520,000)';
  } else if (taxableMonthly <= 760000) {
    paye = 22500 + (taxableMonthly - 520000) * 0.20;
    bracket = '20% bracket (TZS 520,001 – 760,000)';
  } else if (taxableMonthly <= 1000000) {
    paye = 70500 + (taxableMonthly - 760000) * 0.25;
    bracket = '25% bracket (TZS 760,001 – 1,000,000)';
  } else {
    paye = 130500 + (taxableMonthly - 1000000) * 0.30;
    bracket = '30% bracket (above TZS 1,000,000)';
  }

  return { paye, bracket };
}

export function calculate(
  gross: number,
  residency: Residency,
  nssfSplit: NSSFSplit,
): TaxResult {
  const employeeNSSFRate = nssfSplit === '10-10' ? 0.10 : 0.05;
  const employerNSSFRate = nssfSplit === '10-10' ? 0.10 : 0.15;

  const employeeNSSF = gross * employeeNSSFRate;
  const employerNSSF = gross * employerNSSFRate;
  const taxableIncome = gross - employeeNSSF;

  const { paye, bracket } = calculatePAYE(taxableIncome, residency);

  const sdl = gross * 0.035;
  const wcf = gross * 0.005;
  const netSalary = gross - employeeNSSF - paye;
  const totalEmployerCost = gross + employerNSSF + sdl + wcf;
  const effectiveRate = ((paye / gross) * 100).toFixed(1);

  return {
    gross,
    employeeNSSF,
    employerNSSF,
    taxableIncome,
    paye,
    bracket,
    sdl,
    wcf,
    netSalary,
    totalEmployerCost,
    effectiveRate,
    employeeNSSFRate,
    employerNSSFRate,
  };
}
