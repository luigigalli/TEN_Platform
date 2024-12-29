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

// Form validation schemas
const loginSchema = z.object({
  username: z.string().min(1, "Username or email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email"),
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

  // Login form
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
    mode: "onChange",
  });

  // Register form
  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
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
          username: data.username,
          password: data.password,
          email: data.username, // Allow login with email
          role: "user",
        };

        const result = await login(loginData);
        handleAuthResponse(result, 'Login');
      } else {
        const registerData = data as RegisterFormData;
        const newUser: InsertUser = {
          username: registerData.username,
          password: registerData.password,
          email: registerData.email,
          role: "user",
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
            <div className="space-y-2">
              <Label htmlFor={`${isLogin ? 'login' : 'register'}-username`}>
                {isLogin ? "Username or Email" : "Username"}
              </Label>
              <Input
                id={`${isLogin ? 'login' : 'register'}-username`}
                type="text"
                autoComplete={isLogin ? "username" : "new-username"}
                aria-invalid={!!form.formState.errors.username}
                aria-describedby={
                  form.formState.errors.username 
                    ? `${isLogin ? 'login' : 'register'}-username-error` 
                    : undefined
                }
                {...form.register("username")}
                disabled={isSubmitting}
              />
              {form.formState.errors.username && (
                <p 
                  className="text-sm text-destructive"
                  id={`${isLogin ? 'login' : 'register'}-username-error`}
                  role="alert"
                >
                  {form.formState.errors.username.message}
                </p>
              )}
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={!!form.formState.errors.email}
                  aria-describedby={
                    form.formState.errors.email 
                      ? "register-email-error" 
                      : undefined
                  }
                  {...form.register("email")}
                  disabled={isSubmitting}
                />
                {form.formState.errors.email && (
                  <p 
                    className="text-sm text-destructive"
                    id="register-email-error"
                    role="alert"
                  >
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>
            )}

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