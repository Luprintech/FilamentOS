import { useState } from 'react';
import { MessageSquarePlus, Bug, Lightbulb, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { motion } from 'framer-motion';

type FeedbackType = 'bug' | 'suggestion' | 'other';

export function SugerenciasPage() {
  const [type, setType] = useState<FeedbackType>('suggestion');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;

    setSubmitting(true);

    // Simular envío (aquí iría la lógica real de envío)
    await new Promise(resolve => setTimeout(resolve, 1000));

    setSubmitted(true);
    setSubmitting(false);

    // Reset después de 3 segundos
    setTimeout(() => {
      setSubmitted(false);
      setMessage('');
      setType('suggestion');
    }, 3000);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-2xl border border-border/70 bg-card/60 p-5 sm:p-8 shadow-[0_12px_36px_rgba(2,8,23,0.10)] backdrop-blur-md dark:border-white/10 dark:shadow-[0_18px_60px_rgba(0,0,0,0.22)]"
      >
        <div className="flex items-start gap-3 sm:items-center sm:gap-4 mb-4">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <MessageSquarePlus className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground">Sugerencias y reportes</h1>
            <p className="text-sm text-muted-foreground">Ayúdanos a mejorar FilamentOS</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          Tu opinión es muy importante para nosotros. Comparte tus ideas, reporta bugs o sugiere nuevas funcionalidades.
          Cada comentario nos ayuda a hacer FilamentOS mejor para toda la comunidad de makers.
        </p>
      </motion.div>

      {/* Formulario */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="rounded-2xl border border-border/70 bg-card/60 p-5 sm:p-8 shadow-[0_12px_36px_rgba(2,8,23,0.10)] backdrop-blur-md dark:border-white/10 dark:shadow-[0_18px_60px_rgba(0,0,0,0.22)]"
      >
        {submitted ? (
          <div className="text-center py-12">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30">
                <Check className="h-8 w-8 text-emerald-500" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">¡Gracias por tu feedback!</h2>
            <p className="text-sm text-muted-foreground">
              Hemos recibido tu mensaje. Lo revisaremos pronto.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tipo de feedback */}
            <div className="space-y-3">
              <Label className="text-sm font-bold text-foreground">¿Qué quieres compartir?</Label>
              <RadioGroup value={type} onValueChange={(v) => setType(v as FeedbackType)}>
                <div className="flex items-center space-x-2 rounded-xl border border-border/50 bg-muted/10 p-4 transition-all hover:border-primary/50">
                  <RadioGroupItem value="suggestion" id="suggestion" />
                  <Label htmlFor="suggestion" className="flex-1 cursor-pointer flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-semibold">Sugerencia de mejora</span>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 rounded-xl border border-border/50 bg-muted/10 p-4 transition-all hover:border-primary/50">
                  <RadioGroupItem value="bug" id="bug" />
                  <Label htmlFor="bug" className="flex-1 cursor-pointer flex items-center gap-2">
                    <Bug className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-semibold">Reporte de bug</span>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 rounded-xl border border-border/50 bg-muted/10 p-4 transition-all hover:border-primary/50">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other" className="flex-1 cursor-pointer flex items-center gap-2">
                    <MessageSquarePlus className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-semibold">Otro</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Mensaje */}
            <div className="space-y-3">
              <Label htmlFor="message" className="text-sm font-bold text-foreground">
                Tu mensaje
              </Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  type === 'bug'
                    ? 'Describe el problema: ¿qué esperabas que pasara y qué pasó realmente?'
                    : type === 'suggestion'
                    ? 'Cuéntanos tu idea: ¿qué funcionalidad te gustaría ver en FilamentOS?'
                    : 'Escribe tu comentario aquí...'
                }
                rows={8}
                required
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Sé lo más específico posible. Si reportas un bug, incluye los pasos para reproducirlo.
              </p>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={!message.trim() || submitting}
              className="w-full rounded-full font-bold"
              size="lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <MessageSquarePlus className="mr-2 h-4 w-4" />
                  Enviar feedback
                </>
              )}
            </Button>
          </form>
        )}
      </motion.div>

      {/* Info adicional */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="rounded-xl border border-border/50 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10 p-4"
      >
        <p className="text-xs text-muted-foreground text-center">
          También puedes contactarnos directamente por email:{' '}
          <a href="mailto:luprintech@gmail.com" className="text-primary hover:underline font-semibold">
            luprintech@gmail.com
          </a>
        </p>
      </motion.div>
    </div>
  );
}
