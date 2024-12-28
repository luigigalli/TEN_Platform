import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";

interface Expert {
  id: number;
  name: string;
  speciality: string;
  location: string;
  image: string;
  rating: number;
}

interface ExpertCardProps {
  expert: Expert;
}

export default function ExpertCard({ expert }: ExpertCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={expert.image} alt={expert.name} />
            <AvatarFallback>{expert.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold">{expert.name}</h3>
            <p className="text-sm text-muted-foreground">{expert.speciality}</p>
            <div className="flex items-center gap-1 mt-1">
              <Star className="h-4 w-4 fill-primary text-primary" />
              <span className="text-sm font-medium">{expert.rating}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">{expert.location}</span>
          <Button variant="outline" size="sm">
            Contact
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
