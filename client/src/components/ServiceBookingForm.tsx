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
        const paymentResult = await processPayment(clientSecret);
        
        // Confirm payment
        await handlePaymentConfirmation(booking.id, paymentResult.paymentIntentId!);
        
        setIsSuccess(true);
        onSuccess();
        toast({
          title: "Success",
          description: "Service booked successfully!",
        });
      } catch (error) {
        console.error("Payment failed:", error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Payment failed",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Booking failed:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create booking",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="startDate">Start Date</Label>
        <Input
          type="datetime-local"
          id="startDate"
          {...form.register("startDate")}
          className="w-full"
        />
        {form.formState.errors.startDate && (
          <p className="text-sm text-destructive">
            {form.formState.errors.startDate.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Input
          type="text"
          id="notes"
          {...form.register("notes")}
          placeholder="Any special requests?"
          className="w-full"
        />
      </div>

      <div className="flex items-center justify-between pt-4 border-t">
        <div>
          <p className="text-sm text-muted-foreground">Total Price</p>
          <p className="text-lg font-semibold">${Number(service.price).toFixed(2)}</p>
        </div>

        <Button 
          type="submit" 
          disabled={isSubmitting || isSuccess}
          className="min-w-[120px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : isSuccess ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Booked!
            </>
          ) : (
            "Book Now"
          )}
        </Button>
      </div>
    </form>
  );
}