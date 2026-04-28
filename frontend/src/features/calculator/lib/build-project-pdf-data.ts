import type { ProjectData } from '@/features/calculator/api/use-pdf-customization';
import { calculateCostBreakdown } from '@/features/calculator/domain/cost-calculator';
import type { FormData } from '@/lib/schema';

export function buildProjectPdfData(project: FormData): ProjectData {
  const calculations = calculateCostBreakdown({
    printingTimeHours: Number(project.printingTimeHours || 0),
    printingTimeMinutes: Number(project.printingTimeMinutes || 0),
    filamentWeight: Number(project.filamentWeight || 0),
    spoolWeight: Number(project.spoolWeight || 1000),
    spoolPrice: Number(project.spoolPrice || 0),
    filaments: (project.filaments ?? [])
      .filter((filament) => Number(filament.grams) > 0)
      .map((filament) => ({
        grams: Number(filament.grams || 0),
        spoolPrice: Number(filament.spoolPrice || 0),
        spoolWeight: Number(filament.spoolWeight || 1000),
      })),
    powerConsumptionWatts: Number(project.powerConsumptionWatts || 0),
    energyCostKwh: Number(project.energyCostKwh || 0),
    prepTime: Number(project.prepTime || 0),
    prepCostPerHour: Number(project.prepCostPerHour || 0),
    postProcessingTimeInMinutes: Number(project.postProcessingTimeInMinutes || 0),
    postProcessingCostPerHour: Number(project.postProcessingCostPerHour || 0),
    includeMachineCosts: project.includeMachineCosts,
    printerCost: Number(project.printerCost || 0),
    investmentReturnYears: Number(project.investmentReturnYears || 0),
    repairCost: Number(project.repairCost || 0),
    otherCosts: project.otherCosts || [],
    profitPercentage: Number(project.profitPercentage || 0),
    vatPercentage: Number(project.vatPercentage || 0),
  });

  return {
    jobName: project.jobName,
    printingTimeHours: Number(project.printingTimeHours || 0),
    printingTimeMinutes: Number(project.printingTimeMinutes || 0),
    filamentWeight: Number(project.filamentWeight || 0),
    spoolWeight: Number(project.spoolWeight || 1000),
    spoolPrice: Number(project.spoolPrice || 0),
    powerConsumptionWatts: Number(project.powerConsumptionWatts || 0),
    energyCostKwh: Number(project.energyCostKwh || 0),
    prepTime: Number(project.prepTime || 0),
    prepCostPerHour: Number(project.prepCostPerHour || 0),
    postProcessingTimeInMinutes: Number(project.postProcessingTimeInMinutes || 0),
    postProcessingCostPerHour: Number(project.postProcessingCostPerHour || 0),
    includeMachineCosts: project.includeMachineCosts,
    printerCost: Number(project.printerCost || 0),
    investmentReturnYears: Number(project.investmentReturnYears || 0),
    repairCost: Number(project.repairCost || 0),
    otherCosts: (project.otherCosts || []).map((item) => ({
      description: item.name || '',
      cost: Number(item.price || 0),
    })),
    profitPercentage: Number(project.profitPercentage || 0),
    vatPercentage: Number(project.vatPercentage || 0),
    currency: project.currency || 'EUR',
    filamentCost: calculations.filamentCost,
    electricityCost: calculations.electricityCost,
    laborCost: calculations.laborCost,
    machineCost: calculations.currentMachineCost,
    otherCostsTotal: calculations.otherCostsTotal,
    subTotal: calculations.subTotal,
    profitAmount: calculations.profitAmount,
    priceBeforeVat: calculations.priceBeforeVat,
    vatAmount: calculations.vatAmount,
    finalPrice: calculations.finalPrice,
  };
}
