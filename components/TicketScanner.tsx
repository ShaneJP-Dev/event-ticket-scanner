"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, Result } from "@zxing/library";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type ValidationStatus = "idle" | "loading" | "valid" | "used" | "invalid" | "error";

export default function TicketScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);
  const [message, setMessage] = useState<string | null>("Point your camera at the QR code");
  const [status, setStatus] = useState<ValidationStatus>("idle");

  useEffect(() => {
    codeReader.current = new BrowserMultiFormatReader();

    const startScan = async () => {
      try {
        await codeReader.current?.decodeFromConstraints(
          { video: { facingMode: "environment" } },
          videoRef.current!,
          async (result: Result | undefined, err) => {
            if (result) {
              codeReader.current?.reset();
              setStatus("loading");
              setMessage(`Validating ticket: ${result.getText()}`);

              try {
                const res = await fetch("/api/validate-ticket", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ code: result.getText() }),
                });
                const data = await res.json();

                if (data.status === "valid") {
                  setStatus("valid");
                  setMessage(`✅ Valid ticket for ${data.ticket.name} ${data.ticket.surname}`);
                } else if (data.status === "already_used") {
                  setStatus("used");
                  setMessage(`⚠️ Ticket already used for ${data.ticket.name} ${data.ticket.surname}`);
                } else {
                  setStatus("invalid");
                  setMessage("❌ Invalid ticket");
                }
              } catch {
                setStatus("error");
                setMessage("❌ Error validating ticket");
              }
            }

            if (err && !(err.name === "NotFoundException")) {
              console.error(err);
            }
          }
        );
      } catch (err: any) {
        console.error("Error accessing camera:", err);
        setMessage(`Error accessing camera: ${err.message || err}`);
        setStatus("error");
      }
    };

    startScan();

    return () => {
      codeReader.current?.reset();
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md">
      <Card className="overflow-hidden w-full">
        <CardContent className="p-0">
          <video ref={videoRef} className="w-full rounded" />
        </CardContent>
      </Card>

      <p className="text-center text-base">{message}</p>

      {(status === "valid" || status === "used" || status === "invalid" || status === "error") && (
        <Button
          onClick={() => {
            setStatus("idle");
            setMessage("Point your camera at the QR code");
            location.reload(); // restart scanning easily
          }}
        >
          Scan Another
        </Button>
      )}
    </div>
  );
}
