import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { usePayment } from "../hooks/use-payment";
import type { Service, InsertBooking } from "@db/schema";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";

const bookingSchema = z.object({
  serviceId: z.number(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().nullable(),
  totalPrice: z.number(),
  status: z.string(),
  notes: z.string().optional(),
});

interface ServiceBookingFormProps {
  service: Service;
  onSuccess: () => void;
}

export default function ServiceBookingForm({ service, onSuccess }: ServiceBookingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { processPayment } = usePayment();

  const form = useForm<z.infer<typeof bookingSchema>>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      serviceId: service.id,
      startDate: "",
      endDate: null,
      totalPrice: Number(service.price),
      status: "pending",
      notes: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof bookingSchema>) => {
    try {
      setIsSubmitting(true);
      console.log("Submitting booking:", {
        ...data,
        totalPrice: Number(service.price),
      });

      // Create booking
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          totalPrice: Number(service.price),
        }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const { booking, clientSecret } = await response.json();

      // Process payment
      await processPayment(clientSecret);

      // Confirm payment
      const confirmResponse = await fetch("/api/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          paymentIntentId: clientSecret.split("_secret_")[0],
        }),
        credentials: "include",
      });

      if (!confirmResponse.ok) {
        throw new Error(await confirmResponse.text());
      }

      onSuccess();
      toast({
        title: "Success",
        description: "Booking confirmed and payment processed successfully!",
      });
    } catch (error: any) {
      console.error("Booking error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="startDate">Start Date</Label>
        <Input
          id="startDate"
          type="date"
          {...form.register("startDate", { required: true })}
        />
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
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Special Requests (Optional)</Label>
        <Input
          id="notes"
          {...form.register("notes")}
          placeholder="Any special requirements..."
        />
      </div>

      <div className="pt-4">
        <p className="text-sm text-muted-foreground mb-4">
          Total Price: ${Number(service.price).toFixed(2)}
        </p>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Book and Pay Now"
          )}
        </Button>
      </div>
    </form>
  );
}