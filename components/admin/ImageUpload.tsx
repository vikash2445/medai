'use client';

import { useState } from 'react';
import { createBrowserClient } from '@lib/supabase-admin';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

interface ImageUploadProps {
  values: string[] | null;  // Changed from value to values (array)
  onChange: (urls: string[] | null) => void;
  bucket?: string;
  folder?: string;
  label?: string;
  maxImages?: number;
}

export default function ImageUpload({ 
  values = [], 
  onChange, 
  bucket = 'product-images', 
  folder = 'products',
  label = 'Product Images',
  maxImages = 5
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const supabase = createBrowserClient();

  const uploadImage = async (file: File) => {
    if (values.length >= maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file');
      return;
    }

    setUploading(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error(uploadError.message);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      const newImages = [...values, publicUrl];
      onChange(newImages);
      toast.success('Image uploaded successfully');
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (indexToRemove: number) => {
    const newImages = values.filter((_, index) => index !== indexToRemove);
    onChange(newImages.length > 0 ? newImages : null);
    toast.success('Image removed');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadImage(file);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {label} ({values.length}/{maxImages})
      </label>
      
      {/* Image Grid */}
      {values.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {values.map((url, index) => (
            <div key={index} className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200 group">
              <img src={url} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Upload Button */}
      {values.length < maxImages && (
        <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-green-500 transition">
          <div className="text-center">
            {uploading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto"></div>
            ) : (
              <>
                <Upload size={20} className="mx-auto text-slate-400" />
                <span className="text-xs text-slate-500 mt-1">Upload</span>
              </>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
        </label>
      )}
    </div>
  );
}