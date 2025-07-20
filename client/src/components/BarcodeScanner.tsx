import { useState, useRef, useEffect, useCallback } from 'react';
import { BrowserCodeReader, NotFoundException } from '@zxing/library';

interface BarcodeScannerProps {
  onResult: (result: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export const BarcodeScanner = ({ onResult, onClose, isOpen }: BarcodeScannerProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserCodeReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopScanning = useCallback(() => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsLoading(false);
    setError('');
  }, []);

  const startScanning = useCallback(async () => {
    if (!videoRef.current) return;

    setIsLoading(true);
    setError('');

    try {
      codeReaderRef.current = new BrowserCodeReader();
      
      const devices = await codeReaderRef.current.listVideoInputDevices();
      if (devices.length === 0) {
        throw new Error('No se encontraron cámaras disponibles');
      }

      const selectedDeviceId = devices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear')
      )?.deviceId || devices[0].deviceId;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          deviceId: selectedDeviceId,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: { ideal: 'environment' }
        }
      });

      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      setHasPermission(true);

      codeReaderRef.current.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (result, error) => {
          if (result) {
            const scannedText = result.getText();
            
            if (isValidVIN(scannedText)) {
              onResult(scannedText.toUpperCase());
              stopScanning();
              onClose();
            } else {
              setError('El código escaneado no es un VIN válido');
              setTimeout(() => setError(''), 3000);
            }
          }
          
          if (error && !(error instanceof NotFoundException)) {
            console.error('Error de escaneo:', error);
          }
        }
      );

      setIsLoading(false);
    } catch (err: unknown) {
      console.error('Error al iniciar el escáner:', err);
      setIsLoading(false);
      
      const error = err as Error;
      if (error.name === 'NotAllowedError') {
        setError('Permiso de cámara denegado. Por favor permite el acceso a la cámara.');
        setHasPermission(false);
      } else if (error.name === 'NotFoundError') {
        setError('No se encontró una cámara disponible.');
      } else if (error.name === 'NotReadableError') {
        setError('La cámara está siendo usada por otra aplicación.');
      } else {
        setError(error.message || 'Error al acceder a la cámara');
      }
    }
  }, [onResult, onClose, stopScanning]);

  const isValidVIN = (text: string): boolean => {
    const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/i;
    return vinRegex.test(text);
  };

  useEffect(() => {
    if (isOpen) {
      startScanning();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [isOpen, startScanning, stopScanning]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
      <div className="bg-white p-4 shadow-lg">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            Escanear Código VIN
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ✕
          </button>
        </div>
        
        {error && (
          <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {hasPermission === false && (
          <div className="mt-3 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
            <p className="text-yellow-700 text-sm">
              Para usar el escáner, necesitas permitir el acceso a la cámara en tu navegador.
            </p>
          </div>
        )}
      </div>

      <div className="flex-1 relative">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />
        
        {isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-4 rounded-lg flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-700">Iniciando cámara...</span>
            </div>
          </div>
        )}

        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-80 h-20 border-2 border-red-500 rounded-lg relative">
              <div className="absolute -top-8 left-0 text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                Apunte la cámara al código de barras del VIN
              </div>
              
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-red-500"></div>
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-red-500"></div>
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-red-500"></div>
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-red-500"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4">
        <div className="flex justify-center space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </button>
        </div>
        
        <div className="mt-3 text-center">
          <p className="text-sm text-gray-600">
            Mantén el código de barras dentro del recuadro rojo para escanearlo
          </p>
        </div>
      </div>
    </div>
  );
};