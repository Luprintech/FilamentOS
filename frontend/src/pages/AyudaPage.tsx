import { MessageCircleQuestion, Calculator, BarChart3, Package, Settings, FileText, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export function AyudaPage() {
  const faqs = [
    {
      category: 'Calculadora de costes',
      icon: Calculator,
      questions: [
        {
          q: '¿Cómo calculo el coste de una impresión?',
          a: 'Introduce el peso del filamento usado (en gramos) y el tiempo de impresión. La calculadora estimará automáticamente el coste basándose en el precio del filamento y el consumo eléctrico.',
        },
        {
          q: '¿Puedo guardar mis cálculos?',
          a: 'Sí, puedes guardar cada cálculo como un proyecto. Esto te permitirá llevar un registro histórico de todos tus trabajos.',
        },
      ],
    },
    {
      category: 'Bitácora de impresión',
      icon: BarChart3,
      questions: [
        {
          q: '¿Qué es la bitácora de impresión?',
          a: 'Es un registro detallado de todas tus impresiones, donde puedes añadir fotos, notas, tiempo de impresión y consumo de material.',
        },
        {
          q: '¿Cómo añado una pieza a un proyecto?',
          a: 'Ve a "Bitácora", selecciona o crea un proyecto, y haz clic en "Nueva pieza". Podrás añadir todos los detalles de la impresión.',
        },
      ],
    },
    {
      category: 'Inventario',
      icon: Package,
      questions: [
        {
          q: '¿Cómo gestiono mi inventario de filamentos?',
          a: 'En la sección "Inventario" puedes añadir bobinas, especificar marca, material, color y peso restante. El sistema te avisará cuando se agote.',
        },
        {
          q: '¿Puedo escanear códigos de barras?',
          a: 'Sí, FilamentOS incluye un lector de códigos QR/barras para añadir bobinas rápidamente.',
        },
      ],
    },
    {
      category: 'Cuenta y configuración',
      icon: Settings,
      questions: [
        {
          q: '¿Cómo cambio mi foto de perfil?',
          a: 'Ve a Ajustes > Mi perfil y haz clic en tu avatar. Puedes subir una imagen de hasta 10 MB.',
        },
        {
          q: '¿Puedo cambiar el idioma?',
          a: 'Sí, FilamentOS está disponible en español, inglés, portugués, francés, alemán e italiano. Cambia el idioma desde el selector en la parte superior.',
        },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-2xl border border-border/70 bg-card/60 p-5 sm:p-8 shadow-[0_12px_36px_rgba(2,8,23,0.10)] backdrop-blur-md dark:border-white/10 dark:shadow-[0_18px_60px_rgba(0,0,0,0.22)]"
      >
        <div className="flex items-start gap-3 sm:items-center sm:gap-4 mb-4">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <MessageCircleQuestion className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground">Centro de ayuda</h1>
            <p className="text-sm text-muted-foreground">Todo lo que necesitas saber sobre FilamentOS</p>
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10 p-4 mt-6">
          <div className="flex items-start gap-3">
            <HelpCircle className="h-5 w-5 text-purple-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground mb-1">¿No encuentras lo que buscas?</p>
              <p className="text-xs text-muted-foreground mb-3">
                Escríbenos a <a href="mailto:luprintech@gmail.com" className="text-primary hover:underline">luprintech@gmail.com</a> y te ayudaremos.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* FAQs */}
      <div className="space-y-6">
        {faqs.map((section, idx) => (
          <motion.div
            key={section.category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            className="rounded-2xl border border-border/70 bg-card/60 p-6 shadow-[0_12px_36px_rgba(2,8,23,0.10)] backdrop-blur-md dark:border-white/10 dark:shadow-[0_18px_60px_rgba(0,0,0,0.22)]"
          >
            <div className="flex items-center gap-3 mb-4">
              <section.icon className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">{section.category}</h2>
            </div>

            <div className="space-y-4">
              {section.questions.map((item, qIdx) => (
                <div key={qIdx} className="space-y-2">
                  <h3 className="text-sm font-bold text-foreground">{item.q}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                  {qIdx < section.questions.length - 1 && (
                    <div className="h-px bg-border/50 mt-4" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Additional resources */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="rounded-2xl border border-border/70 bg-card/60 p-6 shadow-[0_12px_36px_rgba(2,8,23,0.10)] backdrop-blur-md dark:border-white/10 dark:shadow-[0_18px_60px_rgba(0,0,0,0.22)]"
      >
        <div className="flex items-center gap-3 mb-4">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Recursos adicionales</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <a
            href="https://www.youtube.com/@Luprintech"
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-xl border border-border/50 bg-muted/20 p-4 transition-all hover:border-primary hover:bg-primary/5"
          >
            <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors mb-1">
              📺 Tutoriales en YouTube
            </h3>
            <p className="text-xs text-muted-foreground">
              Aprende con videos paso a paso
            </p>
          </a>

          <a
            href="https://www.instagram.com/luprintech/"
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-xl border border-border/50 bg-muted/20 p-4 transition-all hover:border-primary hover:bg-primary/5"
          >
            <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors mb-1">
              📷 Comunidad en Instagram
            </h3>
            <p className="text-xs text-muted-foreground">
              Tips, trucos y novedades
            </p>
          </a>
        </div>
      </motion.div>
    </div>
  );
}
