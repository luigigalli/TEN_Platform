import { useState } from "react";
import { useServices } from "../hooks/use-services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MapPinIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import ServiceBookingForm from "../components/ServiceBookingForm";
import type { Service } from "@db/schema";

interface ServiceError extends Error {
  message: string;
}

interface ServiceCardProps {
  service: Service;
  onBook: (service: Service) => void;
}

function ServiceCard({ service, onBook }: ServiceCardProps) {
  const formattedPrice = (Number(service.price) || 0).toFixed(2);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-xl">{service.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPinIcon className="h-4 w-4" />
            <span>{service.location}</span>
          </div>
          <p className="text-sm">{service.description ?? "No description available"}</p>
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">
              ${formattedPrice}
            </span>
            <Button 
              onClick={() => onBook(service)}
              aria-label={`Book ${service.title}`}
            >
              Book Now
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ServicesPage() {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const { services = [], isLoading, error } = useServices();
  const { toast } = useToast();

  const handleBookService = (service: Service) => {
    setSelectedService(service);
  };

  const handleBookingSuccess = () => {
    setSelectedService(null);
    toast({
      title: "Success",
      description: "Service booked successfully!",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]" role="status">
        <Loader2 className="h-8 w-8 animate-spin" aria-label="Loading services" />
      </div>
    );
  }

  if (error) {
    const serviceError = error as ServiceError;
    return (
      <div className="text-center py-8" role="alert">
        <p className="text-destructive">
          Error loading services: {serviceError.message ?? "An unexpected error occurred"}
        </p>
      </div>
    );
  }

  if (!services.length) {
    return (
      <div className="text-center py-8" role="status">
        <p className="text-muted-foreground">No services available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Available Services</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            onBook={handleBookService}
          />
        ))}
      </div>

      <Dialog 
        open={!!selectedService} 
        onOpenChange={(open) => !open && setSelectedService(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-semibold">Book Service</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Fill in the booking details and complete the payment to secure your service.
            </DialogDescription>
          </DialogHeader>
          {selectedService && (
            <ServiceBookingForm
              service={selectedService}
              onSuccess={handleBookingSuccess}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}