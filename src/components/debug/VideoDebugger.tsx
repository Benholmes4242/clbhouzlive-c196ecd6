import React, { useRef, useState } from 'react';

interface VideoDebuggerProps {
  src: string;
  videoId: string;
}

const VideoDebugger: React.FC<VideoDebuggerProps> = ({ src, videoId }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [videoInfo, setVideoInfo] = useState<any>({});

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `${timestamp}: ${message}`]);
  };

  const testVideo = async () => {
    const video = videoRef.current;
    if (!video) return;

    addLog('Starting video test...');
    
    try {
      addLog(`Video source: ${src}`);
      addLog(`Video ready state: ${video.readyState}`);
      addLog(`Video network state: ${video.networkState}`);
      
      // Test basic video properties
      video.addEventListener('loadstart', () => addLog('Load started'));
      video.addEventListener('loadedmetadata', () => {
        addLog(`Metadata loaded - Duration: ${video.duration}s, Dimensions: ${video.videoWidth}x${video.videoHeight}`);
        setVideoInfo({
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          canPlayType: {
            mp4: video.canPlayType('video/mp4'),
            mov: video.canPlayType('video/quicktime'),
            webm: video.canPlayType('video/webm')
          }
        });
      });
      video.addEventListener('canplay', () => addLog('Can play'));
      video.addEventListener('canplaythrough', () => addLog('Can play through'));
      video.addEventListener('error', (e) => {
        const error = video.error;
        addLog(`Video error: ${error?.code} - ${error?.message}`);
      });
      video.addEventListener('play', () => addLog('Video started playing'));
      video.addEventListener('pause', () => addLog('Video paused'));

      // Try to load the video
      video.load();
      
      // Try to play after a short delay
      setTimeout(async () => {
        try {
          await video.play();
          addLog('Play successful');
        } catch (error) {
          addLog(`Play failed: ${error}`);
        }
      }, 1000);
    } catch (error) {
      addLog(`Test failed: ${error}`);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 max-w-2xl">
      <h3 className="text-lg font-semibold mb-4">Video Debugger - {videoId}</h3>
      
      <div className="mb-4">
        <video
          ref={videoRef}
          src={src}
          className="w-full max-w-md"
          controls
          muted
          playsInline
          crossOrigin="anonymous"
        />
      </div>
      
      <button 
        onClick={testVideo}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Test Video
      </button>
      
      {Object.keys(videoInfo).length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900 rounded">
          <h4 className="font-semibold mb-2">Video Info:</h4>
          <pre className="text-sm">{JSON.stringify(videoInfo, null, 2)}</pre>
        </div>
      )}
      
      <div className="max-h-60 overflow-y-auto bg-black text-green-400 p-3 rounded font-mono text-sm">
        <h4 className="text-white mb-2">Debug Logs:</h4>
        {logs.map((log, index) => (
          <div key={index}>{log}</div>
        ))}
        {logs.length === 0 && <div className="text-gray-500">Click "Test Video" to start debugging...</div>}
      </div>
    </div>
  );
};

export default VideoDebugger;