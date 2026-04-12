import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";

describe("POST /api/credit-purchases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    const { POST } = await import("./route");

    const request = new Request("http://localhost/api/credit-purchases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pack_id: "pack-1",
        method: "jazzcash",
        transaction_ref: "TXN-123",
      }),
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error).toBe("Unauthorized");
  });

  it("returns 400 for invalid screenshot_url", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }),
      },
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    const { POST } = await import("./route");

    const request = new Request("http://localhost/api/credit-purchases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pack_id: "pack-1",
        method: "jazzcash",
        transaction_ref: "TXN-123",
        screenshot_url: "ftp://malformed-proof",
      }),
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe("screenshot_url must be a valid http(s) URL");
  });

  it("creates a purchase successfully", async () => {
    const expectedPurchase = {
      id: "purchase-1",
      user_id: "user-1",
      pack_id: "pack-1",
      credits: 100,
      amount_pkr: 500,
      method: "jazzcash",
      transaction_ref: "TXN-123",
      screenshot_url: "https://example.com/proof.png",
      status: "pending",
    };

    const singlePack = vi.fn().mockResolvedValue({
      data: { id: "pack-1", credits: 100, price_pkr: 500, is_active: true },
      error: null,
    });
    const eqPack = vi.fn().mockReturnValue({ single: singlePack });
    const selectPack = vi.fn().mockReturnValue({ eq: eqPack });

    const singlePurchase = vi.fn().mockResolvedValue({
      data: expectedPurchase,
      error: null,
    });
    const selectPurchase = vi.fn().mockReturnValue({ single: singlePurchase });
    const insertPurchase = vi.fn().mockReturnValue({ select: selectPurchase });

    const from = vi.fn((table: string) => {
      if (table === "credit_packs") {
        return { select: selectPack };
      }
      if (table === "credit_purchases") {
        return { insert: insertPurchase };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }),
      },
      from,
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    const { POST } = await import("./route");

    const request = new Request("http://localhost/api/credit-purchases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pack_id: "pack-1",
        method: "jazzcash",
        transaction_ref: "TXN-123",
        screenshot_url: "https://example.com/proof.png",
      }),
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload).toEqual(expectedPurchase);
    expect(insertPurchase).toHaveBeenCalledWith({
      user_id: "user-1",
      pack_id: "pack-1",
      credits: 100,
      amount_pkr: 500,
      method: "jazzcash",
      transaction_ref: "TXN-123",
      screenshot_url: "https://example.com/proof.png",
      status: "pending",
    });
  });
});
