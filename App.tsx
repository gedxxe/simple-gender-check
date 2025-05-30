
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ImageData, GenderResult } from './types';
import { detectGenderFromImage } from './services/geminiService';
import Spinner from './components/Spinner';
import Alert from './components/Alert';
import { CameraIcon, UploadIcon, SparklesIcon, XCircleIcon } from './components/icons';

const App: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [genderResult, setGenderResult] = useState<GenderResult>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isCameraMode, setIsCameraMode] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Clean up object URLs
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const resetState = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setGenderResult(null);
    setError(null);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraMode(false);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    resetState();
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Invalid file type. Please upload an image (JPEG, PNG, WEBP, GIF, HEIC, HEIF).');
        return;
      }
      // Max file size 4MB for Gemini API (inline data)
      if (file.size > 4 * 1024 * 1024) {
          setError('Image too large. Maximum size is 4MB.');
          return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64WithPrefix = reader.result as string;
        const base64Data = base64WithPrefix.split(',')[1];
        setSelectedImage({ base64: base64Data, mimeType: file.type, name: file.name });
        setPreviewUrl(URL.createObjectURL(file));
      };
      reader.onerror = () => {
        setError("Failed to read file.");
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = useCallback(async () => {
    resetState();
    setIsCameraMode(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access camera. Please ensure permissions are granted.");
      setIsCameraMode(false);
    }
  }, []);

  const captureImage = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg'); // Gemini prefers JPEG or PNG
        const base64Data = dataUrl.split(',')[1];
        
        setSelectedImage({ base64: base64Data, mimeType: 'image/jpeg' });
        setPreviewUrl(dataUrl);

        // Stop camera stream
        const stream = video.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
        setIsCameraMode(false); // Exit camera mode after capture
      }
    }
  }, []);
  
  const handleDetectGender = async () => {
    if (!selectedImage) {
      setError("Please select an image first.");
      return;
    }
    if (!process.env.API_KEY) {
        setError("API Key is not configured. Please check application setup.");
        return;
    }

    setIsLoading(true);
    setGenderResult(null);
    setError(null);

    const result = await detectGenderFromImage(selectedImage);
    
    if (result === "Error") {
      setError("Failed to detect gender. The API might be unavailable or an error occurred. Check console for details.");
    } else {
      setGenderResult(result);
    }
    setIsLoading(false);
  };
  
  const getResultStyling = () => {
    switch (genderResult) {
      case "Male":
        return "text-blue-600 bg-blue-100 border-blue-500";
      case "Female":
        return "text-pink-600 bg-pink-100 border-pink-500";
      case "Indeterminate":
        return "text-purple-600 bg-purple-100 border-purple-500";
      case "NoFaceDetected":
        return "text-gray-600 bg-gray-100 border-gray-500";
      default:
        return "text-slate-700 bg-slate-100";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-500 to-indigo-600 flex flex-col items-center justify-center p-4 selection:bg-accent selection:text-white">
      <div className="w-full max-w-2xl bg-white shadow-2xl rounded-xl p-6 md:p-8 space-y-6 animate-fade-in">
        <header className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-primary-dark flex items-center justify-center">
            <SparklesIcon className="w-8 h-8 mr-2 text-accent" />
            Face Gender Detector AI
          </h1>
          <p className="text-slate-600 mt-2">Upload an image or use your camera to detect perceived gender.</p>
        </header>

        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isCameraMode}
              className="w-full flex items-center justify-center px-6 py-3 border-2 border-dashed border-primary hover:border-primary-dark text-primary-dark font-semibold rounded-lg transition-all duration-150 ease-in-out hover:bg-sky-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UploadIcon className="w-5 h-5 mr-2" /> Upload Image
            </button>
            <input type="file" accept="image/png, image/jpeg, image/webp, image/gif, image/heic, image/heif" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
            
            <button
              type="button"
              onClick={isCameraMode ? captureImage : startCamera}
              disabled={isLoading && !isCameraMode}
              className={`w-full flex items-center justify-center px-6 py-3 text-white font-semibold rounded-lg shadow-md transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2
                ${isCameraMode ? 'bg-red-500 hover:bg-red-600 focus:ring-red-400' : 'bg-secondary hover:bg-indigo-600 focus:ring-indigo-400'}
                disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <CameraIcon className="w-5 h-5 mr-2" /> {isCameraMode ? (isLoading ? 'Capturing...' : 'Capture Photo') : 'Use Camera'}
            </button>
          </div>
           {isCameraMode && !previewUrl && (
            <div className="bg-slate-200 rounded-lg overflow-hidden shadow-inner aspect-video animate-fade-in">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
              <canvas ref={canvasRef} className="hidden"></canvas>
            </div>
          )}
        </div>

        {previewUrl && (
          <div className="mt-6 space-y-4 animate-slide-in-bottom">
            <h2 className="text-xl font-semibold text-slate-700">Image Preview:</h2>
            <div className="bg-slate-100 p-2 rounded-lg shadow-inner flex justify-center items-center">
              <img src={previewUrl} alt={selectedImage?.name || "Preview"} className="max-w-full max-h-96 rounded-md object-contain" />
            </div>
          </div>
        )}
        
        {selectedImage && previewUrl && !isCameraMode && (
          <div className="mt-6 text-center">
            <button
              onClick={handleDetectGender}
              disabled={isLoading || !selectedImage}
              className="w-full md:w-auto bg-accent hover:bg-pink-600 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? <Spinner className="mr-2" /> : <SparklesIcon className="w-5 h-5 mr-2" />}
              {isLoading ? 'Detecting...' : 'Detect Gender'}
            </button>
          </div>
        )}

        {genderResult && genderResult !== "Error" && (
          <div className={`mt-6 p-6 rounded-lg border-2 shadow-lg text-center animate-slide-in-bottom ${getResultStyling()}`}>
            <h3 className="text-2xl font-semibold mb-1">Detection Result:</h3>
            <p className="text-4xl font-bold">{genderResult}</p>
            {genderResult === "NoFaceDetected" && <p className="text-sm mt-1">The AI could not clearly identify a face in the image.</p>}
          </div>
        )}
        
        {(selectedImage || isCameraMode) && (
          <div className="mt-4 text-center">
            <button
              onClick={() => {
                resetState();
                if (fileInputRef.current) fileInputRef.current.value = ""; // Clear file input
              }}
              disabled={isLoading && isCameraMode}
              className="text-sm text-slate-500 hover:text-slate-700 flex items-center justify-center mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XCircleIcon className="w-4 h-4 mr-1" /> Clear / Reset
            </button>
          </div>
        )}
      </div>
      <footer className="text-center mt-8 text-slate-300 text-sm">
        <p>&copy; {new Date().getFullYear()} AI Gender Detector. Powered by Google Gemini.</p>
        <p className="text-xs mt-1">Note: Gender detection is based on perceived visual cues and may not reflect an individual's identity. This tool is for demonstration purposes.</p>
      </footer>
    </div>
  );
};

export default App;
