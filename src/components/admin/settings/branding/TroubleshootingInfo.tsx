
import React from 'react';

const TroubleshootingInfo = () => {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
      <div className="text-sm text-gray-700">
        <strong>Troubleshooting Tips:</strong>
        <ul className="mt-1 list-disc list-inside space-y-1">
          <li>Clear your browser cache and hard refresh (Ctrl+F5)</li>
          <li>Try opening your site in an incognito/private window</li>
          <li>Favicons can take 5-10 minutes to update due to browser caching</li>
          <li>Ensure your favicon URL is publicly accessible</li>
        </ul>
      </div>
    </div>
  );
};

export default TroubleshootingInfo;
