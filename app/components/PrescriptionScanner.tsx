'use client';

import { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';

interface Medicine {
  id: number;
  name: string;
  type: string;
  emoji: string;
  price: number;
  description: string;
  tags: string[];
  recommended?: boolean;
  drugName?: string;
}

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
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG, PNG, etc.)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File too large. Please upload image less than 5MB.');
      return;
    }

    // Show preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setScanning(true);
    setExtractedText('');
    setDetectedMedicines([]);
    setAnalysisResult(null);
    setProgress(10);
    setStep('📷 Reading prescription image...');

    try {
      // Step 1: Extract text from image using Tesseract OCR
      setStep('🔍 Extracting text from prescription...');
      setProgress(20);
      
      const result = await Tesseract.recognize(file, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            const progressVal = 20 + Math.floor(m.progress * 50);
            setProgress(progressVal);
          }
        },
      });
      
      const text = result.data.text;
      setExtractedText(text);
      console.log('Extracted text:', text);
      setProgress(70);
      
      if (!text || text.trim().length < 10) {
        alert('Could not read text from prescription. Please ensure the image is clear and well-lit.');
        setScanning(false);
        return;
      }

      // Step 2: Extract medicine names and analyze prescription using AI
      setStep('🤖 AI analyzing prescription...');
      setProgress(80);
      
      const analysis = await analyzePrescriptionWithAI(text);
      setAnalysisResult(analysis);
      setProgress(95);
      
      if (analysis.medicines && analysis.medicines.length > 0) {
        // Format medicines for cart
        const medicineResults = analysis.medicines.map((med: any, idx: number) => ({
          id: Date.now() + idx,
          name: med.name,
          type: med.type || 'Prescribed',
          emoji: getMedicineEmoji(med.type),
          price: 49.99,
          description: med.purpose || med.description || `Prescribed for ${analysis.disease?.name || 'your condition'}`,
          tags: [med.type || 'Prescription', med.purpose?.split(' ')[0] || 'Medicine'],
          recommended: idx === 0,
          drugName: med.name.toLowerCase().split(' ')[0],
          dosage: med.dosage,
          duration: med.duration
        }));
        
        onMedicinesDetected(medicineResults);
        
        // Set search query
        if (onSearchQuery && analysis.disease?.name) {
          onSearchQuery(`Treatment for ${analysis.disease.name}`);
        }
        
        setProgress(100);
        setTimeout(() => {
          setIsOpen(false);
          setPreviewUrl(null);
          setAnalysisResult(null);
        }, 1500);
      } else {
        // Fallback: extract medicine names using regex
        const medicines = extractMedicineNamesRegex(text);
        if (medicines.length > 0) {
          const medicineResults = await searchMedicines(medicines);
          onMedicinesDetected(medicineResults);
          setIsOpen(false);
          setPreviewUrl(null);
        } else {
          alert('No medicines detected. Please try a clearer image or type manually.');
        }
      }
    } catch (error) {
      console.error('OCR Error:', error);
      alert('Failed to read prescription. Please try again with a clearer image.');
    } finally {
      setScanning(false);
      setProgress(0);
      setStep('');
    }
  };

  const analyzePrescriptionWithAI = async (text: string): Promise<any> => {
    try {
      const response = await fetch('/api/analyze-prescription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      
      if (!response.ok) {
        throw new Error('AI analysis failed');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('AI Analysis error:', error);
      // Return fallback analysis
      return getFallbackAnalysis(text);
    }
  };

  const getFallbackAnalysis = (text: string) => {
    const lowerText = text.toLowerCase();
    let disease = "General Health Condition";
    let medicines: any[] = [];
    
    if (lowerText.includes("fever") || lowerText.includes("temperature")) {
      disease = "Fever";
      medicines = [
        { name: "Paracetamol 500mg", type: "Analgesic", dosage: "1 tablet every 6 hours", duration: "3-5 days", purpose: "Reduces fever and mild pain" },
        { name: "Ibuprofen 400mg", type: "NSAID", dosage: "1 tablet every 8 hours", duration: "3-5 days", purpose: "Reduces fever and body aches" }
      ];
    } else if (lowerText.includes("cough") || lowerText.includes("cold")) {
      disease = "Upper Respiratory Infection";
      medicines = [
        { name: "Cold & Flu Tablet", type: "Combination", dosage: "1 tablet every 6 hours", duration: "5 days", purpose: "Relieves cold and cough symptoms" },
        { name: "Cough Syrup DM", type: "Cough Suppressant", dosage: "10ml every 8 hours", duration: "5 days", purpose: "Suppresses dry cough" }
      ];
    } else if (lowerText.includes("headache") || lowerText.includes("migraine")) {
      disease = "Headache";
      medicines = [
        { name: "Ibuprofen 400mg", type: "NSAID", dosage: "1 tablet every 8 hours", duration: "3 days", purpose: "Relieves headache pain" },
        { name: "Paracetamol 500mg", type: "Analgesic", dosage: "1 tablet every 6 hours", duration: "3 days", purpose: "Pain relief" }
      ];
    } else {
      // Extract any medicine names from text
      const foundMeds = extractMedicineNamesRegex(text);
      medicines = foundMeds.map((name, idx) => ({
        name: `${name} 500mg`,
        type: "Medicine",
        dosage: "As prescribed",
        duration: "As directed",
        purpose: `Treatment for prescribed condition`
      }));
    }
    
    return {
      disease: { name: disease, description: `Based on your prescription, this condition requires proper medication.` },
      medicines: medicines,
      healthTips: [
        "Complete the full course of prescribed medication",
        "Get plenty of rest and stay hydrated",
        "Avoid alcohol and smoking during treatment",
        "Monitor your symptoms and consult doctor if they worsen",
        "Store medicines as per instructions on the package"
      ],
      dietPlan: {
        foodsToEat: ["Warm soups", "Herbal tea", "Fresh fruits", "Light meals", "Honey with warm water"],
        foodsToAvoid: ["Spicy food", "Cold drinks", "Fried items", "Processed food", "Excessive dairy"],
        recommendations: "Eat light, easily digestible foods. Avoid heavy, oily, or spicy meals until recovery."
      },
      lifestyleAdvice: [
        "Take medicines on time as prescribed",
        "Get adequate sleep (7-8 hours)",
        "Avoid stress and practice deep breathing",
        "Wash hands frequently to prevent infection",
        "Follow up with doctor if no improvement in 3 days"
      ]
    };
  };

  const extractMedicineNamesRegex = (text: string): string[] => {
    const commonMedicines = [
      'paracetamol', 'ibuprofen', 'cetirizine', 'loratadine', 'omeprazole',
      'amoxicillin', 'azithromycin', 'dolo', 'crocin', 'combiflam', 'levocetirizine',
      'montelukast', 'pantoprazole', 'rabeprazole', 'aspirin', 'diclofenac'
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
    
    for (let i = 0; i < medicineNames.length; i++) {
      const name = medicineNames[i];
      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: `Recommend ${name} medicine` }),
        });
        const data = await response.json();
        if (data.medicines && data.medicines.length > 0) {
          results.push({ ...data.medicines[0], id: Date.now() + i });
        } else {
          // Fallback medicine
          results.push({
            id: Date.now() + i,
            name: `${name} 500mg`,
            type: "Medicine",
            emoji: "💊",
            price: 49.99,
            description: `Prescribed medicine: ${name}`,
            tags: ["Prescription"],
            recommended: i === 0,
            drugName: name.toLowerCase()
          });
        }
      } catch (error) {
        console.error(`Error searching for ${name}:`, error);
        results.push({
          id: Date.now() + i,
          name: `${name} 500mg`,
          type: "Medicine",
          emoji: "💊",
          price: 49.99,
          description: `Prescribed medicine: ${name}`,
          tags: ["Prescription"],
          recommended: i === 0,
          drugName: name.toLowerCase()
        });
      }
    }
    
    return results;
  };

  const getMedicineEmoji = (type: string): string => {
    const t = type.toLowerCase();
    if (t.includes('antibiotic')) return '💊';
    if (t.includes('pain')) return '💊';
    if (t.includes('cough')) return '🍯';
    if (t.includes('allergy')) return '🌸';
    return '💊';
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="voice-btn"
        type="button"
        style={{ padding: "10px 16px" }}
      >
        📷 Prescription
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
                    <p className="text-gray-600 mb-2">Upload a photo of your prescription</p>
                    <p className="text-xs text-gray-400 mb-4">Supports JPG, PNG (Max 5MB)</p>
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
                    Make sure the text is clear and well-lit for best results.
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
                      <div className="w-12 h-12 border-4 border-[#0fa381] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                      <p className="font-medium text-[#0fa381]">{step || 'Processing...'}</p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                        <div className="bg-[#0fa381] h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">{progress}% complete</p>
                    </div>
                  ) : analysisResult ? (
                    <div className="text-center">
                      <div className="text-3xl mb-2">✅</div>
                      <p className="text-green-600 font-semibold">Prescription Analyzed!</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Detected: {analysisResult.medicines?.length || 0} medicines
                      </p>
                      <button
                        onClick={() => {
                          setPreviewUrl(null);
                          setExtractedText('');
                          setDetectedMedicines([]);
                          setAnalysisResult(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="mt-4 text-[#0fa381] text-sm hover:underline"
                      >
                        Scan another prescription
                      </button>
                    </div>
                  ) : (
                    <div>
                      {extractedText && (
                        <div className="mt-4 p-3 bg-gray-100 rounded text-left max-h-32 overflow-y-auto">
                          <p className="font-semibold text-sm mb-1">Extracted Text:</p>
                          <p className="text-xs text-gray-600">{extractedText.substring(0, 200)}...</p>
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