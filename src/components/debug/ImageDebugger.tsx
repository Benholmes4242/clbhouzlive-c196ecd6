import React, { useState, useEffect } from 'react';

const ImageDebugger: React.FC = () => {
  const [testResults, setTestResults] = useState<any[]>([]);

  // Test URLs from the console logs
  const testUrls = [
    'https://media.clbhouz.co.uk/6a5bcbb9-c22c-4655-ad8e-088b2858ca3e/1751820340803-0-umu5n7jnj4m.jpeg',
    'https://media.clbhouz.co.uk/6a5bcbb9-c22c-4655-ad8e-088b2858ca3e/1750428376824.png',
    'https://media.clbhouz.co.uk/6a5bcbb9-c22c-4655-ad8e-088b2858ca3e/1750426200312.jpeg'
  ];

  const testImageLoad = async (url: string, index: number) => {
    const startTime = Date.now();
    console.log(`🧪 Testing image ${index + 1}: ${url}`);
    
    try {
      // Test 1: Fetch request
      const fetchStart = Date.now();
      const response = await fetch(url, { method: 'HEAD' });
      const fetchTime = Date.now() - fetchStart;
      console.log(`📡 Fetch response for image ${index + 1}:`, {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        time: fetchTime + 'ms'
      });

      // Test 2: Image load
      const imgStart = Date.now();
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      const imagePromise = new Promise((resolve, reject) => {
        img.onload = () => {
          const imgTime = Date.now() - imgStart;
          console.log(`🖼️ Image ${index + 1} loaded successfully:`, {
            width: img.naturalWidth,
            height: img.naturalHeight,
            time: imgTime + 'ms'
          });
          resolve({ success: true, width: img.naturalWidth, height: img.naturalHeight, time: imgTime });
        };
        
        img.onerror = (error) => {
          const imgTime = Date.now() - imgStart;
          console.error(`❌ Image ${index + 1} failed to load:`, error, `Time: ${imgTime}ms`);
          reject({ success: false, error: error.toString(), time: imgTime });
        };
      });

      img.src = url;
      const imageResult = await imagePromise;

      const totalTime = Date.now() - startTime;
      const result = {
        url,
        index: index + 1,
        fetch: { status: response.status, time: fetchTime },
        image: imageResult,
        totalTime
      };

      setTestResults(prev => [...prev, result]);
      return result;

    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(`💥 Complete failure for image ${index + 1}:`, error);
      const result = {
        url,
        index: index + 1,
        fetch: { error: error.toString() },
        image: { success: false, error: error.toString() },
        totalTime
      };
      setTestResults(prev => [...prev, result]);
      return result;
    }
  };

  useEffect(() => {
    console.log('🚀 Starting image loading debug tests...');
    setTestResults([]);
    
    // Test all images
    testUrls.forEach((url, index) => {
      testImageLoad(url, index);
    });
  }, []);

  return (
    <div className="p-4 bg-yellow-100 border border-yellow-400 rounded-lg m-4">
      <h3 className="font-bold text-lg mb-4">🧪 Image Loading Debug Tests</h3>
      
      <div className="space-y-4">
        {testResults.map((result, index) => (
          <div key={index} className="p-3 bg-white rounded border">
            <h4 className="font-semibold">Test {result.index}</h4>
            <p className="text-xs text-gray-600 mb-2">{result.url}</p>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>Fetch:</strong>
                {result.fetch.status ? (
                  <span className="text-green-600"> ✅ {result.fetch.status} ({result.fetch.time}ms)</span>
                ) : (
                  <span className="text-red-600"> ❌ {result.fetch.error}</span>
                )}
              </div>
              
              <div>
                <strong>Image Load:</strong>
                {result.image.success ? (
                  <span className="text-green-600"> ✅ {result.image.width}x{result.image.height} ({result.image.time}ms)</span>
                ) : (
                  <span className="text-red-600"> ❌ {result.image.error}</span>
                )}
              </div>
            </div>
            
            <div className="mt-2">
              <strong>Total Time:</strong> {result.totalTime}ms
            </div>

            {/* Try to actually display the image */}
            <div className="mt-2">
              <strong>Actual Display Test:</strong>
              <img 
                src={result.url} 
                alt={`Test ${result.index}`}
                className="w-20 h-20 object-cover border mt-1"
                onLoad={() => console.log(`✅ Display test ${result.index} SUCCESS`)}
                onError={(e) => console.error(`❌ Display test ${result.index} FAILED:`, e)}
              />
            </div>
          </div>
        ))}
      </div>
      
      {testResults.length === 0 && (
        <p className="text-gray-600">Running tests... Check console for detailed logs.</p>
      )}
    </div>
  );
};

export default ImageDebugger;