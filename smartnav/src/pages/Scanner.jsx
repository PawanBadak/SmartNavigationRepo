import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

const translations = {
  en: {
    scanning: "📡 Scanning...",
    ready: "📸 Ready to scan QR",
    orScan: "Or scan from image:",
    orEnter: "Or enter monument ID manually:",
    go: "Go"
  },
  hi: {
    scanning: "📡 स्कैन हो रहा है...",
    ready: "📸 QR स्कैन के लिए तैयार",
    orScan: "या छवि से स्कैन करें:",
    orEnter: "या स्मारक आईडी मैन्युअली दर्ज करें:",
    go: "जाओ"
  },
  mr: {
    scanning: "📡 स्कॅनिंग...",
    ready: "📸 QR स्कॅनसाठी तयार",
    orScan: "किंवा प्रतिमेतून स्कॅन करा:",
    orEnter: "किंवा स्मारक आयडी मॅन्युअली प्रविष्ट करा:",
    go: "जा"
  }
};

const ScannerPage = ({ onScanMatch, language = "en" }) => {
  const [manualInput, setManualInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);

  // 🎥 Start Camera Scanner
useEffect(() => {
  const scanner = new Html5Qrcode("reader");
  scannerRef.current = scanner;

  let isScannerRunning = false;

  Html5Qrcode.getCameras()
    .then((devices) => {
      if (devices && devices.length) {
        setScanning(true);

        scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 250 },
          (decodedText) => {
            console.log("Scanned:", decodedText);

            if (isScannerRunning) {
              scanner.stop().catch(() => {});
              isScannerRunning = false;
            }

            setScanning(false);
            onScanMatch(decodedText);
          },
          () => {}
        );

        isScannerRunning = true;
      }
    })
    .catch((err) => {
      console.error("Camera error:", err);
    });

  return () => {
    if (scanner && isScannerRunning) {
      scanner.stop().catch(() => {});
      isScannerRunning = false;
    }
  };
}, [onScanMatch]);
  // 📁 Scan from Image File
  const handleFileScan = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const html5QrCode = new Html5Qrcode("reader");

    try {
      const result = await html5QrCode.scanFile(file, true);
      console.log("Scanned from file:", result);
      onScanMatch(result);
    } catch (err) {
      console.error("Scan failed:", err);
      alert("Failed to scan QR from image ❌");
    }
  };

  // ⌨️ Manual Input
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onScanMatch(manualInput.trim());
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-8">

      {/* 📷 Camera Scanner */}
      <div className="w-80 h-80 mb-6 rounded-3xl overflow-hidden border-2 border-lime-400">
        <div id="reader" className="w-full h-full" />
      </div>

      {/* Status */}
      <p className="text-white mb-4">
        {scanning ? translations[language].scanning : translations[language].ready}
      </p>

      {/* 📁 File Upload */}
      <div className="mb-6">
        <p className="text-slate-400 text-center mb-2">
          {translations[language].orScan}
        </p>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileScan}
          className="text-white"
        />
      </div>

      {/* ⌨️ Manual Input */}
      <div className="w-full max-w-md">
        <p className="text-slate-400 text-center mb-4">
          {translations[language].orEnter}
        </p>
        <form onSubmit={handleManualSubmit} className="flex gap-3">
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="e.g., ajanta-cave-1"
            className="flex-1 px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-lime-400"
          />
          <button
            type="submit"
            className="px-6 py-4 bg-lime-400 text-black rounded-xl font-bold hover:bg-lime-300 transition"
          >
            {translations[language].go}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ScannerPage;