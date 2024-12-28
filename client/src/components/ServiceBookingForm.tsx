import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { Service, InsertBooking } from "@db/schema";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const bookingSchema = z.object({
  serviceId: z.number(),
  startDate: z.string().min(1, "Date is required"),
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

  const form = useForm<z.infer<typeof bookingSchema>>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      serviceId: service.id,
      startDate: "",
      totalPrice: Number(service.price),
      status: "pending",
      notes: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof bookingSchema>) => {
    try {
      setIsSubmitting(true);
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          totalPrice: Number(data.totalPrice),
          startDate: new Date(data.startDate).toISOString(),
        }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      onSuccess();
      toast({
        title: "Success",
        description: "Booking confirmed successfully!",
      });
    } catch (error: any) {
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
        <Label htmlFor="startDate">Date</Label>
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
          {isSubmitting ? "Processing..." : "Confirm Booking"}
        </Button>
      </div>
    </form>
  );
}