import React, { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Briefing } from '../types';

interface BriefingDisplayProps {
  briefing: Briefing;
}

export const BriefingDisplay: React.FC<BriefingDisplayProps> = ({ briefing }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!briefing.imageUrl) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const img = new Image();
    img.crossOrigin = 'Anonymous'; // Required to load images from another domain onto canvas

    img.onload = () => {
      // Define the pixel amount to crop from the bottom to remove the watermark
      const CROP_PIXELS = 85;
      const sourceWidth = img.naturalWidth;
      const sourceHeight = img.naturalHeight - CROP_PIXELS;

      if (sourceHeight <= 0) {
        console.error("Image height is too small to crop.");
        return;
      }

      const parent = canvas.parentElement;
      if (!parent) return;

      // Set canvas dimensions to match its container for high-res display
      const targetWidth = parent.clientWidth;
      const targetHeight = parent.clientHeight;
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // This logic replicates the 'object-cover' CSS property for canvas
      const sourceAspectRatio = sourceWidth / sourceHeight;
      const targetAspectRatio = targetWidth / targetHeight;

      let drawnWidth = targetWidth;
      let drawnHeight = targetHeight;
      let dx = 0;
      let dy = 0;

      // Determine how to scale the image to cover the canvas while maintaining aspect ratio
      if (sourceAspectRatio > targetAspectRatio) {
        // Image is wider than the container, so scale by height and center horizontally
        drawnHeight = targetHeight;
        drawnWidth = drawnHeight * sourceAspectRatio;
        dx = (targetWidth - drawnWidth) / 2;
      } else {
        // Image is taller than the container, so scale by width and center vertically
        drawnWidth = targetWidth;
        drawnHeight = drawnWidth / sourceAspectRatio;
        dy = (targetHeight - drawnHeight) / 2;
      }
      
      // Draw the cropped image onto the canvas, centered and scaled to cover
      ctx.clearRect(0, 0, targetWidth, targetHeight);
      ctx.drawImage(
        img,
        0, // sourceX: Start from the top-left of the original image
        0, // sourceY
        sourceWidth, // sourceWidth: Use the full width of the original
        sourceHeight, // sourceHeight: Use the height MINUS the crop amount
        dx, // destinationX: Draw with potential horizontal offset for centering
        dy, // destinationY: Draw with potential vertical offset for centering
        drawnWidth, // destinationWidth: Scaled width to cover the container
        drawnHeight // destinationHeight: Scaled height to cover the container
      );
    };

    img.onerror = () => {
      console.error('Failed to load image for cropping:', briefing.imageUrl);
      // Fallback: display a simple background if the image fails to load
      ctx.fillStyle = '#374151'; // bg-gray-700
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '16px sans-serif';
      ctx.fillText('Image could not be loaded', canvas.width / 2, canvas.height / 2);
    };

    img.src = briefing.imageUrl;

  }, [briefing.imageUrl]);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(briefing.text).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2500); // Reset after 2.5 seconds
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
  };

  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden shadow-2xl border border-gray-700">
      <div className="w-full h-64 sm:h-80 md:h-96 bg-gray-700">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          aria-label="AI Generated Sports Briefing Visual"
        />
      </div>
      <div className="p-6 md:p-8">
        <h2 className="text-2xl md:text-3xl font-bold mb-4 text-teal-300">Your Daily Briefing</h2>
        <div 
            className="prose prose-invert max-w-none 
            prose-p:leading-relaxed prose-p:text-gray-300
            prose-headings:font-semibold prose-headings:text-gray-100 prose-headings:mt-8 prose-headings:mb-4
            prose-h2:text-2xl 
            prose-h3:text-xl
            prose-strong:text-white
            prose-a:text-sky-400 hover:prose-a:underline
            prose-ul:pl-6 prose-li:marker:text-gray-500
            prose-ol:pl-6 prose-li:marker:text-gray-500
            prose-blockquote:border-l-4 prose-blockquote:border-gray-700 prose-blockquote:pl-4 prose-blockquote:text-gray-400
            prose-pre:bg-black/60 prose-pre:p-4 prose-pre:rounded-lg
            prose-code:bg-gray-700/50 prose-code:px-1.5 prose-code:py-1 prose-code:rounded-md prose-code:font-mono prose-code:text-yellow-300
            prose-code:before:content-[''] prose-code:after:content-['']"
        >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{briefing.text}</ReactMarkdown>
        </div>
        
        <div className="mt-6 text-right">
          <button
            onClick={handleCopy}
            disabled={isCopied}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-teal-500 disabled:bg-teal-700 disabled:text-white"
            aria-live="polite"
          >
            {isCopied ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Copié!
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copier dans le presse-papiers
              </>
            )}
          </button>
        </div>

        {briefing.sources && briefing.sources.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-700">
            <h3 className="text-lg font-semibold text-gray-400 mb-4">Search Result Previews:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {briefing.sources.map((source, index) => (
                <a
                  key={index}
                  href={source.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-gray-700/50 p-4 rounded-lg border border-gray-600 hover:bg-gray-700 hover:border-sky-500 transition-all duration-200 group"
                  aria-label={`Read more about ${source.title}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500 group-hover:text-sky-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <div className="flex-grow overflow-hidden">
                      <p className="font-semibold text-sky-400 truncate group-hover:text-sky-300 transition-colors">
                        {source.title || 'Untitled Source'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {source.uri}
                      </p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};