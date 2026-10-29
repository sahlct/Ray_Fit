import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.platformRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "10"));
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");
    const plan = searchParams.get("plan");

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { contactEmail: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (plan && plan !== "ALL") {
      where.subscriptionPlan = { contains: plan, mode: "insensitive" };
    }

    const [total, tenants, recentPayments] = await Promise.all([
      prisma.tenant.count({ where }),
      prisma.tenant.findMany({
        where,
        include: {
          _count: {
            select: {
              users: true,
              wearableDevices: true,
            },
          },
          subscriptionPayments: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.tenantSubscriptionPayment.findMany({
        include: {
          tenant: {
            select: { name: true, slug: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    return NextResponse.json({
      tenants,
      recentPayments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err: any) {
    console.error("GET /api/admin/subscriptions error:", err);
    return NextResponse.json({ error: "Failed to fetch subscriptions." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.platformRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 403 });
    }

    const body = await request.json();
    const {
      tenantId,
      amount,
      planTier = "STARTER",
      billingCycle = "MONTHLY",
      paymentMethod = "CARD",
      transactionRef,
      durationMonths = 1,
      notes,
    } = body;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant is required." }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found." }, { status: 404 });
    }

    const validUntil = new Date();
    validUntil.setMonth(validUntil.getMonth() + parseInt(String(durationMonths) || "1"));

    // Transactional: Create subscription payment and update tenant status/plan
    const payment = await prisma.$transaction(
      async (tx) => {
        const p = await tx.tenantSubscriptionPayment.create({
          data: {
            tenantId,
            amount: parseFloat(String(amount || 0)),
            planTier,
            billingCycle,
            paymentMethod,
            transactionRef: transactionRef || `PAY-${Date.now().toString(36).toUpperCase()}`,
            validUntil,
            notes: notes || `Subscription payment for ${planTier} plan`,
            status: "ACTIVE",
          },
        });

        await tx.tenant.update({
          where: { id: tenantId },
          data: {
            subscriptionPlan: planTier.toLowerCase(),
            status: "ACTIVE",
          },
        });

        // Write audit log
        await tx.auditLog.create({
          data: {
            tenantId,
            userId: session.id,
            action: "SUBSCRIPTION_PAYMENT_RECORDED",
            module: "SUBSCRIPTIONS",
            details: {
              amount,
              planTier,
              billingCycle,
              validUntil,
              transactionRef: p.transactionRef,
            },
          },
        });

        return p;
      },
      {
        maxWait: 15000,
        timeout: 30000,
      }
    );

    return NextResponse.json({
      success: true,
      message: `Subscription payment of $${amount} recorded for ${tenant.name}.`,
      payment,
    });
  } catch (err: any) {
    console.error("POST /api/admin/subscriptions error:", err);
    return NextResponse.json({ error: "Failed to record subscription payment." }, { status: 500 });
  }
}
