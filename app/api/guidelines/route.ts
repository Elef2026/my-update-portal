import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { DEFAULT_GUIDELINE_DATA, getSystemGuidelines, SystemGuidelineData } from "@/lib/defaultGuidelines";

export async function GET() {
  try {
    const data = await getSystemGuidelines();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching guidelines:", error);
    return NextResponse.json(DEFAULT_GUIDELINE_DATA, { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin only." }, { status: 401 });
    }

    const body = (await request.json()) as Partial<SystemGuidelineData>;

    const title = body.title || DEFAULT_GUIDELINE_DATA.title;
    const headerNotice = body.headerNotice || DEFAULT_GUIDELINE_DATA.headerNotice;
    const items = Array.isArray(body.items) ? body.items : DEFAULT_GUIDELINE_DATA.items;
    const footerNoticeTitle = body.footerNoticeTitle || DEFAULT_GUIDELINE_DATA.footerNoticeTitle;
    const footerRules = Array.isArray(body.footerRules) ? body.footerRules : DEFAULT_GUIDELINE_DATA.footerRules;

    const dataToSave: SystemGuidelineData = {
      title,
      headerNotice,
      items,
      footerNoticeTitle,
      footerRules,
    };

    const existing = await prisma.systemGuideline.findFirst({
      orderBy: { createdAt: "desc" },
    });

    let result;
    if (existing) {
      result = await prisma.systemGuideline.update({
        where: { id: existing.id },
        data: {
          title,
          headerNotice,
          footerNotice: footerRules.join("\n"),
          contentJson: dataToSave as any,
        },
      });
    } else {
      result = await prisma.systemGuideline.create({
        data: {
          title,
          headerNotice,
          footerNotice: footerRules.join("\n"),
          contentJson: dataToSave as any,
        },
      });
    }

    return NextResponse.json({ success: true, data: result.contentJson });
  } catch (error: any) {
    console.error("Error saving guidelines:", error);
    return NextResponse.json({ error: error.message || "Failed to save guidelines" }, { status: 500 });
  }
}
