import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedFromRequest } from "@/lib/auth";
import { getSettings, saveSettings, HomepageSettings } from "@/lib/settings";

export async function GET() {
  return NextResponse.json(getSettings());
}

export async function PATCH(request: NextRequest) {
  if (!(await isAuthenticatedFromRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = (await request.json()) as Partial<HomepageSettings>;
  const current = getSettings();

  const updated: HomepageSettings = {
    sections: data.sections ?? current.sections,
    hero: { ...current.hero, ...(data.hero ?? {}) },
    about: { ...current.about, ...(data.about ?? {}) },
  };

  saveSettings(updated);
  return NextResponse.json(updated);
}
