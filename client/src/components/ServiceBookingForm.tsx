import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { Service, InsertBooking } from "@db/schema";
import { useState } from "react";

interface ServiceBookingFormProps {
  service: Service;
  onSuccess: () => void;
}

export default function ServiceBookingForm({ service, onSuccess }: ServiceBookingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<InsertBooking>({
    defaultValues: {
      serviceId: service.id,
      startDate: "",
      totalPrice: service.price,
      status: "pending",
    },
  });

  const onSubmit = async (data: InsertBooking) => {
    try {
      setIsSubmitting(true);
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      onSuccess();
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Special Requests</Label>
        <Input
          id="notes"
          {...form.register("notes")}
          placeholder="Any special requirements..."
        />
      </div>

      <div className="pt-4">
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Booking..." : "Confirm Booking"}
        </Button>
      </div>
    </form>
  );
}
