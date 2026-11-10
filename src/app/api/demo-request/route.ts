import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      fullName,
      organisationName,
      designation,
      email,
      phone,
      country,
      organisationType,
      participantCount,
      primaryObjective,
      additionalRequirements,
    } = body;

    if (!fullName || !organisationName || !email) {
      return NextResponse.json(
        { error: "Full Name, Organisation Name, and Business Email are required." },
        { status: 400 }
      );
    }

    // In production or demo mode, log the demo request
    console.log("📥 [RaysFit Demo Request Received]:", {
      fullName,
      organisationName,
      designation,
      email,
      phone,
      country,
      organisationType,
      participantCount,
      primaryObjective,
      additionalRequirements,
      receivedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Your demonstration request has been submitted successfully. Our team will contact you shortly.",
    });
  } catch (error: any) {
    console.error("[API POST /api/demo-request] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit demo request" },
      { status: 500 }
    );
  }
}

