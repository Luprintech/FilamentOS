import {ai} from '../genkit';
import {z} from 'genkit';

const AnalyzeGcodeInputSchema = z.object({
  filename: z.string().describe('Name of the uploaded gcode file.'),
  gcodeDataUri: z.string().describe(
    "The G-code file data as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
});
export type AnalyzeGcodeInput = z.infer<typeof AnalyzeGcodeInputSchema>;

const AnalyzeGcodeOutputSchema = z.object({
  printingTimeSeconds: z.number().describe('The estimated printing time in seconds.'),
  filamentWeightGrams: z.number().describe('The estimated filament weight in grams.'),
});
export type AnalyzeGcodeOutput = z.infer<typeof AnalyzeGcodeOutputSchema>;

export async function analyzeGcode(input: AnalyzeGcodeInput): Promise<AnalyzeGcodeOutput> {
  return analyzeGcodeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeGcodePrompt',
  input: {schema: AnalyzeGcodeInputSchema},
  output: {schema: AnalyzeGcodeOutputSchema},
  prompt: `You are an expert 3D printing analyst. Your job is to extract the estimated printing time and filament weight from a G-code file.

  Analyze the G-code file provided and extract the printing time in seconds and the filament weight in grams.

  G-code File Name: {{{filename}}}
  G-code File Content: {{{gcodeDataUri}}}

  Ensure that the printing time is in seconds and the filament weight is in grams. Do your best to estimate even if the data is not directly available.
  `,
});

const analyzeGcodeFlow = ai.defineFlow(
  {
    name: 'analyzeGcodeFlow',
    inputSchema: AnalyzeGcodeInputSchema,
    outputSchema: AnalyzeGcodeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('No se pudo obtener una respuesta del análisis de G-code.');
    }
    return output;
  }
);
