"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface UploadResult {
  inserted: number;
  skipped: number;
  errors: string[];
}

export function CsvUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [lessonNumber, setLessonNumber] = useState<number>(1);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ nextLessonNumber: number }>("/lessons/next-number", { admin: true })
      .then((res) => setLessonNumber(res.nextLessonNumber))
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
    setUploading(true);
    setError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("lessonNumber", String(lessonNumber));
      const res = await apiFetch<UploadResult>("/words/bulk-upload", {
        method: "POST",
        body: formData,
        admin: true,
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Yuklashda xatolik yuz berdi");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card className="p-6">
        <p className="text-sm text-foreground/60 mb-4">
          CSV ustunlari:{" "}
          <code className="text-xs bg-surface-muted px-1.5 py-0.5 rounded">
            english, korean, exampleSentenceEn, exampleSentenceKo, category, difficulty, lessonNumber (ixtiyoriy)
          </code>
        </p>

        <label className="block mb-4 max-w-xs">
          <span className="block text-sm font-medium mb-1.5">Dars raqami (CSV&apos;da lessonNumber bo&apos;lmasa shu ishlatiladi)</span>
          <input
            type="number"
            min={1}
            value={lessonNumber}
            onChange={(e) => setLessonNumber(Number(e.target.value))}
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
            Ko&apos;rib chiqish (birinchi qatorlar)
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
        {uploading ? "Yuklanmoqda..." : "Yuklash"}
      </Button>

      {error && <p className="text-danger text-sm">{error}</p>}

      {result && (
        <Card className="p-5">
          <p className="font-semibold text-success">{result.inserted} ta so&apos;z qo&apos;shildi</p>
          <p className="text-sm text-foreground/60 mt-1">{result.skipped} ta o&apos;tkazib yuborildi (takror yoki xato)</p>
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
