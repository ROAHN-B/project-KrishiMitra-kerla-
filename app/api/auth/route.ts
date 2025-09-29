// app/api/auth/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      mobileNumber,
      firstName,
      lastName,
      state,
      district,
      taluka,
      village,
      language,
      role,
      officerCode,
      isSignUp,
    } = body;

    if (!mobileNumber) {
      return NextResponse.json({ error: "Mobile number is required." }, { status: 400 });
    }

    if (isSignUp) {
      // --- SIGN UP LOGIC ---
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("mobile_number", mobileNumber)
        .single();
        
      if (existingUser) {
        return NextResponse.json(
          { error: "Mobile number already registered. Please log in." },
          { status: 409 }
        );
      }

      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert({
          mobile_number: mobileNumber,
          first_name: firstName,
          last_name: lastName,
          state,
          district,
          taluka,
          village,
          language,
          role: 'user', // All new sign-ups are regular users
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return NextResponse.json(newUser);

    } else {
      // --- LOGIN LOGIC ---
      const { data: user, error: selectError } = await supabase
        .from("users")
        .select("*")
        .eq("mobile_number", mobileNumber)
        .single();

      if (selectError || !user) {
        return NextResponse.json(
          { error: "User not found. Please sign up." },
          { status: 404 }
        );
      }
      
      if (role === 'agri-officer') {
        if (user.role !== 'agri-officer' || user.officer_code !== officerCode) {
            return NextResponse.json(
                { error: "Invalid credentials for Agri-Officer role." },
                { status: 401 }
            );
        }
      }

      return NextResponse.json(user);
    }
  } catch (error: any) {
    console.error("Authentication API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred on the server." },
      { status: 500 }
    );
  }
}