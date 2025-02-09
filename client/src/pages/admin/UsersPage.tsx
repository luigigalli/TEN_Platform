import React from 'react';

export default function UsersPage() {
  console.log('[UsersPage] Rendering');
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">User Management</h1>
      
      <div className="border rounded-lg bg-background p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Active Users</h2>
            <p className="text-sm text-muted-foreground">
              List of registered platform users
            </p>
          </div>
          <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4">
            Add User
          </button>
        </div>

        <div className="border rounded-md bg-card">
          <div className="p-6">
            <p className="text-sm text-muted-foreground">
              User list will be displayed here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}