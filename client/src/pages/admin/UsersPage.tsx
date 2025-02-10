import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ErrorBoundary } from 'react-error-boundary';

const UserSkeleton = () => (
  <div className="animate-pulse space-y-4 p-6">
    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-4 bg-gray-200 rounded"></div>
    ))}
  </div>
);

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="p-6 text-red-500">
      <p>Error: {error.message}</p>
      <button 
        onClick={() => window.location.reload()}
        className="mt-2 px-4 py-2 bg-red-100 rounded"
      >
        Reload Page
      </button>
    </div>
  );
}

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['users', searchTerm, currentPage],
    queryFn: () => api.users.getUsers(searchTerm, currentPage),
  });

  if (isLoading) return <UserSkeleton />;
  if (isError) return <div className="p-6 text-red-500">Error loading users</div>;

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">User Management</h1>
        
        <div className="border rounded-lg bg-background p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Active Users</h2>
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="p-2 border rounded"
              />
            </div>
            <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4">
              Add User
            </button>
          </div>

          <div className="border rounded-md bg-card">
            {data?.data.length === 0 ? (
              <div className="p-6">No users found</div>
            ) : (
              <div className="p-6">
                {data?.data.map((user) => (
                  <div key={user.id} className="py-2 border-b">
                    {user.email} - {user.role}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-100 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span>Page {currentPage} of {data?.pagination.lastPage || 1}</span>
            <button
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={currentPage === data?.pagination.lastPage}
              className="px-4 py-2 bg-gray-100 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}