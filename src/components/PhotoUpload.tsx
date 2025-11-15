import { useState, useRef } from 'react';

interface PhotoUploadProps {
  onUpload: (file: File) => void;
  currentPhoto?: string;
  label?: string;
}

export default function PhotoUpload({ onUpload, currentPhoto, label = 'Profile Photo' }: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentPhoto || null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      onUpload(file);
    } else {
      alert('Please select a valid image file');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label} *</label>
      
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
          dragging
            ? 'border-primary-navy bg-blue-50'
            : 'border-gray-300 hover:border-primary-navy hover:bg-gray-50'
        }`}
      >
        {preview ? (
          <div className="space-y-4">
            <img
              src={preview}
              alt="Preview"
              className="w-48 h-48 mx-auto rounded-full object-cover border-4 border-white shadow-lg"
            />
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary text-sm"
              >
                Change Photo
              </button>
              <button
                onClick={() => {
                  setPreview(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="btn-secondary text-sm bg-red-50 text-red-700 border-red-300 hover:bg-red-100"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-24 h-24 mx-auto bg-gray-200 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-600 mb-2">Drag & drop your photo here, or</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-primary"
              >
                Browse Files
              </button>
            </div>
            <p className="text-xs text-gray-500">Passport size photo (JPG, PNG, max 5MB)</p>
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
        />
      </div>
    </div>
  );
}

