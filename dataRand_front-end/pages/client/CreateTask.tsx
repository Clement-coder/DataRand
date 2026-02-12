"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase, type TaskType } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Image, Headphones, Brain, Plus, DollarSign, Users, Globe, Upload, X, Video, Info, FileText, Clock, Wallet, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import { z } from "zod";
import { ethers } from "ethers";
import { api, CONFIG, getDeviceFingerprint } from "@/lib/datarand";

const AFRICAN_COUNTRIES = [
  "Nigeria", "Kenya", "South Africa", "Ghana", "Ethiopia", "Tanzania",
  "Uganda", "Rwanda", "Senegal", "Morocco", "Egypt", "Tunisia",
  "Cameroon", "Ivory Coast", "Zimbabwe", "Zambia", "Mozambique", "Angola"
];

const TARGET_REGIONS = [
  { value: "all", label: "All Countries" },
  { value: "africa", label: "African Countries" },
  { value: "india", label: "India" },
  { value: "custom", label: "Select Specific Countries" },
];

const taskTypeIcons: Record<string, typeof Image> = {
  image_labeling: Image,
  audio_transcription: Headphones,
  ai_evaluation: Brain,
};

const TASK_CATEGORIES = [
  { value: "Image Labeling", label: "🖼️ Image Labeling" },
  { value: "Audio Transcription", label: "🎙️ Audio Transcription" },
  { value: "AI Evaluation", label: "🤖 AI Evaluation" },
  { value: "ComputeShare", label: "💻 ComputeShare" },
];

// Step types
type Step = "create" | "fund" | "complete";

export default function CreateTask() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  
  // DataRand Integration State
  const [step, setStep] = useState<Step>("create");
  const [createdTask, setCreatedTask] = useState<any>(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<string>("0");
  const [switchingNetwork, setSwitchingNetwork] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    instructions: "",
    payoutPerWorker: "",
    requiredWorkers: "1",
    estimatedTimeMinutes: "15",
    taskTypeId: "",
    deadline: "",
  });

  // Calculate costs in ETH
  const payoutETH = parseFloat(formData.payoutPerWorker) || 0;
  const workers = parseInt(formData.requiredWorkers) || 1;
  const subtotal = payoutETH * workers;
  const platformFee = subtotal * (CONFIG.PLATFORM_FEE_PERCENTAGE / 100);
  const totalCost = subtotal + platformFee;
  const hasEnoughBalance = parseFloat(walletBalance) >= totalCost;

  useEffect(() => {
    if (!authLoading && !profile) {
      router.push("/auth");
      return;
    }
  }, [authLoading, profile, router]);

  useEffect(() => {
    const fetchTaskTypes = async () => {
      const { data } = await supabase.from("task_types").select("*");
      if (data) setTaskTypes(data as TaskType[]);
    };
    fetchTaskTypes();
  }, []);

  // Check for existing wallet connection
  useEffect(() => {
    const checkWallet = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.listAccounts();
          if (accounts.length > 0) {
            setWalletConnected(true);
            setWalletAddress(accounts[0].address);
            const balance = await provider.getBalance(accounts[0].address);
            setWalletBalance(ethers.formatEther(balance));
          }
        } catch (e) {
          console.error("Error checking wallet:", e);
        }
      }
    };
    checkWallet();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Please upload an image or video.", variant: "destructive" });
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 50MB.", variant: "destructive" });
      return;
    }

    setMediaFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setMediaPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadMediaToSupabase = async (file: File): Promise<{ url: string; type: string } | null> => {
    if (!profile) return null;
    setUploadingMedia(true);
    try {
      const fileExtension = file.name.split('.').pop();
      const fileName = `${profile.id}/${Date.now()}.${fileExtension}`;
      const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
      
      const { data, error } = await supabase.storage.from('task_media').upload(fileName, file);
      if (error) throw error;
      
      const { data: publicUrlData } = supabase.storage.from('task_media').getPublicUrl(data.path);
      return { url: publicUrlData.publicUrl, type: mediaType };
    } catch (error: any) {
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
      return null;
    } finally {
      setUploadingMedia(false);
    }
  };

  const getTargetCountries = (): string[] => {
    switch (selectedRegion) {
      case "all": return ["all"];
      case "africa": return AFRICAN_COUNTRIES;
      case "india": return ["India"];
      case "custom": return selectedCountries.length > 0 ? selectedCountries : ["all"];
      default: return ["all"];
    }
  };

  // Connect Wallet Function
  const connectWallet = async () => {
    if (!window.ethereum) {
      toast({ title: "No wallet found", description: "Please install MetaMask.", variant: "destructive" });
      return;
    }

    try {
      setSwitchingNetwork(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const accounts = await provider.listAccounts();
      
      setWalletConnected(true);
      setWalletAddress(accounts[0].address);
      const balance = await provider.getBalance(accounts[0].address);
      setWalletBalance(ethers.formatEther(balance));

      // Switch to Arbitrum Sepolia
      try {
        await provider.send("wallet_switchEthereumChain", [{ chainId: CONFIG.CHAIN_ID }]);
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          await provider.send("wallet_addEthereumChain", [{
            chainId: CONFIG.CHAIN_ID,
            chainName: CONFIG.CHAIN_NAME,
            rpcUrls: [CONFIG.RPC_URL],
            blockExplorerUrls: [CONFIG.BLOCK_EXPLORER],
            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
          }]);
        }
      }

      toast({ title: "Wallet connected", description: `${accounts[0].address.slice(0, 6)}...${accounts[0].address.slice(-4)}` });
    } catch (error: any) {
      toast({ title: "Connection failed", description: error.message, variant: "destructive" });
    } finally {
      setSwitchingNetwork(false);
    }
  };

  const handleCreateTask = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      // Upload media first if exists
      let mediaData: { url: string; type: string } | null = null;
      if (mediaFile) {
        mediaData = await uploadMediaToSupabase(mediaFile);
        if (!mediaData) { setLoading(false); return; }
      }

      // Transform to backend format
      const taskData = {
        title: formData.title,
        description: formData.description,
        category: taskTypes.find(t => t.id === formData.taskTypeId)?.name || "Image Labeling",
        payoutPerWorker: payoutETH,
        requiredWorkers: workers,
        deadline: formData.deadline || null,
      };

      // Call backend API
      const result = await api.createTask(taskData);
      setCreatedTask(result.task);
      setStep("fund");

      toast({ title: "Task Created!", description: "Now fund the task to make it available." });
    } catch (error: any) {
      console.error("Create task error:", error);
      toast({ title: "Error", description: error.message || "Failed to create task.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleFundTask = async () => {
    if (!createdTask || !walletConnected) return;

    setLoading(true);
    try {
      // Call backend to fund task (this triggers the smart contract)
      const result = await api.fundTask(createdTask.id);
      
      toast({ title: "Task funded!", description: "Your task is now live!" });
      setStep("complete");
      
      // Redirect after a short delay
      setTimeout(() => router.push("/client/tasks"), 2000);
    } catch (error: any) {
      console.error("Fund task error:", error);
      toast({ title: "Funding failed", description: error.message || "Failed to fund task.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const toggleCountry = (country: string) => {
    setSelectedCountries(prev => prev.includes(country) ? prev.filter(c => c !== country) : [...prev, country]);
  };

  if (authLoading || !profile) {
    return null;
  }

  const isVideo = mediaFile?.type.startsWith('video/');

  // Calculate USD equivalent (approximate)
  const ETH_PRICE_USD = 2500; // Approximate
  const totalCostUSD = (totalCost * ETH_PRICE_USD).toFixed(2);

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6 animate-in fade-in duration-300 px-4 sm:px-0">
        
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 mb-6">
          <div className={`flex items-center gap-2 ${step === "create" ? "text-primary" : step !== "create" ? "text-green-600" : "text-muted-foreground"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "create" ? "bg-primary text-white" : "bg-green-600 text-white"}`}>
              {step === "create" ? "1" : <CheckCircle className="w-5 h-5" />}
            </div>
            <span className="text-sm font-medium hidden sm:inline">Create</span>
          </div>
          <div className="w-8 sm:w-16 h-0.5 bg-border" />
          <div className={`flex items-center gap-2 ${step === "fund" ? "text-primary" : step === "complete" ? "text-green-600" : "text-muted-foreground"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "fund" ? "bg-primary text-white" : step === "complete" ? "bg-green-600 text-white" : "bg-muted"}`}>
              {step === "fund" ? "2" : step === "complete" ? <CheckCircle className="w-5 h-5" /> : "2"}
            </div>
            <span className="text-sm font-medium hidden sm:inline">Fund</span>
          </div>
          {step === "complete" && (
            <>
              <div className="w-8 sm:w-16 h-0.5 bg-green-600" />
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-600 text-white">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium hidden sm:inline">Done!</span>
              </div>
            </>
          )}
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="self-start">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-display font-bold">
              {step === "create" ? "Create New Task" : step === "fund" ? "Fund Task" : "Task Created!"}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              {step === "create" ? "Post a task for workers to complete" : step === "fund" ? "Add funds to activate your task" : "Redirecting to your tasks..."}
            </p>
          </div>
        </div>

        {/* Main Content */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">
              {step === "create" ? "Task Details" : "Funding Summary"}
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              {step === "create" ? "Provide clear instructions for the best results" : "Review and fund your task with ETH"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "create" ? (
              <form onSubmit={(e) => { e.preventDefault(); handleCreateTask(); }} className="space-y-4 sm:space-y-6">
                {/* Task Type */}
                <div className="space-y-2">
                  <Label htmlFor="task_type">Task Type</Label>
                  <Select value={formData.taskTypeId} onValueChange={(v) => setFormData({ ...formData, taskTypeId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select task type" /></SelectTrigger>
                    <SelectContent>
                      {taskTypes.map((type) => {
                        const Icon = taskTypeIcons[type.name] || Brain;
                        return (
                          <SelectItem key={type.id} value={type.id}>
                            <div className="flex items-center gap-2"><Icon className="h-4 w-4" />{type.description}</div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Task Title</Label>
                  <Input id="title" placeholder="e.g., Label 100 product images" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Briefly describe what this task involves..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} required />
                </div>

                {/* Media Upload */}
                <div className="space-y-2">
                  <Label>Media (Image or Video)</Label>
                  {mediaPreview ? (
                    <div className="relative rounded-lg overflow-hidden border border-border bg-muted/50">
                      {isVideo ? <video src={mediaPreview} controls className="w-full max-h-64 object-contain" /> : <img src={mediaPreview} alt="Preview" className="w-full max-h-64 object-contain" />}
                      <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2" onClick={removeMedia}><X className="h-4 w-4" /></Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors" onClick={() => fileInputRef.current?.click()}>
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex gap-2"><Image className="h-8 w-8 text-muted-foreground" /><Video className="h-8 w-8 text-muted-foreground" /></div>
                        <p className="text-sm text-muted-foreground">Click to upload image or video</p>
                      </div>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime" onChange={handleFileChange} className="hidden" />
                </div>

                {/* Instructions */}
                <div className="space-y-2">
                  <Label htmlFor="instructions">Detailed Instructions</Label>
                  <Textarea id="instructions" placeholder="Step-by-step instructions for completing the task..." value={formData.instructions} onChange={(e) => setFormData({ ...formData, instructions: e.target.value })} rows={4} required />
                </div>

                {/* Workers & Payout */}
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="workers">Workers Needed</Label>
                    <Input id="workers" type="number" min="1" max="100" value={formData.requiredWorkers} onChange={(e) => setFormData({ ...formData, requiredWorkers: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payout">Payout per Worker (ETH)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Ξ</span>
                      <Input id="payout" type="number" step="0.001" min="0.001" className="pl-8" placeholder="0.01" value={formData.payoutPerWorker} onChange={(e) => setFormData({ ...formData, payoutPerWorker: e.target.value })} required />
                    </div>
                  </div>
                </div>

                {/* Target Region */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Globe className="h-4 w-4" />Target Region</Label>
                  <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                    <SelectTrigger><SelectValue placeholder="Select target region" /></SelectTrigger>
                    <SelectContent>
                      {TARGET_REGIONS.map((region) => (<SelectItem key={region.value} value={region.value}>{region.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  {selectedRegion === "custom" && (
                    <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                      <div className="flex flex-wrap gap-2">
                        {AFRICAN_COUNTRIES.map((country) => (
                          <Button key={country} type="button" variant={selectedCountries.includes(country) ? "default" : "outline"} size="sm" onClick={() => toggleCountry(country)}>{country}</Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Cost Preview */}
                {formData.payoutPerWorker && formData.requiredWorkers && (
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Estimated Total</span>
                      <div className="text-right">
                        <p className="text-xl font-bold">{totalCost.toFixed(4)} ETH</p>
                        <p className="text-sm text-muted-foreground">≈ ${totalCostUSD}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formData.payoutPerWorker} ETH × {formData.requiredWorkers} workers + {(CONFIG.PLATFORM_FEE_PERCENTAGE)}% fee
                    </p>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
                  Continue to Funding
                </Button>
              </form>
            ) : step === "fund" ? (
              <div className="space-y-6">
                {/* Task Summary */}
                <div className="p-4 rounded-lg bg-muted/50">
                  <h3 className="font-semibold mb-3">{createdTask?.title}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Category</span><span>{taskTypes.find(t => t.id === formData.taskTypeId)?.description}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Payout/Worker</span><span>{payoutETH} ETH</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Workers</span><span>{workers}</span></div>
                    <hr />
                    <div className="flex justify-between"><span>Subtotal</span><span>{subtotal.toFixed(4)} ETH</span></div>
                    <div className="flex justify-between"><span>Platform Fee (15%)</span><span>{platformFee.toFixed(4)} ETH</span></div>
                    <div className="flex justify-between font-bold text-lg"><span>Total Required</span><span className="text-primary">{totalCost.toFixed(4)} ETH</span></div>
                  </div>
                </div>

                {/* Wallet Connection */}
                {!walletConnected ? (
                  <div className="p-4 rounded-lg border border-amber-500/50 bg-amber-500/10">
                    <div className="flex items-center gap-3 mb-3">
                      <AlertCircle className="h-5 w-5 text-amber-500" />
                      <div>
                        <p className="font-medium">Connect your wallet</p>
                        <p className="text-sm text-muted-foreground">You need ETH to fund the task</p>
                      </div>
                    </div>
                    <Button onClick={connectWallet} className="w-full" disabled={switchingNetwork}>
                      {switchingNetwork ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wallet className="h-4 w-4 mr-2" />}
                      Connect Wallet
                    </Button>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg border border-green-500/50 bg-green-500/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Wallet Connected</p>
                        <p className="text-sm text-muted-foreground">{walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{parseFloat(walletBalance).toFixed(4)} ETH</p>
                        <p className={`text-sm ${hasEnoughBalance ? "text-green-600" : "text-red-500"}`}>
                          {hasEnoughBalance ? "✓ Sufficient" : "⚠️ Insufficient"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button variant="outline" onClick={() => setStep("create")} className="flex-1" disabled={loading}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button onClick={handleFundTask} className="flex-1" disabled={loading || !walletConnected || !hasEnoughBalance}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wallet className="h-4 w-4 mr-2" />}
                    Fund with ETH
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Task Created & Funded!</h3>
                <p className="text-muted-foreground">Your task is now live and workers can start working on it.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
