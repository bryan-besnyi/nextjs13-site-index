import React from 'react';
import Image from 'next/image';

// Individual college logo components
export const SMCCCDLogo: React.FC<{ className?: string; width?: number; height?: number }> = ({ 
  className = '', 
  width = 200, 
  height = 200 
}) => (
  <Image
    className={className}
    src="/logo_white.png"
    alt="San Mateo County Community College District Logo"
    width={width}
    height={height}
    priority={false}
  />
);

export const SMCCCDHorizontalLogo: React.FC<{ className?: string; width?: number; height?: number }> = ({ 
  className = '', 
  width = 300, 
  height = 100 
}) => (
  <Image
    className={className}
    src="/horizontal_white_logo.svg"
    alt="San Mateo County Community College District Horizontal Logo"
    width={width}
    height={height}
    priority={false}
  />
);

// Individual college logos - these would use actual college logo files from public/
export const CollegeOfSanMateoLogo: React.FC<{ className?: string; width?: number; height?: number }> = ({ 
  className = '', 
  width = 120, 
  height = 120 
}) => (
  <div className={`${className} w-[${width}px] h-[${height}px] bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center`}>
    <span className="text-white font-bold text-lg">CSM</span>
    {/* Replace with: <Image src="/csm-logo.png" alt="College of San Mateo Logo" width={width} height={height} /> */}
  </div>
);

export const CanadaCollegeLogo: React.FC<{ className?: string; width?: number; height?: number }> = ({ 
  className = '', 
  width = 120, 
  height = 120 
}) => (
  <div className={`${className} w-[${width}px] h-[${height}px] bg-gradient-to-br from-green-600 to-green-800 rounded-full flex items-center justify-center`}>
    <span className="text-white font-bold text-lg">CCC</span>
    {/* Replace with: <Image src="/canada-logo.png" alt="Cañada College Logo" width={width} height={height} /> */}
  </div>
);

export const SkylineCollegeLogo: React.FC<{ className?: string; width?: number; height?: number }> = ({ 
  className = '', 
  width = 120, 
  height = 120 
}) => (
  <div className={`${className} w-[${width}px] h-[${height}px] bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center`}>
    <span className="text-white font-bold text-lg">SC</span>
    {/* Replace with: <Image src="/skyline-logo.png" alt="Skyline College Logo" width={width} height={height} /> */}
  </div>
);

// Artistic background component with floating logos
export const ArtisticLogoBackground: React.FC<{ variant?: 'hero' | 'page' | 'subtle' }> = ({ 
  variant = 'subtle' 
}) => {
  const getOpacity = () => {
    switch (variant) {
      case 'hero': return 'opacity-10';
      case 'page': return 'opacity-5';
      case 'subtle': return 'opacity-3';
      default: return 'opacity-5';
    }
  };

  const getSize = () => {
    switch (variant) {
      case 'hero': return { width: 200, height: 200 };
      case 'page': return { width: 150, height: 150 };
      case 'subtle': return { width: 100, height: 100 };
      default: return { width: 120, height: 120 };
    }
  };

  const size = getSize();
  const opacityClass = getOpacity();

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Main SMCCCD Logo - Center */}
      <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <SMCCCDLogo 
          className={`${opacityClass} animate-pulse`} 
          width={size.width + 50} 
          height={size.height + 50} 
        />
      </div>
      
      {/* College Logos - Scattered artistically */}
      <div className="absolute top-1/3 left-1/4 transform -rotate-12">
        <CollegeOfSanMateoLogo className={opacityClass} {...size} />
      </div>
      
      <div className="absolute top-1/2 right-1/4 transform rotate-12">
        <CanadaCollegeLogo className={opacityClass} {...size} />
      </div>
      
      <div className="absolute bottom-1/3 left-1/3 transform rotate-6">
        <SkylineCollegeLogo className={opacityClass} {...size} />
      </div>
      
      {/* Additional decorative elements */}
      <div className="absolute top-1/4 right-1/3 transform -rotate-6">
        <SMCCCDHorizontalLogo 
          className={`${opacityClass} opacity-50`} 
          width={200} 
          height={60} 
        />
      </div>
    </div>
  );
};

// Simpler background pattern for less prominent areas
export const SubtleLogoPattern: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
    <div className="absolute -top-10 -right-10 transform rotate-45">
      <SMCCCDLogo className="opacity-2" width={300} height={300} />
    </div>
    <div className="absolute -bottom-10 -left-10 transform -rotate-45">
      <SMCCCDHorizontalLogo className="opacity-2" width={400} height={120} />
    </div>
  </div>
);