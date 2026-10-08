"use client";
import { useState } from "react";
import { educationSchema } from "@/lib/education";
import type { StrategyFormState } from "@/lib/strategy-form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
export function EducationEditor({
  form,
  update,
}: {
  form: StrategyFormState;
  update: (patch: Partial<StrategyFormState>) => void;
}) {
  const [draft, setDraft] = useState(JSON.stringify(form.education, null, 2));
  const [error, setError] = useState("");
  const apply = () => {
    try {
      const value = JSON.parse(draft);
      const parsed = value === null ? null : educationSchema.parse(value);
      update({ education: parsed });
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid beginner content");
    }
  };
  return (
    <section className="space-y-5 rounded-lg border bg-white p-6">
      <h2 className="text-xl font-semibold">Beginner page content</h2>
      <p className="text-sm text-gray-600">
        Shared structured content used by the website and Matrix API. Edit the
        example, trade-off, implementation requirements and monitoring rules
        here, then apply and save. Public canonical pages require valid content.
      </p>
      <p className="text-sm">
        Record type: <strong>{form.recordType}</strong> · Destination:{" "}
        {form.canonicalSlug ?? "canonical"} · Aliases:{" "}
        {form.legacyAliases.join(", ") || "none"}
      </p>
      <label htmlFor="education-json" className="block font-medium">
        Structured beginner content (JSON)
      </label>
      <Textarea
        id="education-json"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="min-h-[520px] font-mono text-sm"
        spellCheck={false}
      />
      {error && (
        <p role="alert" className="whitespace-pre-wrap text-red-700">
          {error}
        </p>
      )}
      <Button type="button" onClick={apply}>
        Apply validated content
      </Button>
      <p className="text-sm text-gray-500">
        Unapplied changes in this panel are not saved. Identity mappings are
        managed by the consolidation migration to prevent duplicate publication.
      </p>
    </section>
  );
}
