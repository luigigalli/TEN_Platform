import { Review } from "@/types/user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, StarHalf } from "lucide-react";

interface ReviewListProps {
  reviews: Review[];
}

function RatingStars({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center space-x-0.5">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
      ))}
      {hasHalfStar && (
        <StarHalf className="w-4 h-4 fill-yellow-400 text-yellow-400" />
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />
      ))}
      <span className="ml-2 text-sm text-muted-foreground">{rating.toFixed(1)}</span>
    </div>
  );
}

export function ReviewList({ reviews }: ReviewListProps) {
  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{review.title}</CardTitle>
                <CardDescription>
                  Review for {review.activityTitle}
                </CardDescription>
              </div>
              <div className="text-right">
                <RatingStars rating={review.rating} />
                <p className="text-sm text-muted-foreground">
                  {new Date(review.date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm">{review.content}</p>
              </div>

              {review.images?.length > 0 && (
                <div>
                  <label className="text-sm font-medium">Images</label>
                  <div className="grid grid-cols-4 gap-2 mt-1">
                    {review.images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Review image ${index + 1}`}
                        className="w-full h-24 object-cover rounded-md"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Reviewer</label>
                  <p className="text-sm">{review.reviewer.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Group Size</label>
                  <p className="text-sm">{review.groupSize} people</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Activity Date</label>
                  <p className="text-sm">
                    {new Date(review.activityDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {review.categories && review.categories.length > 0 && (
                <div>
                  <label className="text-sm font-medium">Categories</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {review.categories.map((category, index) => (
                      <Badge key={index} variant="secondary">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {review.response && (
                <div className="mt-4 bg-muted p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge>Provider Response</Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(review.response.date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm">{review.response.content}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
