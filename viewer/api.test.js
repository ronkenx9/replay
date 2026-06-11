import { describe, expect, it } from "vitest";
import { replayApiUrl } from "./api.js";
describe("replayApiUrl", () => {
    it("uses localhost as the local development default", () => {
        expect(replayApiUrl("/api/runs")).toBe("http://localhost:4174/api/runs");
    });
    it("uses a configured base URL without duplicating slashes", () => {
        expect(replayApiUrl("/api/verify", "https://api.replay.example/")).toBe("https://api.replay.example/api/verify");
    });
});
//# sourceMappingURL=api.test.js.map