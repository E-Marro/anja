/**
 * Custom Hook für File Upload
 */

import { useState } from 'react';
import { processFiles, type ProcessingResult } from '@/utils/fileProcessor';

export function useFileUpload() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (
    e: React.DragEvent,
    onComplete: (results: ProcessingResult[]) => void
  ) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await uploadFiles(files, onComplete);
    }
  };

  const handleFileInput = async (
    e: React.ChangeEvent<HTMLInputElement>,
    onComplete: (results: ProcessingResult[]) => void
  ) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await uploadFiles(files, onComplete);
    }
  };

  const uploadFiles = async (
    files: FileList,
    onComplete: (results: ProcessingResult[]) => void
  ) => {
    setIsProcessing(true);
    try {
      const results = await processFiles(files);
      onComplete(results);
    } catch (error) {
      console.error('Upload error:', error);
      onComplete([{
        success: false,
        message: `❌ Fehler beim Upload: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    isDragging,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInput,
  };
}
