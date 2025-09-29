// app/api/answer-escalated/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: NextRequest) {
  const { questionId, answer } = await req.json();

  try {
    const { data: question, error: fetchError } = await supabase
      .from("escalated_questions")
      .select("user_id")
      .eq("id", questionId)
      .single();

    if (fetchError || !question) {
      throw new Error("Could not find the original question.");
    }

    const { error: updateError } = await supabase
      .from("escalated_questions")
      .update({ status: "resolved", answer: answer, resolved_at: new Date() })
      .eq("id", questionId);

    if (updateError) throw updateError;

    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        user_id: question.user_id,
        message: `Your question has been answered by an agricultural officer.`,
        related_question_id: questionId,
      });

    if (notificationError) throw notificationError;

    return NextResponse.json({ success: true, message: "Answer submitted successfully." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}