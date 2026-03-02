import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

interface Props {
  trigger: React.ReactNode;
}

export function PrivacyPolicyModal({ trigger }: Props) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Política de Privacidad y Cookies</DialogTitle>
          <p className="text-xs text-muted-foreground">Última actualización: marzo de 2025</p>
        </DialogHeader>

        <div className="space-y-5 text-sm leading-relaxed">

          {/* 1. Responsable */}
          <section className="space-y-1">
            <h3 className="font-semibold text-foreground">1. Responsable del tratamiento</h3>
            <p className="text-muted-foreground">
              <strong>Titular:</strong> Guadalupe Cano<br />
              <strong>Actividad:</strong> Luprintech<br />
              <strong>Contacto:</strong>{' '}
              <a href="mailto:luprintech@gmail.com" className="text-primary hover:underline">
                luprintech@gmail.com
              </a>
            </p>
          </section>

          <Separator />

          {/* 2. Datos recogidos */}
          <section className="space-y-1">
            <h3 className="font-semibold text-foreground">2. Datos personales que tratamos</h3>
            <p className="text-muted-foreground">
              Al iniciar sesión con tu cuenta de Google, recibimos y almacenamos los siguientes datos
              proporcionados por Google:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-0.5 ml-2">
              <li>Nombre y apellidos</li>
              <li>Dirección de correo electrónico</li>
              <li>Foto de perfil (URL pública)</li>
            </ul>
            <p className="text-muted-foreground mt-1">
              Además, almacenamos los <strong>proyectos de cálculo</strong> que guardes
              voluntariamente dentro de la aplicación.
            </p>
          </section>

          <Separator />

          {/* 3. Finalidad y legitimación */}
          <section className="space-y-1">
            <h3 className="font-semibold text-foreground">3. Finalidad y base legal</h3>
            <div className="text-muted-foreground space-y-1">
              <p>
                <strong>Finalidad:</strong> Autenticación de usuarios y almacenamiento de
                proyectos de cálculo de costes de impresión 3D.
              </p>
              <p>
                <strong>Base legal:</strong> Ejecución de un contrato o prestación de un
                servicio solicitado por el usuario (art. 6.1.b RGPD). No tratamos tus datos
                para publicidad ni los cedemos a terceros con fines comerciales.
              </p>
            </div>
          </section>

          <Separator />

          {/* 4. Conservación */}
          <section className="space-y-1">
            <h3 className="font-semibold text-foreground">4. Plazo de conservación</h3>
            <p className="text-muted-foreground">
              Tus datos se conservan mientras tu cuenta esté activa en el sistema. Puedes
              solicitar su eliminación en cualquier momento escribiendo a{' '}
              <a href="mailto:luprintech@gmail.com" className="text-primary hover:underline">
                luprintech@gmail.com
              </a>.
            </p>
          </section>

          <Separator />

          {/* 5. Destinatarios */}
          <section className="space-y-1">
            <h3 className="font-semibold text-foreground">5. Destinatarios</h3>
            <p className="text-muted-foreground">
              No cedemos tus datos a terceros. Google actúa únicamente como proveedor de
              identidad (IdP) bajo su propia{' '}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                política de privacidad
              </a>
              . Los datos se almacenan en una base de datos local gestionada por el titular.
            </p>
          </section>

          <Separator />

          {/* 6. Derechos */}
          <section className="space-y-1">
            <h3 className="font-semibold text-foreground">6. Tus derechos</h3>
            <p className="text-muted-foreground">
              De acuerdo con el RGPD y la LOPDGDD, tienes derecho a:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-0.5 ml-2">
              <li>Acceder a tus datos personales</li>
              <li>Rectificar datos inexactos</li>
              <li>Solicitar la supresión de tus datos</li>
              <li>Oponerte al tratamiento o solicitar su limitación</li>
              <li>Solicitar la portabilidad de tus datos</li>
            </ul>
            <p className="text-muted-foreground mt-1">
              Ejerce tus derechos enviando un correo a{' '}
              <a href="mailto:luprintech@gmail.com" className="text-primary hover:underline">
                luprintech@gmail.com
              </a>
              . Si consideras que el tratamiento no es conforme, puedes reclamar ante la{' '}
              <a
                href="https://www.aepd.es"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Agencia Española de Protección de Datos (AEPD)
              </a>
              .
            </p>
          </section>

          <Separator />

          {/* 7. Cookies */}
          <section className="space-y-2">
            <h3 className="font-semibold text-foreground">7. Política de Cookies</h3>
            <p className="text-muted-foreground">
              Esta aplicación utiliza <strong>únicamente cookies técnicas estrictamente
              necesarias</strong> para el funcionamiento del servicio. No se usan cookies de
              seguimiento, analítica ni publicidad.
            </p>

            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-2 font-medium">Nombre</th>
                    <th className="text-left p-2 font-medium">Tipo</th>
                    <th className="text-left p-2 font-medium">Duración</th>
                    <th className="text-left p-2 font-medium">Finalidad</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-t">
                    <td className="p-2 font-mono">connect.sid</td>
                    <td className="p-2">Técnica · 1ª parte</td>
                    <td className="p-2">7 días</td>
                    <td className="p-2">Mantener la sesión de usuario autenticada</td>
                  </tr>
                  <tr className="border-t">
                    <td className="p-2 font-mono">luprintech_cookie_consent</td>
                    <td className="p-2">Técnica · localStorage</td>
                    <td className="p-2">Permanente</td>
                    <td className="p-2">Recordar que has aceptado este aviso</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-muted-foreground text-xs">
              Las cookies técnicas son necesarias para el funcionamiento básico del servicio
              y están exentas de consentimiento según la Directiva ePrivacy y la LSSI.
              Puedes eliminarlas desde la configuración de tu navegador, aunque esto impedirá
              el uso de la aplicación.
            </p>
          </section>

        </div>
      </DialogContent>
    </Dialog>
  );
}
