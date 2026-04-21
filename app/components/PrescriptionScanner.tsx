'use client';

import { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';

interface PrescriptionScannerProps {
  onMedicinesDetected: (medicines: any[]) => void;
  onSearchQuery?: (query: string) => void;
}

export default function PrescriptionScanner({ onMedicinesDetected, onSearchQuery }: PrescriptionScannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [detectedMedicines, setDetectedMedicines] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setScanning(true);
    setExtractedText('');
    setDetectedMedicines([]);

    try {
      // Extract text from image using Tesseract OCR
      const result = await Tesseract.recognize(file, 'eng', {
        logger: (m) => console.log(m),
      });
      
      const text = result.data.text;
      setExtractedText(text);
      console.log('Extracted text:', text);

      // Extract medicine names using AI
      const medicines = await extractMedicinesWithAI(text);
      setDetectedMedicines(medicines);
      
      if (medicines.length > 0) {
        // Search for each medicine
        const medicineResults = await searchMedicines(medicines);
        onMedicinesDetected(medicineResults);
        
        // Also set the search query if there's a primary symptom
        if (onSearchQuery && medicines.length > 0) {
          onSearchQuery(`I need ${medicines.join(', ')}`);
        }
        
        setIsOpen(false);
        setPreviewUrl(null);
      } else {
        alert('No medicines detected. Please try a clearer image or type manually.');
      }
    } catch (error) {
      console.error('OCR Error:', error);
      alert('Failed to read prescription. Please try again with a clearer image.');
    } finally {
      setScanning(false);
    }
  };

  const extractMedicinesWithAI = async (text: string): Promise<string[]> => {
    try {
      const response = await fetch('/api/extract-medicines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      return data.medicines || [];
    } catch (error) {
      console.error('AI Extraction error:', error);
      // Fallback: extract common medicine names using regex
      return extractMedicineNamesRegex(text);
    }
  };

  const extractMedicineNamesRegex = (text: string): string[] => {
    const commonMedicines = [
      'paracetamol', 'ibuprofen', 'cetirizine', 'loratadine', 'omeprazole',
      'amoxicillin', 'azithromycin', 'dolo', 'crocin', 'combiflam',
      'levocetirizine', 'montelukast', 'pantoprazole', 'rabeprazole'
    ];
    
    const lowerText = text.toLowerCase();
    const found: string[] = [];
    
    for (const med of commonMedicines) {
      if (lowerText.includes(med)) {
        found.push(med.charAt(0).toUpperCase() + med.slice(1));
      }
    }
    
    return found;
  };

  const searchMedicines = async (medicineNames: string[]): Promise<any[]> => {
    const results: any[] = [];
    
    for (const name of medicineNames) {
      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: `Recommend ${name} medicine` }),
        });
        const data = await response.json();
        if (data.medicines && data.medicines.length > 0) {
          results.push(...data.medicines);
        }
      } catch (error) {
        console.error(`Error searching for ${name}:`, error);
      }
    }
    
    return results;
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="voice-btn"
        type="button"
        style={{ padding: "10px 16px" }}
      >
        📷 Rx
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Upload Prescription</h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
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
                      className="inline-block bg-[#0fa381] text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-[#0a7860] transition"
                    >
                      Choose Image
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">
                    Supported: JPG, PNG. Make sure the text is clear.
                  </p>
                </>
              ) : (
                <div>
                  <img 
                    src={previewUrl} 
                    alt="Prescription preview" 
                    className="max-h-48 mx-auto rounded-lg mb-4 border"
                  />
                  {scanning ? (
                    <div className="text-center">
                      <div className="spinner mx-auto mb-2" />
                      <p>Reading prescription...</p>
                    </div>
                  ) : (
                    <div>
                      {extractedText && (
                        <div className="mt-4 p-3 bg-gray-100 rounded text-left">
                          <p className="font-semibold text-sm mb-1">Extracted Text:</p>
                          <p className="text-xs text-gray-600 line-clamp-3">{extractedText}</p>
                        </div>
                      )}
                      {detectedMedicines.length > 0 && (
                        <div className="mt-3">
                          <p className="font-semibold text-sm text-[#0fa381]">Detected Medicines:</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {detectedMedicines.map((med, idx) => (
                              <span key={idx} className="bg-[#e6f7f3] text-[#0a7860] px-2 py-1 rounded-full text-xs">
                                {med}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <button
                        onClick={() => {
                          setPreviewUrl(null);
                          setExtractedText('');
                          setDetectedMedicines([]);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="mt-4 text-red-500 text-sm"
                      >
                        Try another image
                      </button>
                    </div>
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