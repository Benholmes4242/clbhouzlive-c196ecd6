import React from 'react';

// Test component to debug R2 image loading
const TestR2Images = () => {
  const testUrls = [
    'https://media.clbhouz.co.uk/6a5bcbb9-c22c-4655-ad8e-088b2858ca3e/profile-1755898441717.jpeg',
    'https://media.clbhouz.co.uk/91339e15-1a6a-4a45-8a4b-3d032780e5eb/1750714348561.jpeg'
  ];

  return (
    <div className="p-4 space-y-4 bg-background text-foreground">
      <h2 className="text-lg font-semibold">R2 Image Loading Test</h2>
      
      {testUrls.map((url, index) => (
        <div key={index} className="border p-4 rounded-lg">
          <p className="text-sm mb-2">URL {index + 1}: {url}</p>
          
          {/* Basic img tag */}
          <div className="mb-2">
            <p className="text-xs text-muted-foreground mb-1">Basic img tag:</p>
            <img 
              src={url} 
              alt={`Test ${index + 1}`}
              className="w-32 h-32 object-cover border rounded"
              onLoad={() => console.log(`✅ Basic img loaded: ${url}`)}
              onError={(e) => console.error(`❌ Basic img failed: ${url}`, e)}
            />
          </div>
          
          {/* Test with crossOrigin */}
          <div className="mb-2">
            <p className="text-xs text-muted-foreground mb-1">With crossOrigin="anonymous":</p>
            <img 
              src={url} 
              alt={`Test CORS ${index + 1}`}
              className="w-32 h-32 object-cover border rounded"
              crossOrigin="anonymous"
              onLoad={() => console.log(`✅ CORS img loaded: ${url}`)}
              onError={(e) => console.error(`❌ CORS img failed: ${url}`, e)}
            />
          </div>
          
          {/* Test with different loading strategy */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">With loading="eager":</p>
            <img 
              src={url} 
              alt={`Test eager ${index + 1}`}
              className="w-32 h-32 object-cover border rounded"
              loading="eager"
              onLoad={() => console.log(`✅ Eager img loaded: ${url}`)}
              onError={(e) => console.error(`❌ Eager img failed: ${url}`, e)}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default TestR2Images;