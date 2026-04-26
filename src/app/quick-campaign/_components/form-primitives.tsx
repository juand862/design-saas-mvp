'use client';

import { ReactNode, TextareaHTMLAttributes, InputHTMLAttributes } from 'react';

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-3">
      <label className="block text-[10px] uppercase tracking-[0.25em] text-white/40">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-white/30">{hint}</p> : null}
    </div>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full border-b border-white/[0.12] bg-transparent py-3 text-lg text-white placeholder:text-white/20 outline-none transition-colors focus:border-white ${
        props.className ?? ''
      }`}
    />
  );
}

export function TextAreaInput(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full resize-none border-b border-white/[0.12] bg-transparent py-3 text-lg leading-relaxed text-white placeholder:text-white/20 outline-none transition-colors focus:border-white ${
        props.className ?? ''
      }`}
    />
  );
}

export function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border px-4 py-2 text-xs uppercase tracking-[0.2em] transition-colors ${
        active
          ? 'border-white bg-white text-black'
          : 'border-white/[0.12] text-white/60 hover:border-white/30 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  multi = false,
  renderLabel,
}: {
  options: readonly T[] | readonly { id: T; label: string }[];
  value: T | T[];
  onChange: (next: T | T[]) => void;
  multi?: boolean;
  renderLabel?: (id: T) => string;
}) {
  const normalized = (options as readonly (T | { id: T; label: string })[]).map((opt) =>
    typeof opt === 'string' ? { id: opt as T, label: renderLabel?.(opt as T) ?? (opt as T) } : opt,
  );

  return (
    <div className="flex flex-wrap gap-2">
      {normalized.map((opt) => {
        const isActive = multi
          ? Array.isArray(value) && value.includes(opt.id)
          : value === opt.id;
        return (
          <Chip
            key={opt.id}
            active={isActive}
            onClick={() => {
              if (multi) {
                const list = Array.isArray(value) ? value : [];
                onChange(
                  isActive ? list.filter((v) => v !== opt.id) : [...list, opt.id],
                );
              } else {
                onChange(opt.id);
              }
            }}
          >
            {opt.label}
          </Chip>
        );
      })}
    </div>
  );
}

export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-4">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 w-12 cursor-pointer border border-white/[0.12] bg-transparent"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 border-b border-white/[0.12] bg-transparent py-3 font-[family-name:var(--font-display)] text-lg italic text-white outline-none transition-colors focus:border-white"
        />
      </div>
    </Field>
  );
}