import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Github, Coffee, Sparkles, Target, Lightbulb, Users, MessageSquarePlus, Package, Zap, CheckCircle2, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export function AcercaPage() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const whyCards = [
    {
      icon: Sparkles,
      title: 'Adiós al caos',
      text: 'Nada de proyectos repartidos entre Excel, notas y herramientas sueltas.'
    },
    {
      icon: Package,
      title: 'Todo en un lugar',
      text: 'Calcula, registra, organiza y mejora tus impresiones desde una sola app.'
    },
    {
      icon: Target,
      title: 'Hecho desde la experiencia',
      text: 'Cada sección nace de una necesidad real del día a día de quien imprime en 3D.'
    },
    {
      icon: Zap,
      title: 'En evolución',
      text: 'Abierto a sugerencias, mejoras y colaboraciones.'
    }
  ];

  const timeline = [
    { icon: Lightbulb, title: 'La necesidad', text: 'Proyectos desorganizados, herramientas dispersas' },
    { icon: Heart, title: 'La idea', text: 'Un solo lugar para calcular, registrar y optimizar' },
    { icon: Sparkles, title: 'La construcción', text: 'Muchas horas de código, prueba y mejora continua' },
    { icon: Users, title: 'La comunidad', text: 'Personas creadoras compartiendo, sugiriendo y mejorando juntas' }
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-6xl mx-auto space-y-12 pb-12"
    >
      <motion.div variants={itemVariants} className="pt-4">
        <Button variant="outline" className="rounded-full font-semibold" onClick={() => navigate('/calculadora')}>
          Volver a FilamentOS
        </Button>
      </motion.div>

      {/* 1. HERO SUPERIOR */}
      <motion.section variants={itemVariants} className="text-center space-y-8 py-12">
        <div className="relative inline-block">
          <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-orange-500/20 rounded-full blur-2xl animate-pulse" />
          <div className="relative h-40 w-40 mx-auto rounded-full bg-primary/10 border-4 border-primary/30 shadow-2xl overflow-hidden group cursor-pointer transition-all duration-500 hover:border-primary/60 hover:shadow-[0_0_40px_rgba(168,85,247,0.4)]">
            <img
              src="/lupe.png"
              alt="Lupe - Luprintech"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
        </div>
        
        <div className="space-y-4 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight">
            Sobre FilamentOS
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground font-medium">
            Una herramienta creada por una creadora, para personas creadoras.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
            <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
            <span className="text-sm font-semibold text-foreground">Desarrollado y mantenido por Guadalupe Cano</span>
          </div>
        </div>
      </motion.section>

      {/* 2. SECCIÓN HISTORIA */}
      <motion.section variants={itemVariants} className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-black text-foreground">La historia detrás del proyecto</h2>
          <p className="text-muted-foreground">Experiencia real, problemas reales, una solución hecha con intención</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.95fr] items-start">
          <div className="rounded-2xl border border-border/70 bg-card/60 p-8 md:p-10 shadow-[0_12px_36px_rgba(2,8,23,0.10)] backdrop-blur-md dark:border-white/10 dark:shadow-[0_18px_60px_rgba(0,0,0,0.22)] space-y-6">
            <p className="text-lg md:text-xl text-foreground font-semibold leading-relaxed">
              FilamentOS nació de una necesidad muy real: <span className="text-primary">la mía</span>.
            </p>

            <p className="text-base text-muted-foreground leading-8">
              Soy desarrolladora web y maker, y llegó un punto en el que estaba cansada de tener mis proyectos de impresión 3D repartidos entre notas, hojas de Excel y mil herramientas que no terminaban de encajar.
            </p>

            <p className="text-base text-muted-foreground leading-8">
              Quería algo <span className="text-foreground font-semibold">simple, organizado y pensado de verdad</span> para el flujo de trabajo de alguien que imprime, prueba, falla y vuelve a intentar.
            </p>

            <p className="text-base text-muted-foreground leading-8">
              FilamentOS es una herramienta creada desde la experiencia real, no desde la teoría. Cada sección, cada detalle y cada mejora nace de algo que yo misma necesitaba en mi día a día.
            </p>

            <p className="text-base text-muted-foreground leading-8">
              Este proyecto está diseñado, desarrollado y mantenido íntegramente por mí. No hay un gran equipo detrás, solo muchas horas de trabajo, aprendizaje y cariño por hacer algo útil de verdad.
            </p>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 p-6 md:p-8 shadow-lg backdrop-blur-md">
              <p className="text-lg font-semibold text-foreground leading-relaxed">
                “Quería un solo sitio para <span className="text-primary">calcular, registrar, organizar y mejorar</span> mis impresiones sin complicaciones.”
              </p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card/60 p-6 md:p-8 shadow-lg backdrop-blur-md dark:border-white/10 space-y-4">
              <h3 className="text-lg font-bold text-foreground">Lo que busco con FilamentOS</h3>
              <p className="text-sm text-muted-foreground leading-7">
                Mi objetivo es que cualquier persona que imprima en 3D pueda tener en un solo sitio todo lo que necesita para trabajar mejor, con más claridad y menos fricción.
              </p>
              <p className="text-sm text-muted-foreground leading-7">
                Si usas FilamentOS y sientes que algo puede hacerse mejor, me encantará escucharte. Este proyecto no está cerrado: <span className="text-foreground font-semibold">está vivo y en evolución</span>.
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* 3. CARDS "POR QUÉ NACIÓ" */}
      <motion.section variants={itemVariants} className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-black text-foreground">Por qué nació</h2>
          <p className="text-muted-foreground">Cuatro razones que hacen la diferencia</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {whyCards.map((card, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              whileHover={{ scale: 1.05, y: -5 }}
              className="rounded-2xl border border-border/70 bg-card/60 p-6 shadow-lg backdrop-blur-md dark:border-white/10 hover:shadow-2xl hover:border-primary/30 transition-all duration-300 cursor-pointer group"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <card.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-bold text-foreground text-base">{card.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{card.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* 4. TIMELINE VISUAL */}
      <motion.section variants={itemVariants} className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-black text-foreground">El viaje de FilamentOS</h2>
          <p className="text-muted-foreground">De la idea a la realidad</p>
        </div>

        <div className="relative">
          {/* Línea horizontal en desktop */}
          <div className="hidden md:block absolute top-16 left-0 right-0 h-1 bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-orange-500/30" />
          
          {/* Línea vertical en móvil */}
          <div className="md:hidden absolute left-7 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500/30 via-pink-500/30 to-orange-500/30" />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-4 relative">
            {timeline.map((step, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="relative flex md:flex-col items-start md:items-center gap-4 md:gap-0"
              >
                {/* Icono */}
                <div className="relative z-10 h-14 w-14 rounded-full bg-gradient-to-br from-primary to-purple-500 shadow-lg flex items-center justify-center flex-shrink-0">
                  <step.icon className="h-7 w-7 text-white" />
                </div>

                {/* Contenido */}
                <div className="md:mt-8 rounded-xl border border-border/70 bg-card/80 backdrop-blur-md p-4 md:p-6 shadow-lg dark:border-white/10 text-left md:text-center hover:shadow-xl transition-shadow duration-300">
                  <h4 className="font-bold text-foreground mb-2">{step.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* 5. SECCIÓN COLABORACIÓN */}
      <motion.section variants={itemVariants} className="max-w-4xl mx-auto">
        <div className="rounded-2xl border border-border/70 bg-card/60 p-8 md:p-12 shadow-[0_12px_36px_rgba(2,8,23,0.10)] backdrop-blur-md dark:border-white/10 dark:shadow-[0_18px_60px_rgba(0,0,0,0.22)] text-center space-y-6">
          <div className="space-y-3">
            <h2 className="text-2xl md:text-3xl font-black text-foreground">Construyamos juntos</h2>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              FilamentOS está <span className="text-foreground font-semibold">totalmente abierto</span> a sugerencias, mejoras y nuevas ideas. Si crees que algo puede hacerse mejor, me encantará escucharte.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              variant="outline"
              size="lg"
              className="rounded-full font-bold group hover:border-primary/50"
              onClick={() => window.open('https://guadalupecano.es', '_blank', 'noopener,noreferrer')}
            >
              <Globe className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
              guadalupecano.es
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full font-bold group hover:border-primary/50"
              onClick={() => window.open('https://github.com/Luprintech/filamentOS', '_blank', 'noopener,noreferrer')}
            >
              <Github className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform" />
              Colaborar en Github
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full font-bold group hover:border-primary/50"
              onClick={() => window.dispatchEvent(new Event('open-chatbot-contact'))}
            >
              <MessageSquarePlus className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
              Enviar sugerencia
            </Button>
          </div>
        </div>
      </motion.section>

      {/* 6. SECCIÓN APOYO */}
      <motion.section variants={itemVariants} className="max-w-3xl mx-auto">
        <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-orange-500/5 p-8 md:p-12 shadow-[0_12px_36px_rgba(168,85,247,0.15)] backdrop-blur-md dark:border-purple-500/20 dark:shadow-[0_18px_60px_rgba(168,85,247,0.2)] text-center space-y-6 relative overflow-hidden">
          {/* Glow decorativo */}
          <div className="absolute -top-24 -right-24 h-48 w-48 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-48 w-48 bg-pink-500/20 rounded-full blur-3xl" />

          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
              <Coffee className="h-8 w-8 text-white" />
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl md:text-3xl font-black text-foreground">¿Te gusta FilamentOS?</h2>
              <p className="text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
                Tu apoyo me ayuda a mantener el proyecto, cubrir el alojamiento web y seguir mejorando la plataforma.
              </p>
            </div>

            <Button
              size="lg"
              className="rounded-full font-bold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              onClick={() => window.open('https://www.buymeacoffee.com/luprintech', '_blank', 'noopener,noreferrer')}
            >
              <Coffee className="h-5 w-5 mr-2" />
              Invítame a un café
            </Button>

            <div className="pt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Cada café cuenta y se agradece enormemente</span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* FOOTER CON CORAZÓN */}
      <motion.section variants={itemVariants} className="text-center py-8">
        <p className="text-muted-foreground flex items-center justify-center gap-2">
          Hecho con <Heart className="h-5 w-5 fill-red-500 text-red-500 animate-pulse" /> para quienes crean e imprimen en 3D
        </p>
      </motion.section>
    </motion.div>
  );
}
