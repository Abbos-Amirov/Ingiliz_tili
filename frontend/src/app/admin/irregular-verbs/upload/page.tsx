import { IrregularVerbCsvUploader } from "@/components/admin/IrregularVerbCsvUploader";

export default function AdminIrregularVerbsUploadPage() {
  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-6">Irregular Verbs — CSV orqali yuklash</h1>
      <IrregularVerbCsvUploader />
    </div>
  );
}
