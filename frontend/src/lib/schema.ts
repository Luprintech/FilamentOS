import * as z from "zod";

export const formSchema = z.object({
  // This ID is for client-side tracking of a loaded project.
  id: z.string().optional(),

  // == Required Fields ==
  jobName: z.string().min(1, 'El nombre del trabajo es obligatorio.'),
  
  printingTimeHours: z.coerce.number().min(0),
  printingTimeMinutes: z.coerce.number().min(0),
  
  filamentWeight: z.coerce.number({ invalid_type_error: 'Debe ser un número' }).min(0.01, 'El peso del filamento es obligatorio.'),
  filamentType: z.string().min(1, 'El tipo de filamento es obligatorio.'),
  spoolPrice: z.coerce.number({ invalid_type_error: 'Debe ser un número' }).min(0.01, 'El precio de la bobina es obligatorio.'),
  spoolWeight: z.coerce.number({ invalid_type_error: 'Debe ser un número' }).min(1, 'El peso de la bobina es obligatorio.'),

  // == Optional Fields ==
  projectImage: z.string().optional(),
  currency: z.string().min(1, 'La moneda es obligatoria.'),
  powerConsumptionWatts: z.coerce.number().min(0),
  energyCostKwh: z.coerce.number().min(0),
  prepTime: z.coerce.number().min(0),
  prepCostPerHour: z.coerce.number().min(0),
  postProcessingTimeInMinutes: z.coerce.number().min(0),
  postProcessingCostPerHour: z.coerce.number().min(0),
  includeMachineCosts: z.boolean(),
  printerCost: z.coerce.number().min(0),
  investmentReturnYears: z.coerce.number().min(0),
  repairCost: z.coerce.number().min(0),
  otherCosts: z.array(z.object({
    name: z.string().min(1, 'El nombre del artículo no puede estar vacío.'),
    price: z.coerce.number().min(0),
  })),
  profitPercentage: z.coerce.number().min(0),
  vatPercentage: z.coerce.number().min(0),
})
.refine(data => data.printingTimeHours > 0 || data.printingTimeMinutes > 0, {
  message: "El tiempo total de impresión es obligatorio.",
  path: ["printingTimeHours"],
});

export type FormData = z.infer<typeof formSchema>;
