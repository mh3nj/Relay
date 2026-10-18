import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { validateDictionary } from "@/lib/customDictionary";
import type { CustomDictionary } from "@/lib/customDictionary";

interface CustomDictionaryEditorProps {
  dictionary: CustomDictionary;
  onSave: (entries: Record<string, string>) => void;
  onClose: () => void;
}

export function CustomDictionaryEditor({
  dictionary,
  onSave,
  onClose,
}: CustomDictionaryEditorProps) {
  const { t } = useTranslation();
  const [rows, setRows] = useState<{ char: string; code: string }[]>(() =>
    Object.entries(dictionary.entries).map(([char, code]) => ({ char, code }))
  );

  useEffect(() => {
    setRows(Object.entries(dictionary.entries).map(([char, code]) => ({ char, code })));
  }, [dictionary.id, dictionary.entries]);

  const entriesObject = () =>
    Object.fromEntries(
      rows.filter((r) => r.char.trim()).map((r) => [r.char.trim().toUpperCase(), r.code.trim()])
    );

  const issues = validateDictionary(entriesObject());
  const issueFor = (char: string) => issues.find((i) => i.char === char.trim().toUpperCase());

  const updateRow = (index: number, field: "char" | "code", value: string) => {
    setRows((prev) =>
      prev.map((r, i) =>
        i === index
          ? {
              ...r,
              [field]: field === "code" ? value.replace(/[^.-]/g, "") : value.slice(0, 1),
            }
          : r
      )
    );
  };

  const removeRow = (index: number) => setRows((prev) => prev.filter((_, i) => i !== index));
  const addRow = () => setRows((prev) => [...prev, { char: "", code: "" }]);

  const handleSave = () => {
    onSave(entriesObject());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-md">
      <div className="bg-surface-container-high border border-outline-variant/40 rounded-xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-lg border-b border-outline-variant/30">
          <h3 className="font-heading-md text-heading-md text-on-surface">
            {t("translator.dictionary.editorTitle")}: {dictionary.name}
          </h3>
          <button
            onClick={onClose}
            aria-label={t("common.close") ?? ""}
            className="text-on-surface-variant hover:text-on-surface"
          >
            <Icon name="close" className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-lg">
          {rows.length === 0 && (
            <p className="text-sm text-on-surface-variant mb-md">
              {t("translator.dictionary.noEntries")}
            </p>
          )}

          <div className="flex flex-col gap-sm">
            {rows.map((row, i) => {
              const issue = issueFor(row.char);
              return (
                <div key={i} className="flex flex-col gap-1">
                  <div className="flex items-center gap-sm">
                    <input
                      value={row.char}
                      onChange={(e) => updateRow(i, "char", e.target.value)}
                      placeholder={t("translator.dictionary.character") ?? ""}
                      maxLength={1}
                      className="w-16 py-2 px-sm rounded-lg bg-surface border border-outline-variant/40 text-center text-on-surface uppercase focus:outline-none focus:border-primary"
                    />
                    <input
                      value={row.code}
                      onChange={(e) => updateRow(i, "code", e.target.value)}
                      placeholder={t("translator.dictionary.code") ?? ""}
                      className={cn(
                        "flex-1 py-2 px-sm rounded-lg bg-surface border font-morse-code text-primary focus:outline-none",
                        issue ? "border-error" : "border-outline-variant/40 focus:border-primary"
                      )}
                    />
                    <button
                      onClick={() => removeRow(i)}
                      aria-label={t("translator.dictionary.removeEntry") ?? ""}
                      className="text-on-surface-variant hover:text-error p-2"
                    >
                      <Icon name="trash" className="w-4 h-4" />
                    </button>
                  </div>
                  {issue && (
                    <p className="text-error text-[0.6875rem] pl-sm">
                      {issue.conflictsWith
                        ? t("translator.dictionary.conflictWarning", {
                            code: issue.code,
                            other: issue.conflictsWith,
                          })
                        : t("translator.dictionary.invalidCode")}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="mt-md"
            icon={<Icon name="add" className="w-4 h-4" />}
            onClick={addRow}
          >
            {t("translator.dictionary.addEntry")}
          </Button>
        </div>

        <div className="flex justify-end gap-sm p-lg border-t border-outline-variant/30">
          <Button variant="secondary" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave}>{t("common.save")}</Button>
        </div>
      </div>
    </div>
  );
}
