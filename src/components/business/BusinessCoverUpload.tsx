import { Camera, Loader2 } from 'lucide-react';

interface BusinessCoverUploadProps {
  coverUrl: string | null;
  onUpload: (file: File) => void;
  isUploading?: boolean;
}

export function BusinessCoverUpload({ 
  coverUrl, 
  onUpload,
  isUploading 
}: BusinessCoverUploadProps) {
  return (
    <div>
      <p className="text-sm font-medium text-[#1e293b] mb-1">
        Cover Photo
      </p>
      <p className="text-xs text-[#64748b] mb-3">
        Appears at the top of your business profile
      </p>
      
      <label className="block cursor-pointer">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
          className="hidden"
        />
        
        {coverUrl ? (
          <div className="relative h-32 rounded-xl overflow-hidden group">
            <img 
              src={coverUrl} 
              alt="Cover" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>
        ) : (
          <div className="h-32 rounded-xl border-2 border-dashed border-[#e2e8f0] bg-[#f8fafc] flex flex-col items-center justify-center hover:border-[#F79E1B] hover:bg-[#FFF7ED] transition-colors">
            {isUploading ? (
              <Loader2 className="w-6 h-6 text-[#F79E1B] animate-spin" />
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/60 flex items-center justify-center mb-2">
                  <Camera className="w-5 h-5 text-[#64748b]" />
                </div>
                <p className="text-sm font-medium text-[#1e293b]">
                  Upload cover photo
                </p>
                <p className="text-xs text-[#94a3b8]">
                  Recommended: 1600×500px • JPG, PNG or WebP
                </p>
              </>
            )}
          </div>
        )}
      </label>
    </div>
  );
}
