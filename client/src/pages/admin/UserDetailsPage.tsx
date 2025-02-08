import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { UserDetails, UserRole, UserStatus } from "@/types/user";

export default function UserDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("account");

  // Fetch user details
  const { data: user, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      const response = await fetch(`/api/auth/users/${id}`);
      if (!response.ok) throw new Error('Failed to fetch user details');
      return response.json() as Promise<UserDetails>;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <div>User not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">
            {user.profile.firstName} {user.profile.lastName}
          </h1>
          <p className="text-muted-foreground">
            {user.account.email}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge
            variant={
              user.account.status === UserStatus.ACTIVE
                ? 'success'
                : user.account.status === UserStatus.INACTIVE
                ? 'destructive'
                : 'warning'
            }
          >
            {user.account.status}
          </Badge>
          <Badge variant="secondary">
            {user.account.role.charAt(0).toUpperCase() + 
             user.account.role.slice(1).toLowerCase().replace('_', ' ')}
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
          {user.account.role === UserRole.SERVICE_PROVIDER && (
            <>
              <TabsTrigger value="provider">Provider Details</TabsTrigger>
              <TabsTrigger value="activities">Activities</TabsTrigger>
              <TabsTrigger value="organizations">Organizations</TabsTrigger>
              <TabsTrigger value="reviews">Reviews & Ratings</TabsTrigger>
            </>
          )}
          {user.financials && (
            <TabsTrigger value="financials">Financial Info</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Basic account details and status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p>{user.account.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <p>{user.account.status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Role</label>
                  <p>{user.account.role}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Email Verified</label>
                  <p>{user.account.emailVerified ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Last Login</label>
                  <p>{user.account.lastLoginAt ? new Date(user.account.lastLoginAt).toLocaleString() : 'Never'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Created At</label>
                  <p>{new Date(user.account.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Personal details and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">First Name</label>
                  <p>{user.profile.firstName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Last Name</label>
                  <p>{user.profile.lastName}</p>
                </div>
                {user.profile.middleName && (
                  <div>
                    <label className="text-sm font-medium">Middle Name</label>
                    <p>{user.profile.middleName}</p>
                  </div>
                )}
                {user.profile.prefix && (
                  <div>
                    <label className="text-sm font-medium">Prefix</label>
                    <p>{user.profile.prefix}</p>
                  </div>
                )}
                {user.profile.phoneNumber && (
                  <div>
                    <label className="text-sm font-medium">Phone Number</label>
                    <p>{user.profile.phoneNumber}</p>
                  </div>
                )}
                {user.profile.department && (
                  <div>
                    <label className="text-sm font-medium">Department</label>
                    <p>{user.profile.department}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addresses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Addresses</CardTitle>
              <CardDescription>User's registered addresses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {user.addresses.map((address) => (
                <div key={address.id} className="border p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium">
                        {address.type.charAt(0).toUpperCase() + address.type.slice(1)} Address
                        {address.isDefault && (
                          <Badge variant="secondary" className="ml-2">Default</Badge>
                        )}
                      </h3>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Street</label>
                      <p>{address.street}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">City</label>
                      <p>{address.city}</p>
                    </div>
                    {address.state && (
                      <div>
                        <label className="text-sm font-medium">State</label>
                        <p>{address.state}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium">Country</label>
                      <p>{address.country}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Postal Code</label>
                      <p>{address.postalCode}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {user.account.role === UserRole.SERVICE_PROVIDER && user.serviceProvider && (
          <>
            <TabsContent value="provider" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Service Provider Details</CardTitle>
                  <CardDescription>Business information and skills</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Business Name</label>
                      <p>{user.serviceProvider.businessName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Business Type</label>
                      <p>{user.serviceProvider.businessType}</p>
                    </div>
                    {user.serviceProvider.vatNumber && (
                      <div>
                        <label className="text-sm font-medium">VAT Number</label>
                        <p>{user.serviceProvider.vatNumber}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium">Rating</label>
                      <p>{user.serviceProvider.rating} ({user.serviceProvider.reviewCount} reviews)</p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2">Skills</h3>
                    <div className="space-y-4">
                      {user.serviceProvider.skills.map((skill) => (
                        <div key={skill.id} className="border p-4 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{skill.name}</h4>
                              {skill.level && (
                                <Badge variant="secondary">{skill.level}</Badge>
                              )}
                            </div>
                            {skill.yearsOfExperience && (
                              <Badge>{skill.yearsOfExperience} years</Badge>
                            )}
                          </div>
                          {skill.certifications && skill.certifications.length > 0 && (
                            <div className="mt-2">
                              <label className="text-sm font-medium">Certifications</label>
                              <ul className="list-disc list-inside">
                                {skill.certifications.map((cert, index) => (
                                  <li key={index}>{cert}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activities" className="space-y-4">
              {/* Activities list will go here */}
            </TabsContent>

            <TabsContent value="organizations" className="space-y-4">
              {/* Organizations list will go here */}
            </TabsContent>

            <TabsContent value="reviews" className="space-y-4">
              {/* Reviews and ratings will go here */}
            </TabsContent>
          </>
        )}

        {user.financials && (
          <TabsContent value="financials" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Financial Information</CardTitle>
                <CardDescription>Banking and payment details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {user.financials.bankName && (
                    <div>
                      <label className="text-sm font-medium">Bank Name</label>
                      <p>{user.financials.bankName}</p>
                    </div>
                  )}
                  {user.financials.accountNumber && (
                    <div>
                      <label className="text-sm font-medium">Account Number</label>
                      <p>{user.financials.accountNumber}</p>
                    </div>
                  )}
                  {user.financials.iban && (
                    <div>
                      <label className="text-sm font-medium">IBAN</label>
                      <p>{user.financials.iban}</p>
                    </div>
                  )}
                  {user.financials.swift && (
                    <div>
                      <label className="text-sm font-medium">SWIFT</label>
                      <p>{user.financials.swift}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium">Currency</label>
                    <p>{user.financials.currency}</p>
                  </div>
                  {user.financials.paymentTerms && (
                    <div>
                      <label className="text-sm font-medium">Payment Terms</label>
                      <p>{user.financials.paymentTerms}</p>
                    </div>
                  )}
                </div>

                {user.financials.taxInformation && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2">Tax Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {user.financials.taxInformation.vatNumber && (
                        <div>
                          <label className="text-sm font-medium">VAT Number</label>
                          <p>{user.financials.taxInformation.vatNumber}</p>
                        </div>
                      )}
                      {user.financials.taxInformation.taxId && (
                        <div>
                          <label className="text-sm font-medium">Tax ID</label>
                          <p>{user.financials.taxInformation.taxId}</p>
                        </div>
                      )}
                      {user.financials.taxInformation.taxResidenceCountry && (
                        <div>
                          <label className="text-sm font-medium">Tax Residence Country</label>
                          <p>{user.financials.taxInformation.taxResidenceCountry}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
