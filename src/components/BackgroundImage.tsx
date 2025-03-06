interface BackgroundImageProps {
  image: string;
  overlay?: boolean;
  children: React.ReactNode;
}

export function BackgroundImage({ image, overlay = true, children }: BackgroundImageProps) {
  return (
    <div className="relative">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${image})`,
        }}
      />
      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-b from-deep-space/90 via-deep-space/70 to-deep-space/90" />
      )}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
} 