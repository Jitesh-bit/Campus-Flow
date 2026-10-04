import { useEffect, useId, useState, type FormEvent } from "react";
import type { ZodTypeAny } from "zod";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export type Field = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "select" | "date" | "datetime" | "time" | "number" | "switch";
  options?: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  half?: boolean;
  rows?: number;
};

type Values = Record<string, unknown>;

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  fields,
  initial,
  schema,
  onSubmit,
  submitLabel = "Save",
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description?: string;
  fields: Field[];
  initial: Values;
  schema: ZodTypeAny;
  onSubmit: (data: Values) => Promise<unknown>;
  submitLabel?: string;
}) {
  const [values, setValues] = useState<Values>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const uid = useId();

  useEffect(() => {
    if (open) {
      setValues(initial);
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const i of parsed.error.issues) errs[String(i.path[0])] ??= i.message;
      setErrors(errs);
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      await onSubmit(parsed.data);
      onOpenChange(false);
    } catch {
      /* toast handled by mutation */
    } finally {
      setBusy(false);
    }
  }

  const set = (k: string, v: unknown) => setValues((s) => ({ ...s, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <form onSubmit={submit} noValidate className="grid grid-cols-2 gap-4">
          {fields.map((f) => {
            const id = `${uid}-${f.name}`;
            const err = errors[f.name];
            const describedBy = err ? `${id}-err` : undefined;
            const v = values[f.name];
            const common = {
              id,
              "aria-invalid": !!err,
              "aria-describedby": describedBy,
              className: "h-11",
            };
            return (
              <div key={f.name} className={f.half ? "col-span-2 sm:col-span-1" : "col-span-2"}>
                {f.type === "switch" ? (
                  <div className="flex min-h-11 items-center justify-between gap-3 rounded-lg border px-3">
                    <Label htmlFor={id}>{f.label}</Label>
                    <Switch id={id} checked={!!v} onCheckedChange={(c) => set(f.name, c)} />
                  </div>
                ) : (
                  <>
                    <Label htmlFor={id} className="mb-1.5 block">
                      {f.label}
                      {f.required && <span aria-hidden className="text-error"> *</span>}
                    </Label>
                    {f.type === "textarea" ? (
                      <Textarea
                        {...common}
                        className="min-h-28"
                        rows={f.rows ?? 4}
                        placeholder={f.placeholder}
                        value={(v as string) ?? ""}
                        onChange={(e) => set(f.name, e.target.value)}
                      />
                    ) : f.type === "select" ? (
                      <select
                        {...common}
                        className="h-11 w-full rounded-md border border-input bg-card px-3 text-sm"
                        value={(v as string) ?? ""}
                        onChange={(e) => set(f.name, e.target.value)}
                      >
                        {f.options?.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        {...common}
                        type={
                          f.type === "datetime" ? "datetime-local" : f.type === "number" ? "number" : f.type ?? "text"
                        }
                        step={f.type === "number" ? "any" : undefined}
                        placeholder={f.placeholder}
                        value={(v as string | number | undefined) ?? ""}
                        onChange={(e) => set(f.name, e.target.value)}
                      />
                    )}
                  </>
                )}
                {err && (
                  <p id={`${id}-err`} role="alert" className="mt-1 text-xs font-medium text-error">
                    {err}
                  </p>
                )}
              </div>
            );
          })}
          <DialogFooter className="col-span-2 gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy && <Loader2 className="animate-spin" />} {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Small helper hook for create/edit dialog state. */
export function useEditor<T>() {
  const [state, setState] = useState<{ open: boolean; item: T | null }>({ open: false, item: null });
  return {
    open: state.open,
    item: state.item,
    create: () => setState({ open: true, item: null }),
    edit: (item: T) => setState({ open: true, item }),
    setOpen: (open: boolean) => setState((s) => ({ ...s, open })),
  };
}
