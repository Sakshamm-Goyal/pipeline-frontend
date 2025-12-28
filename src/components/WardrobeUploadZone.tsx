import React, { useRef, useState, useEffect, useCallback } from 'react';
import { uploadQueue, UploadJob } from '../services/uploadQueue';

interface WardrobeUploadZoneProps {
  onUploadComplete?: () => void;
}

export default function WardrobeUploadZone({ onUploadComplete }: WardrobeUploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [jobs, setJobs] = useState<UploadJob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCompletedCountRef = useRef(0);

  // Debounced refresh - only refresh once after all uploads settle
  const debouncedRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    refreshTimeoutRef.current = setTimeout(() => {
      if (onUploadComplete) {
        onUploadComplete();
      }
    }, 1000); // Wait 1 second after last completion
  }, [onUploadComplete]);

  useEffect(() => {
    const unsubscribe = uploadQueue.subscribe((updatedJobs) => {
      setJobs(updatedJobs);

      // Check if completed count increased
      const completedCount = updatedJobs.filter(j => j.status === 'completed').length;
      if (completedCount > lastCompletedCountRef.current) {
        lastCompletedCountRef.current = completedCount;
        debouncedRefresh();
      }
    });

    return () => {
      unsubscribe();
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [debouncedRefresh]);

  const handleFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length > 0) {
      uploadQueue.addFiles(fileArray);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
      e.target.value = ''; // Reset for same file selection
    }
  };

  const activeJobs = jobs.filter(j => j.status !== 'completed');
  const stats = uploadQueue.getStats();

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          dragActive
            ? 'border-purple-500 bg-purple-50 scale-[1.02]'
            : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileInput}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-3">
          <div className={`p-4 rounded-full ${dragActive ? 'bg-purple-100' : 'bg-gray-100'}`}>
            <svg
              className={`w-8 h-8 ${dragActive ? 'text-purple-600' : 'text-gray-400'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <div>
            <p className="text-lg font-medium text-gray-700">
              Drop images here or click to upload
            </p>
            <p className="text-sm text-gray-500 mt-1">
              AI will automatically categorize, name, and extract attributes
            </p>
          </div>
          <p className="text-xs text-gray-400">
            PNG, JPG up to 10MB each - Multiple files supported
          </p>
        </div>
      </div>

      {/* Upload Progress */}
      {activeJobs.length > 0 && (
        <div className="bg-white rounded-lg border shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900">
              Uploading {stats.uploading > 0 ? `(${stats.uploading} active)` : ''}
            </h3>
            {stats.completed > 0 && (
              <button
                onClick={() => {
                  uploadQueue.clearCompleted();
                  lastCompletedCountRef.current = 0;
                }}
                className="text-sm text-purple-600 hover:text-purple-700"
              >
                Clear completed
              </button>
            )}
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto">
            {activeJobs.map((job) => (
              <div key={job.id} className="flex items-center gap-3">
                {/* Preview */}
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {job.preview ? (
                    <img
                      src={job.preview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Info & Progress */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {job.file.name}
                  </p>

                  {job.status === 'failed' ? (
                    <p className="text-xs text-red-600">{job.error || 'Upload failed'}</p>
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            job.status === 'completed' ? 'bg-green-500' : 'bg-purple-500'
                          }`}
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-16 text-right">
                        {job.status === 'pending' && 'Waiting...'}
                        {job.status === 'uploading' && 'Uploading'}
                        {job.status === 'processing' && 'AI analyzing'}
                        {job.status === 'completed' && 'Done!'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex-shrink-0">
                  {job.status === 'failed' ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); uploadQueue.retryJob(job.id); }}
                      className="p-1.5 text-purple-600 hover:bg-purple-50 rounded"
                      title="Retry"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  ) : job.status !== 'completed' ? (
                    <div className="w-5 h-5">
                      <svg className="animate-spin text-purple-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    </div>
                  ) : (
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>

                {/* Remove button */}
                <button
                  onClick={(e) => { e.stopPropagation(); uploadQueue.removeJob(job.id); }}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                  title="Remove"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
