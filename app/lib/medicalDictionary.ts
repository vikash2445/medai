// app/lib/medicalDictionary.ts

export interface MedicineInfo {
  brandNames: string[];
  defaultDosage: string;
  type: string;
  category: string;
  pricePerTablet: number;
}

// Common OCR corrections
export const corrections: Record<string, string> = {
  'crocim': 'Crocin',
  'crocine': 'Crocin',
  'paraetamol': 'Paracetamol',
  'paracetmol': 'Paracetamol',
  'ibuprohen': 'Ibuprofen',
  'ibuprofin': 'Ibuprofen',
  'ceterizine': 'Cetirizine',
  'cetrizine': 'Cetirizine',
  'omeprazol': 'Omeprazole',
  'azythromycin': 'Azithromycin',
  'amoxycillin': 'Amoxicillin',
};

// Medicine database
export const medicines: Record<string, MedicineInfo> = {
  'Paracetamol': {
    brandNames: ['Crocin', 'Dolo', 'PCM'],
    defaultDosage: '500mg',
    type: 'analgesic',
    category: 'Pain Relief',
    pricePerTablet: 3
  },
  'Ibuprofen': {
    brandNames: ['Brufen', 'Ibugesic'],
    defaultDosage: '400mg',
    type: 'nsaid',
    category: 'Pain Relief',
    pricePerTablet: 5
  },
  'Cetirizine': {
    brandNames: ['Cetzine', 'Zyrtec', 'Okacet'],
    defaultDosage: '10mg',
    type: 'antihistamine',
    category: 'Allergy',
    pricePerTablet: 4
  },
  'Omeprazole': {
    brandNames: ['Omez', 'Ompee'],
    defaultDosage: '20mg',
    type: 'ppi',
    category: 'Acidity',
    pricePerTablet: 7
  },
  'Azithromycin': {
    brandNames: ['Azee', 'Zithromax'],
    defaultDosage: '500mg',
    type: 'antibiotic',
    category: 'Infection',
    pricePerTablet: 15
  },
  'Amoxicillin': {
    brandNames: ['Amoxil', 'Mox'],
    defaultDosage: '500mg',
    type: 'antibiotic',
    category: 'Infection',
    pricePerTablet: 12
  }
};

export const medicalDictionary = {
  corrections,
  medicines,
  
  findBestMatch(text: string): { medicine: string; info: MedicineInfo; confidence: string } | null {
    const lowerText = text.toLowerCase();
    
    // Check corrections first
    for (const [misspelled, correct] of Object.entries(corrections)) {
      if (lowerText.includes(misspelled)) {
        const info = medicines[correct];
        if (info) {
          return { medicine: correct, info, confidence: 'high' };
        }
      }
    }
    
    // Check medicine names
    for (const [medicine, info] of Object.entries(medicines)) {
      if (lowerText.includes(medicine.toLowerCase())) {
        return { medicine, info, confidence: 'high' };
      }
      for (const brand of info.brandNames) {
        if (lowerText.includes(brand.toLowerCase())) {
          return { medicine, info, confidence: 'medium' };
        }
      }
    }
    
    return null;
  }
};

export function calculateConfidence(medicine: string, originalText: string): string {
  if (medicine.toLowerCase() === originalText.toLowerCase()) return 'high';
  if (medicine.toLowerCase().includes(originalText.toLowerCase()) || 
      originalText.toLowerCase().includes(medicine.toLowerCase())) return 'medium';
  return 'low';
}