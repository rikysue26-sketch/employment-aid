import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");

  const where: any = {};
  if (status) where.status = status;
  if (search) { where.OR = [{ title: { contains: search } }, { enterprise: { name: { contains: search } } }]; }

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({ where, include: { enterprise: true }, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.job.count({ where }),
  ]);
  return NextResponse.json({ jobs, total, page, totalPages: Math.ceil(total / pageSize) });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  if (action === "create" || action === "update") {
    const { id, enterpriseId, title, city, degreeReq, majorReq, skillReq, salaryRange, deadline, headcount, status, certReq } = body;
    const data = { enterpriseId, title, city, degreeReq, majorReq: majorReq || null, skillReq: JSON.stringify(skillReq || []), salaryRange, deadline: deadline ? new Date(deadline) : null, headcount: headcount || 1, status: status || "open", certReq: certReq || null };
    if (action === "create") {
      const job = await prisma.job.create({ data });
      return NextResponse.json({ success: true, job });
    } else {
      const job = await prisma.job.update({ where: { id }, data });
      return NextResponse.json({ success: true, job });
    }
  }

  if (action === "batch-match") {
    const { studentIds } = body;
    const results: any[] = [];
    for (const sid of studentIds) {
      const res = await fetch(`${request.nextUrl.origin}/api/match`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: sid, action: "match" }),
      });
      const data = await res.json();
      results.push({ studentId: sid, count: data.results?.length || 0 });
    }
    return NextResponse.json({ results });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
