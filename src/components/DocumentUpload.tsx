import { useState, useEffect } from 'react';
import { documentService } from '../services/api';

interface DocumentUploadProps {
  voterId: number;
  onUploadComplete?: () => void;
}

interface Document {
  document_id: number;
  document_type: string;
  document_name: string;
  file_path: string;
  status: string;
  uploaded_at: string;
}

const DOCUMENT_TYPES = [
  { value: 'aadhaar', label: 'Aadhaar Card', required: true },
  { value: 'address_proof', label: 'Address Proof', required: true },
  { value: 'photo', label: 'Profile Photo', required: true },
  { value: 'signature', label: 'Signature', required: false },
  { value: 'disability_cert', label: 'Disability Certificate', required: false },
  { value: 'birth_cert', label: 'Birth Certificate', required: false },
  { value: 'marriage_cert', label: 'Marriage Certificate', required: false },
  { value: 'affidavit', label: 'Affidavit', required: false },
];

export default function DocumentUpload({ voterId, onUploadComplete }: DocumentUploadProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (voterId) {
      loadDocuments();
    }
  }, [voterId]);

  const loadDocuments = async () => {
    try {
      const response = await documentService.getVoterDocuments(voterId);
      setDocuments(response.data.data || []);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (documentType: string, file: File) => {
    if (!file) return;

    setUploading(documentType);
    try {
      await documentService.upload(voterId, documentType, file);
      await loadDocuments();
      if (onUploadComplete) onUploadComplete();
      alert('Document uploaded successfully!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to upload document');
    } finally {
      setUploading(null);
    }
  };

  const handleDelete = async (documentId: number) => {
    if (!confirm('Delete this document?')) return;
    try {
      await documentService.delete(documentId);
      await loadDocuments();
      alert('Document deleted successfully!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete document');
    }
  };

  const getDocumentStatus = (doc: Document) => {
    return doc.status || 'pending';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-600">Loading documents...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Document Upload Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {DOCUMENT_TYPES.map((docType) => {
          const existingDoc = documents.find(d => d.document_type === docType.value);
          const isUploading = uploading === docType.value;

          return (
            <div
              key={docType.value}
              className={`p-4 border-2 rounded-lg ${
                existingDoc
                  ? 'border-green-300 bg-green-50'
                  : docType.required
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-gray-800">{docType.label}</h4>
                  {docType.required && (
                    <span className="text-xs text-red-600">* Required</span>
                  )}
                </div>
                {existingDoc && (
                  <span
                    className={`px-2 py-1 text-xs rounded border ${getStatusColor(
                      getDocumentStatus(existingDoc)
                    )}`}
                  >
                    {getDocumentStatus(existingDoc)}
                  </span>
                )}
              </div>

              {existingDoc ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">{existingDoc.document_name}</p>
                  <p className="text-xs text-gray-500">
                    Uploaded: {new Date(existingDoc.uploaded_at).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2">
                    <label className="btn-secondary text-xs cursor-pointer">
                      Replace
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(docType.value, file);
                        }}
                        disabled={isUploading}
                      />
                    </label>
                    <button
                      onClick={() => handleDelete(existingDoc.document_id)}
                      className="btn-secondary text-xs bg-red-50 text-red-700 border-red-300 hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="btn-primary text-sm cursor-pointer inline-block">
                    {isUploading ? 'Uploading...' : 'Upload'}
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(docType.value, file);
                      }}
                      disabled={isUploading}
                    />
                  </label>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Upload Instructions */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-gray-800 mb-2">📋 Upload Guidelines:</h4>
        <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
          <li>Accepted formats: PDF, JPG, JPEG, PNG</li>
          <li>Maximum file size: 5MB per document</li>
          <li>Documents are encrypted and stored securely</li>
          <li>Required documents must be uploaded for profile completion</li>
        </ul>
      </div>
    </div>
  );
}

