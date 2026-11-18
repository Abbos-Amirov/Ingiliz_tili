"use client";

import { CsvUploader } from "@/components/admin/CsvUploader";
import { useAdminT } from "@/hooks/useAdminT";

export default function AdminWordsUploadPage() {
  const t = useAdminT("words");
  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-6">{t.uploadTitle}</h1>
      <CsvUploader />
    </div>
  );
}
