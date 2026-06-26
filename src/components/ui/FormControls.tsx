import type React from "react";

type FieldProps = {
  label: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
};

export function FormField({ label, error, children, required }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-700">
        {label}
        {required ? <span className="ml-1 text-red-600">*</span> : null}
      </span>
      {children}
      {error ? (
        <span className="mt-2 block text-sm font-bold text-red-600">
          {error}
        </span>
      ) : null}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 ${
        props.className ?? ""
      }`}
    />
  );
}

export function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 ${
        props.className ?? ""
      }`}
    />
  );
}

export function TextAreaInput(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`min-h-28 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 ${
        props.className ?? ""
      }`}
    />
  );
}

export function UploadBox({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50 p-6 text-center">
      <p className="font-black text-blue-950">{title}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
        {description}
      </p>
      <button
        type="button"
        className="mt-4 rounded-xl bg-white px-5 py-3 text-sm font-black text-blue-950 shadow-sm"
      >
        Selecionar arquivo
      </button>
    </div>
  );
}
