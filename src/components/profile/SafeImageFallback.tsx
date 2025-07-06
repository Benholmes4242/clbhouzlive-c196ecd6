import React from 'react';

export const createSafeImagePlaceholder = (container: HTMLElement) => {
  if (container.querySelector('.image-placeholder')) return;
  
  container.classList.add('flex', 'items-center', 'justify-center', 'bg-gray-50');
  
  // Create safe placeholder using DOM manipulation
  const placeholder = document.createElement('div');
  placeholder.className = 'flex flex-col items-center justify-center text-gray-400 image-placeholder';
  
  // Create SVG element safely
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'w-6 h-6 mb-1');
  svg.setAttribute('fill', 'currentColor');
  svg.setAttribute('viewBox', '0 0 24 24');
  
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z');
  
  svg.appendChild(path);
  
  const span = document.createElement('span');
  span.className = 'text-xs';
  span.textContent = 'Image';
  
  placeholder.appendChild(svg);
  placeholder.appendChild(span);
  container.appendChild(placeholder);
};