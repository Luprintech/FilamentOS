
import type { FormData } from '@/lib/schema';

// We use this object to initialize the form with default values.
// This decouples the form's initial state from the validation schema,
// preventing issues where default "empty" values don't pass validation checks
// that are intended for submitted data.
export const defaultFormValues: FormData = {
  id: undefined,
  jobName: '',
  printingTimeHours: 0,
  printingTimeMinutes: 0,
  filamentWeight: 0,
  filamentType: '',
  spoolPrice: 20,
  spoolWeight: 1000,
  projectImage: '',
  currency: 'EUR',
  powerConsumptionWatts: 0,
  energyCostKwh: 0,
  prepTime: 0,
  prepCostPerHour: 30,
  postProcessingTimeInMinutes: 0,
  postProcessingCostPerHour: 30,
  includeMachineCosts: false,
  printerCost: 0,
  investmentReturnYears: 0,
  repairCost: 0,
  otherCosts: [],
  profitPercentage: 20,
  vatPercentage: 0,
};
