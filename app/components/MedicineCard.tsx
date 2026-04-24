'use client';

import { useState } from 'react';

interface Medicine {
  id?: number;
  name: string;
  dosage?: string;
  type?: string;
  category?: string;
  isAntibiotic?: boolean;
  description?: string;
  emoji?: string;
  price?: number;
  pricePerTablet?: number;
  usage?: {
    frequency: string;
    duration: string;
    totalTablets: number;
  };
  quantitySelector?: {
    allowLoose: boolean;
    tabletsPerStrip: number;
    minQuantity: number;
    maxQuantity: number;
    defaultQuantity: number;
    step: number;
    recommendedType: string;
    note: string;
  };
}

interface MedicineCardProps {
  medicine: Medicine;
  onAddToCart: (medicine: any, quantity: number, quantityType: string) => void;
  isRecommended?: boolean;
}

export default function MedicineCard({ medicine, onAddToCart, isRecommended = false }: MedicineCardProps) {
  const [quantity, setQuantity] = useState(medicine.quantitySelector?.defaultQuantity || 6);
  const [quantityType, setQuantityType] = useState<'loose' | 'strip'>(
    medicine.quantitySelector?.recommendedType === 'strip' ? 'strip' : 'loose'
  );

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    const min = medicine.quantitySelector?.minQuantity || 1;
    const max = medicine.quantitySelector?.maxQuantity || 20;
    if (newQuantity >= min && newQuantity <= max) {
      setQuantity(newQuantity);
    }
  };

  const handleQuantityTypeChange = (type: 'loose' | 'strip') => {
    setQuantityType(type);
    if (type === 'strip') {
      setQuantity(medicine.quantitySelector?.tabletsPerStrip || 10);
    } else {
      setQuantity(medicine.quantitySelector?.defaultQuantity || 6);
    }
  };

  const pricePerTablet = medicine.pricePerTablet || (medicine.price || 45) / 10;
  const totalPrice = quantity * pricePerTablet;

  return (
    <div className={`bg-white rounded-xl border p-4 ${isRecommended ? 'border-mint shadow-md' : 'border-gray-200'}`}>
      {isRecommended && (
        <div className="mb-2 inline-block bg-mint text-white text-xs px-2 py-1 rounded-full">
          ⭐ Best Match
        </div>
      )}
      
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold text-lg text-ink">{medicine.name}</h3>
          <p className="text-sm text-ink-soft">{medicine.dosage || 'As prescribed'} | {medicine.type || 'tablet'}</p>
          <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full mt-1">
            {medicine.category || 'Medicine'}
          </span>
        </div>
        {medicine.isAntibiotic && (
          <div className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">
            ⚠️ Antibiotic
          </div>
        )}
      </div>

      <div className="mb-3">
        <p className="text-sm text-gray-600">💊 Usage: {medicine.usage?.frequency || 'As needed'} for {medicine.usage?.duration || '3 days'}</p>
        {medicine.quantitySelector?.note && (
          <p className="text-xs text-orange-600 mt-1">{medicine.quantitySelector.note}</p>
        )}
      </div>

      <div className="border-t pt-3 mt-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Quantity:</span>
          <div className="flex items-center gap-2">
            {medicine.quantitySelector?.allowLoose !== false && (
              <button
                onClick={() => handleQuantityTypeChange('loose')}
                className={`px-3 py-1 rounded-lg text-sm transition ${
                  quantityType === 'loose' 
                    ? 'bg-mint text-white' 
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                Loose
              </button>
            )}
            <button
              onClick={() => handleQuantityTypeChange('strip')}
              className={`px-3 py-1 rounded-lg text-sm transition ${
                quantityType === 'strip' 
                  ? 'bg-mint text-white' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Strip ({medicine.quantitySelector?.tabletsPerStrip || 10})
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleQuantityChange(-1)}
              className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-lg font-bold"
              disabled={quantity <= (medicine.quantitySelector?.minQuantity || 1)}
            >
              -
            </button>
            <span className="text-lg font-semibold w-12 text-center">{quantity}</span>
            <button
              onClick={() => handleQuantityChange(1)}
              className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-lg font-bold"
              disabled={quantity >= (medicine.quantitySelector?.maxQuantity || 20)}
            >
              +
            </button>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">₹{pricePerTablet}/tablet</p>
            <p className="text-xl font-bold text-mint">₹{totalPrice}</p>
          </div>
        </div>

        <button
          onClick={() => onAddToCart(medicine, quantity, quantityType)}
          className="w-full mt-3 bg-mint text-white py-2 rounded-lg hover:bg-mint-dark transition"
        >
          🛒 Add to Cart
        </button>
      </div>
    </div>
  );
}