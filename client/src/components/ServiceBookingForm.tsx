import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { usePayment } from "../hooks/use-payment";
import type { Service } from "@db/schema";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Check } from "lucide-react";

const bookingSchema = z.object({
  serviceId: z.number(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().nullable(),
  totalPrice: z.number().positive("Price must be positive"),
  status: z.enum(["pending", "confirmed", "cancelled"]),
  notes: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface ServiceBookingFormProps {
  service: Service;
  onSuccess: () => void;
}

interface BookingResponse {
  booking: {
    id: number;
    [key: string]: unknown;
  };
  clientSecret: string;
}

interface PaymentError extends Error {
  message: string;
}

export default function ServiceBookingForm({ service, onSuccess }: ServiceBookingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  const { processPayment } = usePayment();

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      serviceId: service.id,
      startDate: "",
      endDate: null,
      totalPrice: Number(service.price) || 0,
      status: "pending",
      notes: "",
    },
  });

  const handlePaymentConfirmation = async (bookingId: number, paymentIntentId: string) => {
    const confirmResponse = await fetch("/api/payments/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId,
        paymentIntentId,
      }),
      credentials: "include",
    });

    if (!confirmResponse.ok) {
      throw new Error(await confirmResponse.text());
    }

    return confirmResponse.json();
  };

  const onSubmit = async (data: BookingFormData) => {
    try {
      setIsSubmitting(true);

      // Create booking
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          totalPrice: Number(service.price) || 0,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const { booking, clientSecret } = (await response.json()) as BookingResponse;

      // Process payment
      try {
        await processPayment(clientSecret);
        const paymentIntentId = clientSecret.split("_secret_")[0];
        
        if (!paymentIntentId) {
          throw new Error("Invalid payment intent ID");
        }

        await handlePaymentConfirmation(booking.id, paymentIntentId);

        setIsSuccess(true);
        setTimeout(onSuccess, 2000); // Show success state for 2 seconds before closing

        toast({
          title: "Success",
          description: "Booking confirmed and payment processed successfully!",
        });
      } catch (error) {
        const paymentError = error as PaymentError;
        console.error("Payment processing error:", paymentError);
        throw new Error(`Payment failed: ${paymentError.message}`);
      }
    } catch (error) {
      const bookingError = error as Error;
      console.error("Booking error:", bookingError);
      toast({
        variant: "destructive",
        title: "Error",
        description: bookingError.message ?? "Failed to process booking and payment",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const startDate = form.watch("startDate");

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="startDate">Start Date</Label>
        <Input
          id="startDate"
          type="date"
          {...form.register("startDate")}
          min={today}
          aria-describedby="startDateHelp"
          disabled={isSubmitting || isSuccess}
        />
        <p id="startDateHelp" className="text-sm text-muted-foreground">
          Select when you want the service to start
        </p>
        {form.formState.errors.startDate && (
          <p className="text-sm text-destructive">
            {form.formState.errors.startDate.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="endDate">End Date (Optional)</Label>
        <Input
          id="endDate"
          type="date"
          {...form.register("endDate")}
          min={startDate || today}
          aria-describedby="endDateHelp"
          disabled={isSubmitting || isSuccess || !startDate}
        />
        <p id="endDateHelp" className="text-sm text-muted-foreground">
          Select an end date for multi-day services
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Special Requests (Optional)</Label>
        <Input
          id="notes"
          {...form.register("notes")}
          placeholder="Any special requirements..."
          aria-describedby="notesHelp"
          disabled={isSubmitting || isSuccess}
        />
        <p id="notesHelp" className="text-sm text-muted-foreground">
          Add any specific requirements or notes for the service provider
        </p>
      </div>

      <div className="pt-4">
        <div className="mb-4 p-4 bg-muted rounded-lg">
          <h4 className="font-semibold mb-2">Payment Summary</h4>
          <p className="text-sm text-muted-foreground">
            Service Price: ${(Number(service.price) || 0).toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            You will be charged immediately upon booking
          </p>
        </div>
        <Button 
          type="submit" 
          className="w-full" 
          disabled={isSubmitting || isSuccess || !form.formState.isValid}
        >
          {isSuccess ? (
            <div className="flex items-center justify-center">
              <Check className="mr-2 h-4 w-4" />
              Booking Confirmed!
            </div>
          ) : isSubmitting ? (
            <div className="flex items-center justify-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing Payment...
            </div>
          ) : (
            "Book and Pay Now"
          )}
        </Button>
      </div>
    </form>
  );
}