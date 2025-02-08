import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "wouter";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export function VerifyEmailPage() {
  const [location, navigate] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const token = searchParams.get("token");

        if (!token) {
          setStatus("error");
          setMessage("Invalid verification link");
          return;
        }

        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to verify email");
        }

        setStatus("success");
        setMessage("Email verified successfully!");

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate("/login", { 
            state: { message: "Email verified successfully. You can now log in." }
          });
        }, 3000);
      } catch (error) {
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Failed to verify email");
      }
    };

    verifyEmail();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {status === "loading" && (
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <h2 className="mt-4 text-center text-2xl font-bold">
              Verifying your email...
            </h2>
          </div>
        )}

        {status === "success" && (
          <Alert>
            <AlertTitle>Success!</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
            <div className="flex justify-center">
              <Button onClick={() => navigate("/login")}>
                Return to Login
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
