import type { ButtonHTMLAttributes, CSSProperties, HTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "accent" | "secondary" | "ghost" | "danger";
  block?: boolean;
  loading?: boolean;
};

export function Button({ variant = "primary", block, loading, className = "", children, disabled, ...props }: ButtonProps) {
  const classes = ["ds-button", variant !== "primary" && `ds-button--${variant}`, block && "ds-button--block", className].filter(Boolean).join(" ");
  return <button className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>{loading ? "Procesando…" : children}</button>;
}

export function Card({ interactive, className = "", ...props }: HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return <div className={["ds-card", interactive && "ds-card--interactive", className].filter(Boolean).join(" ")} {...props} />;
}

export function Chip({ children, color }: { children: ReactNode; color?: string }) {
  return <span className="ds-chip" style={color ? { "--chip-color": color } as CSSProperties : undefined}>{children}</span>;
}

type FieldProps = { label: string; hint?: string; error?: string; children: ReactNode; id: string };
export function Field({ label, hint, error, children, id }: FieldProps) {
  return <div className="ds-field"><label className="ds-label" htmlFor={id}>{label}</label>{children}{hint && <span className="ds-help">{hint}</span>}{error && <span className="ds-error" role="alert">{error}</span>}</div>;
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) { return <input className={`ds-input ${props.className ?? ""}`} {...props} />; }
export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea className={`ds-input ${props.className ?? ""}`} {...props} />; }

export function ProgressBar({ value, max = 100, label }: { value: number; max?: number; label: string }) {
  const percentage = Math.min(100, Math.max(0, value / max * 100));
  return <div className="ds-progress" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}><i className="ds-progress__fill" style={{ width: `${percentage}%` }} /></div>;
}

export function StatusNotice({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "success" | "error" }) {
  return <div className={`ds-status ds-status--${tone}`} role={tone === "error" ? "alert" : "status"}>{children}</div>;
}

export function EmptyState({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return <Card className="ds-empty"><div className="stack"><h2>{title}</h2><p className="muted">{children}</p>{action}</div></Card>;
}
