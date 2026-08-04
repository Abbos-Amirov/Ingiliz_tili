import { CsvUploader } from "@/components/admin/CsvUploader";

export default function AdminWordsUploadPage() {
  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-6">CSV orqali ommaviy yuklash</h1>
      <CsvUploader />
    </div>
  );
}
