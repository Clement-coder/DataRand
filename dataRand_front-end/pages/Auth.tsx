"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { GeometricBackground, NdebeleBorder, ClawDivider, CornerAccent } from "@/components/ui/GeometricBackground";
import { DataRandLogo, TaskIcon, ShieldIcon, WorkIcon, PowerIcon, ArrowRightIcon, StrengthIcon } from "@/components/icons/DataRandIcons";
const authSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters")
});
export default function Auth() {
  const {
    user,
    loading: authLoading,
    signIn,
    signUp
  } = useAuth();
  const router = useRouter();
  const {
    toast
  } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"worker" | "client">("worker");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("login");
  useEffect(() => {
    if (!authLoading && user) {
      router.push("/tasks");
    }
  }, [user, authLoading, router]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const validation = authSchema.safeParse({
        email,
        password
      });
      if (!validation.success) {
        toast({
          title: "Validation Error",
          description: validation.error.errors[0].message,
          variant: "destructive"
        });
        setLoading(false);
        return;
      }
      if (tab === "login") {
        const {
          error
        } = await signIn(email, password);
        if (error) {
          toast({
            title: "Login Failed",
            description: error.message,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Welcome back, warrior!",
            description: "Ready to conquer more tasks."
          });
          router.push("/tasks");
        }
      } else {
        const {
          error
        } = await signUp(email, password, role);
        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              title: "Account Exists",
              description: "This email is already registered. Try logging in instead.",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Sign Up Failed",
              description: error.message,
              variant: "destructive"
            });
          }
        } else {
          toast({
            title: "Welcome to the Pride!",
            description: "Your journey with DataRand begins now."
          });
          router.push("/tasks");
        }
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <DataRandLogo size={64} className="text-primary animate-pulse" />
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>;
  }
  return <div className="min-h-screen flex flex-col lg:flex-row relative overflow-hidden">
      {/* Left Side - Branding */}
      <div className="lg:flex-1 bg-card p-8 lg:p-12 flex flex-col justify-center relative">
        <GeometricBackground variant="ndebele" opacity={0.04} />
        <CornerAccent position="top-left" className="opacity-20" />
        <CornerAccent position="bottom-right" className="opacity-20" />

        <div className="max-w-lg mx-auto lg:mx-0 relative z-10">
          <div className="flex items-center gap-4 mb-10">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-glow">
              <DataRandLogo size={42} className="text-primary-foreground" />
            </div>
            <div>
              <span className="font-display text-4xl font-bold text-gradient-primary">
                DataRand
              </span>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                African Intelligence Layer
              </p>
            </div>
          </div>

          <h1 className="text-3xl lg:text-4xl font-display font-bold mb-4 leading-tight">
            Unleash the Power of
            <span className="text-gradient-primary"> African Intelligence</span>
          </h1>
          <p className="text-muted-foreground text-lg mb-10">Turn your knowledge into income. Complete micro-tasks, earn real money, and power the future of AI compute, while funding education across Africa.</p>

          <ClawDivider className="mb-10 opacity-30" />

          <div className="grid gap-5">
            <div className="flex items-start gap-4 p-5 rounded-xl bg-background/50 border border-border hover:border-primary/30 transition-all group">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <TaskIcon size={24} className="text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">Instant Task Alerts</h3>
                <p className="text-sm text-muted-foreground">Get pinged with mini-tasks to complete in less than a minute. Accept with one tap like a true warrior.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5 rounded-xl bg-background/50 border border-border hover:border-secondary/30 transition-all group">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary/10 group-hover:bg-secondary/20 transition-colors">
                <ShieldIcon size={24} className="text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1 group-hover:text-secondary transition-colors">Build Your Reputation</h3>
                <p className="text-sm text-muted-foreground">No degree or qualifications needed. Your knowledge of Africa is enough. Quality work builds your reputation score. Rise through the ranks and unlock better opportunities.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5 rounded-xl bg-background/50 border border-border hover:border-accent/30 transition-all group">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 group-hover:bg-accent/20 transition-colors">
                <StrengthIcon size={24} className="text-accent" />
              </div>
              <div>
                <h3 className="font-semibold mb-1 group-hover:text-accent transition-colors">Education Through ComputeShare</h3>
                <p className="text-sm text-muted-foreground">Share your device's idle compute power and 15% funds education for millions of African children. Ubuntu in action.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="lg:flex-1 p-8 lg:p-12 flex items-center justify-center relative">
        <GeometricBackground variant="claws" opacity={0.03} />
        
        <Card className="w-full max-w-md border-border/50 shadow-card relative overflow-hidden">
          <NdebeleBorder />
          <CardHeader className="text-center pt-8">
            <CardTitle className="text-2xl font-display">
              {tab === "login" ? "Welcome Back, Warrior" : "Join the Pride"}
            </CardTitle>
            <CardDescription>
              {tab === "login" ? "Sign in to continue your journey" : "Create your account and start earning"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-8">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" className="font-semibold">Login</TabsTrigger>
                <TabsTrigger value="signup" className="font-semibold">Sign Up</TabsTrigger>
              </TabsList>

              <form onSubmit={handleSubmit} className="space-y-5">
                <TabsContent value="login" className="space-y-5 mt-0">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input id="login-email" type="email" placeholder="warrior@datarand.africa" value={email} onChange={e => setEmail(e.target.value)} className="h-12" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input id="login-password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="h-12" required />
                  </div>
                </TabsContent>

                <TabsContent value="signup" className="space-y-5 mt-0">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input id="signup-email" type="email" placeholder="warrior@datarand.africa" value={email} onChange={e => setEmail(e.target.value)} className="h-12" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input id="signup-password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="h-12" required />
                  </div>
                  <div className="space-y-3">
                    <Label>I want to...</Label>
                    <RadioGroup value={role} onValueChange={v => setRole(v as "worker" | "client")} className="grid grid-cols-2 gap-4">
                      <Label htmlFor="role-worker" className={`flex flex-col items-center gap-3 rounded-xl border-2 p-5 cursor-pointer transition-all ${role === "worker" ? "border-primary bg-primary/5 shadow-glow" : "border-border hover:border-primary/50"}`}>
                        <RadioGroupItem value="worker" id="role-worker" className="sr-only" />
                        <PowerIcon size={28} className={role === "worker" ? "text-primary" : "text-muted-foreground"} />
                        <span className="font-semibold">Earn Money</span>
                        <span className="text-xs text-muted-foreground text-center">
                          Complete tasks
                        </span>
                      </Label>
                      <Label htmlFor="role-client" className={`flex flex-col items-center gap-3 rounded-xl border-2 p-5 cursor-pointer transition-all ${role === "client" ? "border-primary bg-primary/5 shadow-glow" : "border-border hover:border-primary/50"}`}>
                        <RadioGroupItem value="client" id="role-client" className="sr-only" />
                        <WorkIcon size={28} className={role === "client" ? "text-primary" : "text-muted-foreground"} />
                        <span className="font-semibold">Post Tasks</span>
                        <span className="text-xs text-muted-foreground text-center">
                          Get work done
                        </span>
                      </Label>
                    </RadioGroup>
                  </div>
                </TabsContent>

                <Button type="submit" className="w-full h-12 gradient-primary text-primary-foreground font-semibold text-base group" disabled={loading}>
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>
                      {tab === "login" ? "Enter the Arena" : "Join the Pride"}
                      <ArrowRightIcon size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </>}
                </Button>
              </form>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>;
}