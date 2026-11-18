"use client";

import { tf, useAdminT } from "@/hooks/useAdminT";
import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { parseLessonRangeText } from "@/lib/lessonRange";

interface UploadResult {
  inserted: number;
  skipped: number;
  errors: string[];
}

export function CsvUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [lessonRangeText, setLessonRangeText] = useState("1");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const t = useAdminT("csv");
  const tfm = useAdminT("form");

  useEffect(() => {
    apiFetch<{ nextLessonNumber: number }>("/lessons/next-number", { admin: true })
      .then((res) => setLessonRangeText(String(res.nextLessonNumber)))
      .catch(() => {});
  }, []);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setResult(null);
    setError(null);
    if (!f) {
      setPreviewRows([]);
      return;
    }
    const text = await f.text();
    const rows = text
      .split(/\r?\n/)
      .filter(Boolean)
      .slice(0, 6)
      .map((line) => line.split(","));
    setPreviewRows(rows);
  }

  async function handleUpload() {
    if (!file) return;
    const lessonRange = parseLessonRangeText(lessonRangeText);
    if (!lessonRange) {
      setError(tfm.lessonInvalid);
      return;
    }
    setUploading(true);
    setError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("lessonNumber", String(lessonRange.lessonNumber));
      formData.append("lessonNumberEnd", String(lessonRange.lessonNumberEnd));
      const res = await apiFetch<UploadResult>("/words/bulk-upload", {
        method: "POST",
        body: formData,
        admin: true,
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.uploadError);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card className="p-6">
        <p className="text-sm text-foreground/60 mb-4">
          {t.columns}{" "}
          <code className="text-xs bg-surface-muted px-1.5 py-0.5 rounded">
            {`english, korean, uzbek (${t.optional}), exampleSentenceEn, exampleSentenceKo, exampleSentenceUz (${t.optional}), category, difficulty, lessonNumber (${t.optional}), lessonNumberEnd (${t.optional})`}
          </code>
        </p>

        <label className="block mb-4 max-w-xs">
          <span className="block text-sm font-medium mb-1.5">
            {t.lessonLabel}
          </span>
          <input
            value={lessonRangeText}
            onChange={(e) => setLessonRangeText(e.target.value)}
            placeholder={tfm.lessonPlaceholder}
            className="w-full rounded-xl border border-border bg-surface-muted px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-primary"
          />
        </label>

        <input
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          className="block w-full text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:px-4 file:py-2 file:font-semibold"
        />
      </Card>

      {previewRows.length > 0 && (
        <Card className="p-4 overflow-x-auto">
          <p className="text-xs font-semibold text-foreground/50 mb-2 uppercase tracking-wide">
            {t.preview}
          </p>
          <table className="w-full text-xs">
            <tbody>
              {previewRows.map((row, i) => (
                <tr key={i} className={i === 0 ? "font-bold border-b border-border" : ""}>
                  {row.map((cell, j) => (
                    <td key={j} className="px-2 py-1.5 whitespace-nowrap">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Button onClick={handleUpload} disabled={!file || uploading}>
        {uploading ? t.uploading : t.upload}
      </Button>

      {error && <p className="text-danger text-sm">{error}</p>}

      {result && (
        <Card className="p-5">
          <p className="font-semibold text-success">{tf(t.wordsAdded, { n: result.inserted })}</p>
          <p className="text-sm text-foreground/60 mt-1">{tf(t.skipped, { n: result.skipped })}</p>
          {result.errors.length > 0 && (
            <ul className="mt-3 space-y-1 text-xs text-danger max-h-40 overflow-y-auto">
              {result.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
