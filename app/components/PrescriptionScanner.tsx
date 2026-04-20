'use client';

import { useState, useRef } from 'react';

interface PrescriptionScannerProps {
  onMedicinesDetected: (medicines: any[]) => void;
}

export default function PrescriptionScanner({ onMedicinesDetected }: PrescriptionScannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setScanning(true);

    try {
      // Read the image and extract text using Tesseract
      const Tesseract = (await import('tesseract.js')).default;
      const result = await Tesseract.recognize(file, 'eng');
      const extractedText = result.data.text;
      
      console.log('Extracted text:', extractedText);

      // Send to your AI API to extract medicines
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: `Extract medicine names from this prescription text and return them as medicines. Prescription: "${extractedText}"`
        }),
      });
      
      const data = await response.json();
      
      if (data.medicines && data.medicines.length > 0) {
        onMedicinesDetected(data.medicines);
        setIsOpen(false);
        setPreviewUrl(null);
      } else {
        alert('No medicines detected. Please try again or type manually.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to read prescription. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  return (
    <>
      <button
  onClick={() => setIsOpen(true)}
  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-mint hover:text-mint-dark transition-all duration-200"
  type="button"
>
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
  Prescription
</button>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="bg-white rounded-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Upload Prescription</h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="text-center">
              {!previewUrl ? (
                <>
                  <div className="mb-4 p-8 bg-gray-50 rounded-lg text-center">
                    <div className="text-4xl mb-2">📄</div>
                    <p className="text-gray-600 mb-4">Upload a photo of your prescription</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="prescription-input"
                    />
                    <label
                      htmlFor="prescription-input"
                      className="inline-block bg-mint text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-mint-dark"
                    >
                      Choose Image
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Supported formats: JPG, PNG. Max size: 5MB
                  </p>
                </>
              ) : (
                <div>
                  <img 
                    src={previewUrl} 
                    alt="Prescription preview" 
                    className="max-h-64 mx-auto rounded-lg mb-4"
                  />
                  {scanning ? (
                    <div className="text-center">
                      <div className="spinner mx-auto mb-2" />
                      <p>Reading prescription...</p>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setPreviewUrl(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="text-red-500"
                    >
                      Remove and try again
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}