import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Github, Youtube, Instagram, Mail, Loader2, Check, ArrowLeft, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { GoogleIcon, TikTokIcon } from '@/components/icons';
import { useAuth } from '@/context/auth-context';
import { PrivacyPolicyModal } from '@/components/privacy-policy-modal';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTheme } from 'next-themes';
import { forgotPassword, resetPassword, resendVerification } from '@/features/auth/api/auth-api';
import { cn } from '@/lib/utils';

// ── PasswordInput — componente independiente para evitar remount en cada render ──
interface PasswordInputProps {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

function PasswordInput({ id, label, placeholder, value, onChange, autoComplete, onKeyDown }: PasswordInputProps) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          required
          autoComplete={autoComplete}
          className="pr-10"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

// ── tipos de vista ────────────────────────────────────────────────────────────
type View =
  | 'main'           // pantalla principal: Google / Entrar / Registrarse
  | 'email-login'    // formulario de email + contraseña
  | 'register'       // formulario de registro
  | 'verify-pending' // "revisa tu correo" post-registro
  | 'forgot'         // formulario olvide mi contraseña
  | 'forgot-sent'    // "te enviamos un correo"
  | 'reset'          // formulario nueva contraseña (token en URL)
  | 'reset-done'     // contraseña cambiada
  | 'verified';      // cuenta verificada correctamente

export function LoginPage() {
  const { loginWithGoogle, loginWithEmail, register, authLoading } = useAuth();
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  // Leer params de la URL al cargar
  const [view, setView] = useState<View>('main');
  const [urlToken, setUrlToken] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [name, setName]         = useState('');
  const [error, setError]       = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isBusy = authLoading || submitting;
  const logoSrc = resolvedTheme === 'dark' ? '/filamentos_negro.png' : '/filamentos_blanco.png';

  // Detectar token en URL (verificación / reset)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const mode  = params.get('mode');
    const verified = params.get('verified');
    const err = params.get('error');

    if (verified === '1') {
      setView('verified');
      window.history.replaceState({}, '', '/login');
      return;
    }
    if (err) {
      const msg = err === 'token_expired'
        ? 'El enlace ha caducado. Solicita uno nuevo.'
        : 'El enlace no es válido.';
      setError(msg);
      setView('email-login');
      window.history.replaceState({}, '', '/login');
      return;
    }
    if (token && mode === 'reset') {
      setUrlToken(token);
      setView('reset');
      window.history.replaceState({}, '', '/login');
    }
    if (token && mode === 'verify') {
      // El backend hace la verificación via redirect, pero si se llega aquí directamente
      window.location.href = `/api/auth/verify-email?token=${token}`;
    }
  }, []);

  function reset() {
    setEmail(''); setPassword(''); setConfirmPwd(''); setName('');
    setError('');
  }

  function goTo(v: View) { reset(); setView(v); }

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await loginWithEmail(email, password);
      // Redirigir a calculadora después del login
      navigate('/calculadora', { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('login_error_invalid');
      if (msg.toLowerCase().includes('google')) setError(t('login_google_only'));
      else setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError(t('login_password_min')); return; }
    if (password !== confirmPwd) { setError('Las contraseñas no coinciden.'); return; }
    setSubmitting(true);
    try {
      await register({ email, password, name });
      // El backend ya no inicia sesión — devuelve { pending: true }
      setPendingEmail(email);
      setView('verify-pending');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('login_register_error');
      if (msg.toLowerCase().includes('ya existe') || msg.toLowerCase().includes('already exists')) {
        setError(t('login_error_exists'));
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await forgotPassword(email);
      setView('forgot-sent');
    } catch {
      // siempre éxito para no revelar si el email existe
      setView('forgot-sent');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return; }
    if (password !== confirmPwd) { setError('Las contraseñas no coinciden.'); return; }
    setSubmitting(true);
    try {
      await resetPassword(urlToken, password);
      setView('reset-done');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cambiar la contraseña.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    if (!pendingEmail) return;
    setSubmitting(true);
    try {
      await resendVerification(pendingEmail);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Shared UI ────────────────────────────────────────────────────────────────

  function BackBtn({ to }: { to: View }) {
    return (
      <button
        type="button"
        onClick={() => goTo(to)}
        className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Volver
      </button>
    );
  }

  function ErrorBox() {
    if (!error) return null;
    return (
      <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
        {error}
      </p>
    );
  }

  // ── Render por vista ─────────────────────────────────────────────────────────

  function renderContent() {
    // ── Cuenta verificada ──
    if (view === 'verified') return (
      <div className="space-y-5 text-center animate-fade-in">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30">
            <Check className="h-8 w-8 text-emerald-500" />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-foreground">¡Cuenta verificada!</h2>
          <p className="mt-1 text-sm text-muted-foreground">Ya puedes iniciar sesión con tu email y contraseña.</p>
        </div>
        <Button className="w-full rounded-2xl font-bold" size="lg" onClick={() => goTo('email-login')}>
          Iniciar sesión
        </Button>
      </div>
    );

    // ── Pendiente de verificación ──
    if (view === 'verify-pending') return (
      <div className="space-y-5 text-center animate-fade-in">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 border border-primary/30">
            <Mail className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-foreground">Verifica tu correo</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Hemos enviado un enlace de verificación a{' '}
            <strong className="text-foreground">{pendingEmail}</strong>.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Revisa también tu carpeta de spam.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full rounded-full font-bold"
          onClick={handleResend}
          disabled={isBusy}
        >
          {isBusy
            ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            : <RefreshCw className="mr-2 h-3.5 w-3.5" />}
          Reenviar correo
        </Button>
        <button type="button" onClick={() => goTo('main')} className="text-sm text-muted-foreground hover:text-foreground">
          Volver al inicio
        </button>
      </div>
    );

    // ── Contraseña cambiada ──
    if (view === 'reset-done') return (
      <div className="space-y-5 text-center animate-fade-in">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30">
            <Check className="h-8 w-8 text-emerald-500" />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-foreground">¡Contraseña actualizada!</h2>
          <p className="mt-1 text-sm text-muted-foreground">Ya puedes iniciar sesión con tu nueva contraseña.</p>
        </div>
        <Button className="w-full rounded-2xl font-bold" size="lg" onClick={() => goTo('email-login')}>
          Iniciar sesión
        </Button>
      </div>
    );

    // ── Reset de contraseña (token en URL) ──
    if (view === 'reset') return (
      <form onSubmit={handleReset} className="space-y-4 animate-fade-in">
        <div className="text-center mb-2">
          <h2 className="text-xl font-extrabold text-foreground">Nueva contraseña</h2>
          <p className="text-sm text-muted-foreground mt-1">Elige una contraseña segura para tu cuenta.</p>
        </div>
        <PasswordInput
          id="reset-pass"
          label="Nueva contraseña"
          placeholder="Mínimo 6 caracteres"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
        />
        <PasswordInput
          id="reset-confirm"
          label="Confirmar contraseña"
          placeholder="Repite la contraseña"
          value={confirmPwd}
          onChange={setConfirmPwd}
          autoComplete="new-password"
        />
        <ErrorBox />
        <Button type="submit" disabled={isBusy} className="w-full rounded-2xl font-bold" size="lg">
          {isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Cambiar contraseña
        </Button>
      </form>
    );

    // ── Olvidé mi contraseña — enviado ──
    if (view === 'forgot-sent') return (
      <div className="space-y-5 text-center animate-fade-in">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 border border-primary/30">
            <Mail className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-foreground">Revisa tu correo</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Si existe una cuenta con ese email, recibirás un enlace para restablecer tu contraseña.
          </p>
        </div>
        <button type="button" onClick={() => goTo('email-login')} className="text-sm text-primary hover:underline">
          Volver al inicio de sesión
        </button>
      </div>
    );

    // ── Olvidé mi contraseña — formulario ──
    if (view === 'forgot') return (
      <form onSubmit={handleForgot} className="space-y-4 animate-fade-in text-left">
        <BackBtn to="email-login" />
        <div className="mb-2">
          <h2 className="text-xl font-extrabold text-foreground">¿Olvidaste tu contraseña?</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Introduce tu email y te enviaremos un enlace para restablecerla.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="forgot-email">Email</Label>
          <Input
            id="forgot-email"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <ErrorBox />
        <Button type="submit" disabled={isBusy} className="w-full rounded-2xl font-bold" size="lg">
          {isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
          Enviar enlace
        </Button>
      </form>
    );

    // ── Inicio de sesión con email ──
    if (view === 'email-login') return (
      <form onSubmit={handleEmailLogin} className="space-y-4 animate-fade-in text-left">
        <BackBtn to="main" />
        <div className="space-y-2">
          <Label htmlFor="login-email">{t('login_email_label')}</Label>
          <Input
            id="login-email"
            type="email"
            placeholder={t('login_email_placeholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <PasswordInput
          id="login-password"
          label={t('login_password_label')}
          placeholder={t('login_password_placeholder')}
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />
        <ErrorBox />
        <Button type="submit" disabled={isBusy} className="w-full rounded-2xl font-bold shadow-md" size="lg">
          {isBusy
            ? <Loader2 className="mr-3 h-5 w-5 animate-spin" />
            : <Mail className="mr-3 h-5 w-5" />}
          {t('login_btn_email')}
        </Button>
        <div className="flex items-center justify-between text-sm">
          <button type="button" onClick={() => goTo('forgot')} className="text-muted-foreground hover:text-primary transition-colors">
            ¿Olvidaste tu contraseña?
          </button>
          <button type="button" onClick={() => goTo('register')} className="text-primary hover:underline">
            Crear cuenta
          </button>
        </div>
      </form>
    );

    // ── Registro ──
    if (view === 'register') return (
      <form onSubmit={handleRegister} className="space-y-4 animate-fade-in text-left">
        <BackBtn to="main" />
        <div className="space-y-2">
          <Label htmlFor="register-name">{t('login_name_label')}</Label>
          <Input
            id="register-name"
            type="text"
            placeholder={t('login_name_placeholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-email">{t('login_email_label')}</Label>
          <Input
            id="register-email"
            type="email"
            placeholder={t('login_email_placeholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <PasswordInput
          id="register-password"
          label={t('login_password_label')}
          placeholder="Mínimo 6 caracteres"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
        />
        <PasswordInput
          id="register-confirm"
          label="Confirmar contraseña"
          placeholder="Repite la contraseña"
          value={confirmPwd}
          onChange={setConfirmPwd}
          autoComplete="new-password"
        />
        <ErrorBox />
        <Button type="submit" disabled={isBusy} className="w-full rounded-2xl font-bold shadow-md" size="lg">
          {isBusy ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : null}
          {t('login_register_btn')}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{' '}
          <button type="button" onClick={() => goTo('email-login')} className="text-primary hover:underline">
            Iniciar sesión
          </button>
        </p>
      </form>
    );

    // ── Pantalla principal ──
    return (
      <div className="space-y-3 animate-fade-in">
        <Button
          onClick={loginWithGoogle}
          disabled={isBusy}
          className="w-full rounded-2xl shadow-md transition-all hover:shadow-lg font-bold"
          size="lg"
        >
          {isBusy
            ? <Loader2 className="mr-3 h-5 w-5 animate-spin" />
            : <GoogleIcon className="mr-3 h-5 w-5" />}
          {t('login_btn')}
        </Button>

        <div className="relative flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground font-medium">o</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="lg"
            className="rounded-2xl font-bold"
            onClick={() => goTo('email-login')}
            disabled={isBusy}
          >
            <Mail className="mr-2 h-4 w-4" />
            Entrar
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="rounded-2xl font-bold"
            onClick={() => goTo('register')}
            disabled={isBusy}
          >
            Registrarse
          </Button>
        </div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between bg-background p-4 sm:p-8">
      <div className="flex w-full flex-grow items-center justify-center">
        <div className="w-full max-w-md text-center">
          <img
            src={logoSrc}
            alt={t('logo_alt')}
            width={110}
            height={110}
            className="mx-auto mb-5 rounded-full shadow-lg border border-gray-200"
          />

          {/* Solo mostrar título en pantallas sin formulario profundo */}
          {(view === 'main' || view === 'verified' || view === 'verify-pending' || view === 'forgot-sent' || view === 'reset-done') && (
            <div className="mb-6">
              <h1 className="font-headline text-3xl font-bold tracking-tighter text-primary sm:text-5xl">
                {t('app_title')}
              </h1>
              <p className="font-headline text-xl text-muted-foreground">{t('login_by')}</p>
              {view === 'main' && (
                <p className="mx-auto mt-3 max-w-sm text-base text-muted-foreground">
                  {t('login_tagline')}
                </p>
              )}
            </div>
          )}

          {/* Card de auth */}
          <div className={cn(
            'rounded-[24px] border border-border/70 bg-card/80 p-6 shadow-xl backdrop-blur-sm',
            view === 'main' ? 'mt-2' : 'mt-4',
          )}>
            {renderContent()}
          </div>
        </div>
      </div>

      <footer className="w-full py-6 text-center text-sm text-muted-foreground">
        <div className="flex justify-center gap-6 mb-4">
          <a href="https://github.com/luprintech" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="hover:text-primary transition-colors">
            <Github className="h-5 w-5" />
          </a>
          <a href="https://www.youtube.com/@Luprintech" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="hover:text-primary transition-colors">
            <Youtube className="h-5 w-5" />
          </a>
          <a href="https://www.instagram.com/luprintech/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-primary transition-colors">
            <Instagram className="h-5 w-5" />
          </a>
          <a href="https://www.tiktok.com/@luprintech" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="hover:text-primary transition-colors">
            <TikTokIcon className="h-5 w-5" />
          </a>
        </div>
        <p className="mb-2">
          {t('login_contact')}{' '}
          <a href="mailto:luprintech@gmail.com" className="text-primary hover:underline">
            luprintech@gmail.com
          </a>
        </p>
        <p className="mb-2">{t('footer_copyright', { year: currentYear })}</p>
        <p>
          <PrivacyPolicyModal
            trigger={
              <button className="text-primary hover:underline underline-offset-2 transition-colors">
                {t('footer_privacy')}
              </button>
            }
          />
        </p>
      </footer>
    </main>
  );
}
