"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SupabaseDebugger } from "@/lib/supabase-debug";

export function SupabaseTestPanel() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runTest = async () => {
    setLoading(true);
    console.clear(); // Clear console for clean debugging
    
    try {
      const diagnostic = await SupabaseDebugger.runFullDiagnostic();
      setResults(diagnostic);
    } catch (error) {
      console.error("Test failed:", error);
      setResults({ error: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: boolean) => (
    <Badge variant={status ? "default" : "destructive"}>
      {status ? "✓ Pass" : "✗ Fail"}
    </Badge>
  );

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Supabase Configuration Test
          <Button onClick={runTest} disabled={loading}>
            {loading ? "Testing..." : "Run Test"}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {results && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Environment Variables</span>
              {getStatusBadge(results.environment)}
            </div>
            <div className="flex items-center justify-between">
              <span>Database Connection</span>
              {getStatusBadge(results.connection)}
            </div>
            <div className="flex items-center justify-between">
              <span>Tasks Table Access</span>
              {getStatusBadge(results.tasksTable)}
            </div>
            <div className="flex items-center justify-between">
              <span>Task Types Table Access</span>
              {getStatusBadge(results.taskTypesTable)}
            </div>
            
            {results.error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive font-medium">Error:</p>
                <p className="text-sm text-destructive">{results.error}</p>
              </div>
            )}
          </div>
        )}
        
        <div className="text-sm text-muted-foreground">
          <p>Check the browser console for detailed debugging information.</p>
          <p>Make sure your .env.local file contains:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>NEXT_PUBLIC_SUPABASE_URL</li>
            <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
