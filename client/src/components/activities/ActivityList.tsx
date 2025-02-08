import { Activity } from "@/types/user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ActivityListProps {
  activities: Activity[];
}

export function ActivityList({ activities }: ActivityListProps) {
  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <Card key={activity.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{activity.title}</CardTitle>
                <CardDescription>{activity.description}</CardDescription>
              </div>
              <Badge
                variant={
                  activity.status === 'active'
                    ? 'success'
                    : activity.status === 'inactive'
                    ? 'destructive'
                    : 'warning'
                }
              >
                {activity.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Location</label>
                <p>
                  {activity.location.city}, {activity.location.country}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <p>
                  {activity.category}
                  {activity.subcategory && ` / ${activity.subcategory}`}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Duration</label>
                <p>
                  {activity.duration.value} {activity.duration.unit}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Capacity</label>
                <p>
                  {activity.capacity.min} - {activity.capacity.max} people
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Base Price</label>
                <p>
                  {activity.pricing.basePrice} {activity.pricing.currency}
                  {activity.pricing.pricingType !== 'fixed' && ' per person'}
                </p>
              </div>
            </div>

            {(activity.pricing.discounts?.length ?? 0) > 0 && (
              <div className="mt-4">
                <label className="text-sm font-medium">Discounts</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
                  {activity.pricing.discounts?.map((discount, index) => (
                    <Badge key={index} variant="secondary">
                      {discount.type}: {discount.value}
                      {discount.isPercentage ? '%' : activity.pricing.currency}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {activity.bookingPolicy && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Cancellation Policy</label>
                  <p className="text-sm">{activity.bookingPolicy.cancellation}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Refund Policy</label>
                  <p className="text-sm">{activity.bookingPolicy.refund}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Minimum Notice</label>
                  <p className="text-sm">{activity.bookingPolicy.minimumNotice}</p>
                </div>
              </div>
            )}

            {activity.images.length > 0 && (
              <div className="mt-4">
                <label className="text-sm font-medium">Images</label>
                <div className="grid grid-cols-4 gap-2 mt-1">
                  {activity.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`${activity.title} - Image ${index + 1}`}
                      className="w-full h-24 object-cover rounded-md"
                    />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
