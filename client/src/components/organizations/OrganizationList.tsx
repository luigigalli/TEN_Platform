import { Organization } from "@/types/user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface OrganizationListProps {
  organizations: Organization[];
}

export function OrganizationList({ organizations }: OrganizationListProps) {
  return (
    <div className="space-y-4">
      {organizations.map((org) => (
        <Card key={org.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-4">
                {org.logo && (
                  <img
                    src={org.logo}
                    alt={`${org.name} logo`}
                    className="w-12 h-12 object-contain rounded-md"
                  />
                )}
                <div>
                  <CardTitle>{org.name}</CardTitle>
                  <CardDescription>{org.description}</CardDescription>
                </div>
              </div>
              <Badge
                variant={org.status === 'active' ? 'success' : 'destructive'}
              >
                {org.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Type</label>
                <p>{org.type}</p>
              </div>
              {org.industry && (
                <div>
                  <label className="text-sm font-medium">Industry</label>
                  <p>{org.industry}</p>
                </div>
              )}
              {org.foundedYear && (
                <div>
                  <label className="text-sm font-medium">Founded</label>
                  <p>{org.foundedYear}</p>
                </div>
              )}
              {org.size && (
                <div>
                  <label className="text-sm font-medium">Size</label>
                  <p>{org.size}</p>
                </div>
              )}
              {org.website && (
                <div>
                  <label className="text-sm font-medium">Website</label>
                  <a
                    href={org.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {org.website}
                  </a>
                </div>
              )}
            </div>

            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Contact Information</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p>{org.contactInfo.email}</p>
                </div>
                {org.contactInfo.phone && (
                  <div>
                    <label className="text-sm font-medium">Phone</label>
                    <p>{org.contactInfo.phone}</p>
                  </div>
                )}
              </div>
              
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Address</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Street</label>
                    <p>{org.contactInfo.address.street}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">City</label>
                    <p>{org.contactInfo.address.city}</p>
                  </div>
                  {org.contactInfo.address.state && (
                    <div>
                      <label className="text-sm font-medium">State</label>
                      <p>{org.contactInfo.address.state}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium">Country</label>
                    <p>{org.contactInfo.address.country}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Postal Code</label>
                    <p>{org.contactInfo.address.postalCode}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
