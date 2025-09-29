// app/api/escalate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: NextRequest) {
  const { title, details, category, userId, district } = await req.json();

  try {
    // Find an officer in the user's district
    const { data: officers, error: officerError } = await supabase
      .from("users")
      .select("id")
      .eq("district", district)
      .eq("role", "agri-officer");

    if (officerError || !officers || officers.length === 0) {
      throw new Error("No agricultural officer found for your district.");
    }

    const assignedOfficer = officers[Math.floor(Math.random() * officers.length)];

    const { data: questionData, error: questionError } = await supabase
      .from("escalated_questions")
      .insert({
        user_id: userId,
        officer_id: assignedOfficer.id,
        title,
        details,
        category,
      })
      .select()
      .single();

    if (questionError) throw questionError;

    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        user_id: assignedOfficer.id,
        message: `New escalated question from a user in your district: "${title}"`,
        related_question_id: questionData.id,
      });

    if (notificationError) throw notificationError;

    return NextResponse.json({ success: true, message: "Question escalated successfully." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}