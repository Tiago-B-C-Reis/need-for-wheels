import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"
const SUPPORTED_PATHS = new Set(["register", "login", "verify", "oauth"])

async function forward(req: NextRequest, pathSegments: string[]) {
  if (!pathSegments || pathSegments.length === 0) {
    return NextResponse.json({ detail: "Missing path" }, { status: 404 })
  }
  const target = pathSegments.join("/")
  if (!SUPPORTED_PATHS.has(pathSegments[0])) {
    return NextResponse.json({ detail: "Not found" }, { status: 404 })
  }

  const url = `${BACKEND_URL}/api/v1/auth/${target}`
  const headers: Record<string, string> = {}
  const contentType = req.headers.get("content-type")
  if (contentType) headers["content-type"] = contentType
  const authorization = req.headers.get("authorization")
  if (authorization) headers["authorization"] = authorization

  const body = await req.text()

  let backendResponse: Response
  try {
    backendResponse = await fetch(url, {
      method: req.method,
      headers,
      body: req.method === "GET" || req.method === "HEAD" ? undefined : body,
      cache: "no-store",
    })
  } catch (err: any) {
    return NextResponse.json(
      { detail: err?.message || "Unable to reach authentication service" },
      { status: 502 },
    )
  }

  const responseBody = await backendResponse.text()
  const responseHeaders = new Headers()
  const backendType = backendResponse.headers.get("content-type")
  if (backendType) {
    responseHeaders.set("content-type", backendType)
  }

  return new NextResponse(responseBody, {
    status: backendResponse.status,
    headers: responseHeaders,
  })
}

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  return forward(req, params.path)
}

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  return forward(req, params.path)
}

export async function PUT(req: NextRequest, { params }: { params: { path: string[] } }) {
  return forward(req, params.path)
}

export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) {
  return forward(req, params.path)
}

export async function PATCH(req: NextRequest, { params }: { params: { path: string[] } }) {
  return forward(req, params.path)
}
