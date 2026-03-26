import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/test-payback
 * Creates a test withdrawal request for the admin user.
 * This simulates what happens when a real user requests a payback withdrawal.
 */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    // Create a test withdrawal request
    const testAmount = parseFloat((Math.random() * 50 + 10).toFixed(2)); // $10-60
    const testNetworks = ["TRC20", "ERC20", "BEP20"];
    const testNetwork = testNetworks[Math.floor(Math.random() * testNetworks.length)];
    const testAddress = `T${Array.from({ length: 33 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz123456789"[Math.floor(Math.random() * 58)]).join("")}`;

    const withdrawal = await prisma.withdrawal.create({
      data: {
        userId: user.id,
        amount: testAmount,
        address: testAddress,
        network: testNetwork,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      id: withdrawal.id,
      amount: testAmount,
      network: testNetwork,
      address: testAddress,
      message: "Test withdrawal request created. Go to Admin Panel → Payback Requests to see it.",
    });
  } catch (error) {
    console.error("[test-payback]", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
