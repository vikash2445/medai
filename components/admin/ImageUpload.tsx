// components/admin/ImageUpload.tsx
'use client';

import { useState } from 'react';
import { createBrowserClient } from '@lib/supabase-admin';
import { Upload, X } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface ImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  bucket?: string;
  folder?: string;
  label?: string;
}

export default function ImageUpload({ 
  value, 
  onChange, 
  bucket = 'product-images', 
  folder = 'products',
  label = 'Product Image' 
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const supabase = createBrowserClient();

  const uploadImage = async (file: File) => {
    // Validate file
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

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        if (uploadError.message === 'Bucket not found') {
          toast.error(`Bucket "${bucket}" not found. Please check storage configuration.`);
        } else if (uploadError.message.includes('row-level security')) {
          toast.error('Permission denied. Please check storage policies.');
        } else {
          toast.error(uploadError.message);
        }
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      onChange(publicUrl);
      toast.success('Image uploaded successfully');
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadImage(file);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {label}
      </label>
      
      {value ? (
        <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-slate-200">
          <img src={value} alt="Preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-green-500 transition">
          <div className="text-center">
            {uploading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
            ) : (
              <>
                <Upload size={24} className="mx-auto text-slate-400" />
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