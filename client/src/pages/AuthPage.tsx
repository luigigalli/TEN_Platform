import { useState } from "react";
import { useUser } from "../hooks/use-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { InsertUser } from "@db/schema";
import { useLocation } from "wouter";

// Form validation schemas
const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Form data types
type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

// Error types
interface AuthError extends Error {
  message: string;
  code?: string;
  status?: number;
}

// Response types
interface AuthResponse {
  ok: boolean;
  message?: string;
  user?: InsertUser;
}

/**
 * AuthPage component handles user login and registration
 * @returns React component
 */
export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, register } = useUser();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Login form
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onChange",
  });

  // Register form
  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      email: "",
      password: "",
    },
    mode: "onChange",
  });

  /**
   * Handle authentication response
   * @param result - Authentication result
   * @param action - Authentication action type
   * @returns boolean indicating success
   */
  const handleAuthResponse = (result: AuthResponse, action: 'Login' | 'Registration'): boolean => {
    if (!result.ok) {
      toast({
        variant: "destructive",
        title: `${action} Failed`,
        description: result.message ?? `${action} failed. Please try again.`
      });
      return false;
    }

    toast({
      title: "Success",
      description: result.message ?? (action === 'Login' ? "Welcome back!" : "Account created successfully!")
    });

    // Navigate to home page on success
    if (action === 'Login') {
      setLocation('/');
    }
    
    return true;
  };

  /**
   * Handle form submission
   * @param data - Form data
   */
  const onSubmit = async (data: LoginFormData | RegisterFormData) => {
    try {
      setIsSubmitting(true);

      if (isLogin) {
        const loginData: InsertUser = {
          email: data.email,
          password: data.password,
        };

        const result = await login(loginData);
        if (result.ok) {
          toast({
            title: "Success",
            description: result.message || "Login successful",
          });
          setLocation("/");
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: result.message || "Login failed",
          });
        }
      } else {
        const registerData = data as RegisterFormData;
        // Generate username from first name
        const baseUsername = registerData.firstName
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '') // Remove special characters
          .replace(/\s+/g, ''); // Remove spaces

        const newUser: InsertUser = {
          email: registerData.email,
          password: registerData.password,
          firstName: registerData.firstName,
          username: baseUsername, // This will be properly handled on the server
          role: "user",
          profileCompleted: false
        };

        const result = await register(newUser);
        handleAuthResponse(result, 'Registration');
      }
    } catch (error) {
      const authError = error as AuthError;
      toast({
        variant: "destructive",
        title: "Error",
        description: authError.message ?? "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get the current form based on mode
  const form = isLogin ? loginForm : registerForm;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {isLogin ? "Welcome Back" : "Create Account"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form 
            onSubmit={form.handleSubmit(onSubmit)} 
            className="space-y-4"
            noValidate
          >
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="register-firstname">First Name</Label>
                <Input
                  id="register-firstname"
                  type="text"
                  autoComplete="given-name"
                  placeholder="Enter your first name"
                  aria-invalid={!!form.formState.errors.firstName}
                  aria-describedby={
                    form.formState.errors.firstName 
                      ? "register-firstname-error" 
                      : undefined
                  }
                  {...form.register("firstName")}
                  disabled={isSubmitting}
                />
                {form.formState.errors.firstName && (
                  <p 
                    className="text-sm text-destructive"
                    id="register-firstname-error"
                    role="alert"
                  >
                    {form.formState.errors.firstName.message}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor={`${isLogin ? 'login' : 'register'}-email`}>
                Email
              </Label>
              <Input
                id={`${isLogin ? 'login' : 'register'}-email`}
                type="email"
                autoComplete="email"
                aria-invalid={!!form.formState.errors.email}
                aria-describedby={
                  form.formState.errors.email 
                    ? `${isLogin ? 'login' : 'register'}-email-error` 
                    : undefined
                }
                {...form.register("email")}
                disabled={isSubmitting}
              />
              {form.formState.errors.email && (
                <p 
                  className="text-sm text-destructive"
                  id={`${isLogin ? 'login' : 'register'}-email-error`}
                  role="alert"
                >
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${isLogin ? 'login' : 'register'}-password`}>
                Password
              </Label>
              <Input
                id={`${isLogin ? 'login' : 'register'}-password`}
                type="password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                aria-invalid={!!form.formState.errors.password}
                aria-describedby={
                  form.formState.errors.password 
                    ? `${isLogin ? 'login' : 'register'}-password-error` 
                    : undefined
                }
                {...form.register("password")}
                disabled={isSubmitting}
              />
              {form.formState.errors.password && (
                <p 
                  className="text-sm text-destructive"
                  id={`${isLogin ? 'login' : 'register'}-password-error`}
                  role="alert"
                >
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting || !form.formState.isValid}
              aria-busy={isSubmitting}
            >
              {isSubmitting
                ? "Please wait..."
                : isLogin
                ? "Login"
                : "Register"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setIsLogin(!isLogin);
                form.reset();
              }}
              disabled={isSubmitting}
            >
              {isLogin
                ? "Don't have an account? Register"
                : "Already have an account? Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}