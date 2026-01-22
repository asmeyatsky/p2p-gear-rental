'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function BulkUploadPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadResults, setUploadResults] = useState<any>(null); // To store detailed results

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/auth/login?redirectTo=/add-gear/bulk');
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
      setUploadResults(null); // Clear previous results
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file to upload.');
      return;
    }
    setIsLoading(true);
    setUploadResults(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/gear/bulk', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.status === 207) { // Multi-Status for partial success
        toast.error(`Bulk upload completed with ${data.errorCount} errors. Please review the details below.`);
        setUploadResults(data);
      } else if (!res.ok) {
        throw new Error(data.error || 'Failed to upload file');
      } else {
        toast.success(`Successfully uploaded ${data.successCount} items!`);
        setUploadResults(data);
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Error: ${errorMessage}`);
      setUploadResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = [
      "title", "description", "dailyRate", "weeklyRate", "monthlyRate",
      "city", "state", "zipCode", "category", "brand", "model", "condition",
      "replacementValue", "insuranceRequired", "insuranceRate", "securityDeposit",
      "isAvailable", "imageUrl"
    ];
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(',');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "gear_template.csv");
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 overflow-hidden">
      <Header />
      <div className="relative z-10 px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Bulk Upload Gear</h1>
            <p className="mt-2 text-gray-600">
              Upload a CSV file to add multiple gear items at once.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload CSV File</h2>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Download the CSV template, fill it with your gear information, and upload it here.
                    For images, provide a direct URL in the 'imageUrl' column.
                  </p>
                  <Button onClick={downloadTemplate} variant="outline">Download Template</Button>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="flex flex-col gap-4">
                  <input type="file" accept=".csv" onChange={handleFileChange} />

                  <div className="flex items-center justify-between">
                    <Button
                      onClick={handleUpload}
                      disabled={isLoading || !file}
                      className="px-6 py-3"
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Uploading...
                        </span>
                      ) : 'Upload File'}
                    </Button>
                  </div>
                </div>
              </div>

              {uploadResults && (uploadResults.errorCount > 0 || uploadResults.successCount > 0) && (
                <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Summary</h3>
                  <p className="text-sm text-gray-700">
                    Successfully uploaded: <span className="font-medium text-green-600">{uploadResults.successCount}</span> items
                  </p>
                  <p className="text-sm text-gray-700 mb-4">
                    Failed to upload: <span className="font-medium text-red-600">{uploadResults.errorCount}</span> items
                  </p>

                  {uploadResults.errorCount > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">Details:</h4>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-2">
                        {uploadResults.results.map((result: any, index: number) => (
                          result.status === 'error' && (
                            <li key={index} className="p-2 bg-red-50 rounded-md border border-red-200">
                              <p className="font-medium text-red-700">Row {result.row}: {result.data.title || 'Untitled Item'}</p>
                              <ul className="list-disc list-inside ml-4 text-red-600">
                                {result.errors && result.errors.map((err: any, errIndex: number) => (
                                  <li key={errIndex}>{err.message}</li>
                                ))}
                              </ul>
                            </li>
                          )
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
