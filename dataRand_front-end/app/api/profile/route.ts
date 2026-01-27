import { createServerClient } from "@supabase/ssr";
import { cookies as nextCookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Profile API received request:", body);

    const { auth_id, email, full_name } = body;

    if (!auth_id) {
      console.error("Missing required field: auth_id");
      return NextResponse.json(
        { message: "auth_id is required" },
        { status: 400 }
      );
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Supabase environment variables are not set.");
      return NextResponse.json(
        { message: "Server configuration error: Supabase URL and Service Role Key are required." },
        { status: 500 }
      );
    }

    const cookieStore = nextCookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      // Use the service_role key to bypass RLS for profile creation
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        cookies: {
          async getAll() {
            return (await cookieStore).getAll();
          },
          async setAll(cookiesToSet) {
            const resolvedCookieStore = await cookieStore;
            cookiesToSet.forEach(({ name, value, options }) => {
              resolvedCookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    // First check if profile already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from("profiles")
      .select("*")
      .eq("auth_id", auth_id)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is "not found" error, which is fine
      console.error("Error checking existing profile:", checkError);
      return NextResponse.json(
        { message: "Error checking profile", error: checkError.message },
        { status: 500 }
      );
    }

    if (existingProfile) {
      console.log("Profile already exists:", existingProfile);
      return NextResponse.json(
        { message: "Profile already exists", data: existingProfile },
        { status: 200 }
      );
    }

    // Create new profile (without role field)
    console.log("Creating new profile for auth_id:", auth_id);
    
    const { data, error } = await supabase
      .from("profiles")
      .insert([{ auth_id, email, full_name }])
      .select()
      .single();

    if (error) {
      console.error("Error creating profile:", error);
      return NextResponse.json(
        { message: "Error creating profile", error: error.message },
        { status: 500 }
      );
    }

    console.log("Profile created successfully:", data);

    return NextResponse.json(
      { message: "Profile created successfully", data },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unexpected error in profile API:", error);
    return NextResponse.json(
      { 
        message: "Unexpected error", 
        error: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}