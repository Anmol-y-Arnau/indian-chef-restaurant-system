import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import { Button } from "./ui/button";
import { Download, X } from "lucide-react";

interface QRCodeModalProps {
  open: boolean;
  onClose: () => void;
  pdfUrl: string;
  ticketNumber: number;
  tableName: string;
}

export function QRCodeModal({ open, onClose, pdfUrl, ticketNumber, tableName }: QRCodeModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Add small delay to ensure canvas is mounted
    const timer = setTimeout(() => {
      if (open && canvasRef.current && pdfUrl) {
        console.log('Generating QR for URL:', pdfUrl);
        // Generate QR code
        QRCode.toCanvas(canvasRef.current, pdfUrl, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
          errorCorrectionLevel: 'M',
        }).then(() => {
          console.log('QR code generated successfully');
        }).catch((err) => {
          console.error('Error generating QR code:', err);
        });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [open, pdfUrl]);

  const handleDownload = () => {
    window.open(pdfUrl, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-heading gradient-text">
            Ticket Electrónico
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          {/* Ticket Info */}
          <div className="text-center space-y-1">
            <p className="text-sm text-muted-foreground">Ticket Nº</p>
            <p className="text-3xl font-bold gradient-text">{ticketNumber}</p>
            <p className="text-sm text-muted-foreground">{tableName}</p>
          </div>

          {/* QR Code */}
          <div className="bg-white p-4 rounded-xl shadow-lg">
            <canvas ref={canvasRef} />
          </div>

          {/* Instructions */}
          <div className="text-center space-y-2 px-4">
            <p className="text-sm font-medium">Escanea el código QR</p>
            <p className="text-xs text-muted-foreground">
              El cliente puede escanear este código con su móvil para descargar el ticket en PDF
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleDownload}
            >
              <Download className="w-4 h-4 mr-2" />
              Descargar PDF
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
