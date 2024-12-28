import { Switch, Route } from "wouter";
import { useUser } from "./hooks/use-user";
import Navigation from "./components/Navigation";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import TripPlanner from "./pages/TripPlanner";
import ServicesPage from "./pages/ServicesPage";
import Profile from "./pages/Profile";
import { Loader2 } from "lucide-react";

function App() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />
      <main className="container mx-auto px-4 py-8">
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/services" component={ServicesPage} />
          <Route path="/trips" component={TripPlanner} />
          <Route path="/profile">
            <Profile />
          </Route>
          <Route path="/profile/:id">
            {(params) => <Profile userId={parseInt(params.id)} />}
          </Route>
          <Route>
            {/* 404 Page */}
            <div className="text-center">
              <h1 className="text-2xl font-bold">Page Not Found</h1>
              <p className="text-muted-foreground mt-2">The page you're looking for doesn't exist.</p>
            </div>
          </Route>
        </Switch>
      </main>
    </div>
  );
}

export default App;