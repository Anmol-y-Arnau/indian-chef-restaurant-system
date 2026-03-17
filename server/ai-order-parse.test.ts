import { describe, expect, it, vi, beforeEach } from "vitest";
import type { TrpcContext } from "./_core/context";

// Mock the LLM module before importing the router
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

import { appRouter } from "./routers";
import { invokeLLM } from "./_core/llm";

const mockInvokeLLM = vi.mocked(invokeLLM);

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

const sampleCatalog = [
  { id: "cc4", number: 29, name: "Murg Tikka Masala", price: 11.90, category: "chicken_curry" },
  { id: "vc6", number: 23, name: "Dal Makhni", price: 9.90, category: "veg_curry" },
  { id: "sd1", number: 85, name: "Garlic Naan", price: 3.50, category: "sides" },
  { id: "dr1", number: 91, name: "Coca-Cola", price: 2.50, category: "drinks" },
];

describe("restaurant.parseOrderWithAI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns parsed items from AI response", async () => {
    const mockAIResponse = {
      items: [
        {
          itemId: "cc4",
          itemName: "Murg Tikka Masala",
          quantity: 2,
          spiceLevel: "+",
          confidence: "high" as const,
          originalText: "2 tikka masala picante",
        },
        {
          itemId: "sd1",
          itemName: "Garlic Naan",
          quantity: 1,
          spiceLevel: null,
          confidence: "high" as const,
          originalText: "1 naan",
        },
      ],
      unrecognized: [],
    };

    mockInvokeLLM.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(mockAIResponse) } }],
    } as any);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.restaurant.parseOrderWithAI({
      text: "2 tikka masala picante y 1 naan",
      menuCatalog: sampleCatalog,
    });

    expect(result.items).toHaveLength(2);
    expect(result.items[0].itemId).toBe("cc4");
    expect(result.items[0].quantity).toBe(2);
    expect(result.items[0].spiceLevel).toBe("+");
    expect(result.items[1].itemId).toBe("sd1");
    expect(result.unrecognized).toHaveLength(0);
  });

  it("returns unrecognized items when AI cannot match", async () => {
    const mockAIResponse = {
      items: [
        {
          itemId: "vc6",
          itemName: "Dal Makhni",
          quantity: 1,
          spiceLevel: null,
          confidence: "high" as const,
          originalText: "dal makhni",
        },
      ],
      unrecognized: ["pizza margarita"],
    };

    mockInvokeLLM.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(mockAIResponse) } }],
    } as any);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.restaurant.parseOrderWithAI({
      text: "dal makhni y pizza margarita",
      menuCatalog: sampleCatalog,
    });

    expect(result.items).toHaveLength(1);
    expect(result.unrecognized).toContain("pizza margarita");
  });

  it("handles empty items response gracefully", async () => {
    const mockAIResponse = {
      items: [],
      unrecognized: ["algo incomprensible"],
    };

    mockInvokeLLM.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(mockAIResponse) } }],
    } as any);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.restaurant.parseOrderWithAI({
      text: "algo incomprensible",
      menuCatalog: sampleCatalog,
    });

    expect(result.items).toHaveLength(0);
    expect(result.unrecognized).toHaveLength(1);
  });

  it("throws error when AI returns invalid JSON", async () => {
    mockInvokeLLM.mockResolvedValueOnce({
      choices: [{ message: { content: "esto no es json" } }],
    } as any);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.restaurant.parseOrderWithAI({
        text: "2 butter chicken",
        menuCatalog: sampleCatalog,
      })
    ).rejects.toThrow();
  });

  it("validates input: rejects empty text", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.restaurant.parseOrderWithAI({
        text: "",
        menuCatalog: sampleCatalog,
      })
    ).rejects.toThrow();
  });
});
