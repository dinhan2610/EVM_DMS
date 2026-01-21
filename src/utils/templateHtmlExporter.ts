/**
 * Template HTML Exporter
 * Export template preview to self-contained HTML with placeholders
 */

/**
 * Convert image URL to base64 data URL
 */
const imageToBase64 = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
};

/**
 * Extract all inline styles from computed styles
 */
const extractComputedStyles = (element: HTMLElement): string => {
  const computedStyle = window.getComputedStyle(element);
  let styleString = '';
  
  // Important CSS properties to preserve
  const importantProps = [
    'display', 'position', 'top', 'left', 'right', 'bottom',
    'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
    'margin', 'padding', 'border', 'border-radius',
    'font-family', 'font-size', 'font-weight', 'font-style',
    'color', 'background', 'background-color', 'background-image', 'background-size', 'background-position',
    'text-align', 'line-height', 'letter-spacing',
    'flex', 'flex-direction', 'flex-wrap', 'justify-content', 'align-items', 'gap',
    'grid', 'grid-template-columns', 'grid-gap',
    'overflow', 'z-index', 'opacity', 'transform',
    'box-shadow', 'box-sizing'
  ];
  
  importantProps.forEach(prop => {
    const value = computedStyle.getPropertyValue(prop);
    if (value && value !== 'none' && value !== 'normal') {
      styleString += `${prop}: ${value}; `;
    }
  });
  
  return styleString;
};

/**
 * Inline all styles recursively
 */
const inlineAllStyles = (element: HTMLElement): void => {
  // Inline styles for current element
  const styles = extractComputedStyles(element);
  if (styles) {
    element.setAttribute('style', styles);
  }
  
  // Process children
  Array.from(element.children).forEach(child => {
    if (child instanceof HTMLElement) {
      inlineAllStyles(child);
    }
  });
};

/**
 * Export template preview to self-contained HTML
 * This HTML can be saved to backend and used to generate invoices
 */
export const exportTemplateToHTML = async (previewElement: HTMLElement): Promise<string> => {
  try {
    // 1. Find invoice page element
    const invoiceElement = previewElement.querySelector('[data-invoice-page]') as HTMLElement;
    if (!invoiceElement) {
      throw new Error('Invoice preview element not found');
    }
    
    // 2. Clone the element to avoid affecting the DOM
    const clone = invoiceElement.cloneNode(true) as HTMLElement;
    
    // 3. Remove draft watermark if exists
    const watermark = clone.querySelector('[data-watermark]');
    watermark?.remove();
    
    // 4. Convert logo to base64
    const logoImg = clone.querySelector('img[alt="Company Logo"]') as HTMLImageElement;
    if (logoImg && logoImg.src) {
      try {
        const base64Logo = await imageToBase64(logoImg.src);
        logoImg.src = base64Logo;
      } catch (error) {
        console.warn('Could not convert logo to base64:', error);
      }
    }
    
    // 5. Convert background frame to base64
    const bgImageMatch = clone.style.backgroundImage.match(/url\(['"]?(.+?)['"]?\)/);
    if (bgImageMatch && bgImageMatch[1]) {
      try {
        const bgUrl = bgImageMatch[1].startsWith('http') 
          ? bgImageMatch[1] 
          : window.location.origin + bgImageMatch[1];
        const base64Bg = await imageToBase64(bgUrl);
        clone.style.backgroundImage = `url(${base64Bg})`;
      } catch (error) {
        console.warn('Could not convert background to base64:', error);
      }
    }
    
    // 6. Inline all computed styles
    inlineAllStyles(clone);
    
    // 7. Generate complete HTML document
    const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice Template</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      @page {
        size: A4;
        margin: 0;
      }
    }
  </style>
</head>
<body>
  ${clone.outerHTML}
</body>
</html>`;
    
    return html;
  } catch (error) {
    console.error('Error exporting template to HTML:', error);
    throw error;
  }
};

/**
 * Get template HTML as Blob for download
 */
export const downloadTemplateHTML = async (previewElement: HTMLElement, filename: string = 'template.html'): Promise<void> => {
  const html = await exportTemplateToHTML(previewElement);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  
  URL.revokeObjectURL(url);
};
