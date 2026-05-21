import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Upload configuration
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

// Helper to create Supabase client
async function createSupabaseClient() {
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
}

// Helper function to generate unique filename
function generateFileName(originalName: string, userId: string): string {
  const extension = originalName.split('.').pop();
  const timestamp = Date.now();
  const randomString = uuidv4().substring(0, 8);
  return `${userId}/${timestamp}-${randomString}.${extension}`;
}

// Helper function to validate file
function validateFile(file: File, type: 'image' | 'document'): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`;
  }
  
  const allowedTypes = type === 'image' ? ALLOWED_IMAGE_TYPES : ALLOWED_DOCUMENT_TYPES;
  if (!allowedTypes.includes(file.type)) {
    return `File type ${file.type} is not allowed`;
  }
  
  return null;
}

// POST: Upload file (image or document)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string || 'image';
    const folder = formData.get('folder') as string || 'general';
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Validate file
    const validationError = validateFile(file, type as 'image' | 'document');
    if (validationError) {
      return NextResponse.json(
        { success: false, error: validationError },
        { status: 400 }
      );
    }
    
    // Generate unique filename
    const userId = user.id;
    const fileName = generateFileName(file.name, userId);
    const filePath = `${folder}/${fileName}`;
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('admin-uploads')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });
    
    if (uploadError) {
      throw uploadError;
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('admin-uploads')
      .getPublicUrl(filePath);
    
    // Save file metadata to database
    const { data: fileRecord, error: dbError } = await supabase
      .from('uploaded_files')
      .insert({
        user_id: userId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        public_url: publicUrl,
        folder,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (dbError) {
      console.error('Failed to save file metadata:', dbError);
      // Don't fail the upload if metadata save fails
    }
    
    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileId: fileRecord?.id,
      message: 'File uploaded successfully',
    });
    
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to upload file' },
      { status: 500 }
    );
  }
}

// GET: Get uploaded files list
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const searchParams = request.nextUrl.searchParams;
    const folder = searchParams.get('folder');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Build query
    let query = supabase
      .from('uploaded_files')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (folder && folder !== 'all') {
      query = query.eq('folder', folder);
    }
    
    const { data: files, error, count } = await query;
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      data: files,
      pagination: {
        limit,
        offset,
        total: count || 0,
      },
    });
    
  } catch (error: any) {
    console.error('Fetch files error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch files' },
      { status: 500 }
    );
  }
}

// DELETE: Delete uploaded file
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const searchParams = request.nextUrl.searchParams;
    const fileId = searchParams.get('id');
    const filePath = searchParams.get('path');
    
    if (!fileId && !filePath) {
      return NextResponse.json(
        { success: false, error: 'File ID or path is required' },
        { status: 400 }
      );
    }
    
    let fileToDelete: any = null;
    
    // Get file metadata if only ID is provided
    if (fileId && !filePath) {
      const { data: file, error: fetchError } = await supabase
        .from('uploaded_files')
        .select('*')
        .eq('id', fileId)
        .single();
      
      if (fetchError || !file) {
        return NextResponse.json(
          { success: false, error: 'File not found' },
          { status: 404 }
        );
      }
      
      fileToDelete = file;
    }
    
    const storagePath = filePath || fileToDelete?.file_path;
    
    if (!storagePath) {
      return NextResponse.json(
        { success: false, error: 'File path not found' },
        { status: 400 }
      );
    }
    
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('admin-uploads')
      .remove([storagePath]);
    
    if (storageError) {
      throw storageError;
    }
    
    // Delete from database if we have a record
    if (fileId || fileToDelete) {
      await supabase
        .from('uploaded_files')
        .delete()
        .eq('id', fileId || fileToDelete.id);
    }
    
    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });
    
  } catch (error: any) {
    console.error('File deletion error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete file' },
      { status: 500 }
    );
  }
}

// Helper endpoint to get file URL by ID
export async function HEAD(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const fileId = searchParams.get('id');
    
    if (!fileId) {
      return NextResponse.json(
        { success: false, error: 'File ID is required' },
        { status: 400 }
      );
    }
    
    const { data: file, error } = await supabase
      .from('uploaded_files')
      .select('public_url, file_path')
      .eq('id', fileId)
      .single();
    
    if (error || !file) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      url: file.public_url,
      path: file.file_path,
    });
    
  } catch (error: any) {
    console.error('Get file URL error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get file URL' },
      { status: 500 }
    );
  }
}