"use client";

import { IrregularVerbCsvUploader } from "@/components/admin/IrregularVerbCsvUploader";
import { useAdminT } from "@/hooks/useAdminT";

export default function AdminIrregularVerbsUploadPage() {
  const t = useAdminT("irregular");
  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-6">{t.uploadTitle}</h1>
      <IrregularVerbCsvUploader />
    </div>
  );
}
