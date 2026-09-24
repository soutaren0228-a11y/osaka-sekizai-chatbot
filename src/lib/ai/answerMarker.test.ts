import { describe, expect, it } from "vitest";
import { createMarkerStripper } from "./answerMarker";

describe("createMarkerStripper", () => {
  it("strips a marker delivered in a single chunk", () => {
    const stripper = createMarkerStripper();
    const visible = stripper.push("[STATUS:ANSWERED]\nこんにちは");
    expect(visible).toBe("こんにちは");
    expect(stripper.getStatus()).toBe("answered");
  });

  it("strips a marker split across multiple small chunks", () => {
    const stripper = createMarkerStripper();
    let visible = "";
    visible += stripper.push("[STATUS:UNAN");
    visible += stripper.push("SWERED]\n");
    visible += stripper.push("お答えできません");
    expect(visible).toBe("お答えできません");
    expect(stripper.getStatus()).toBe("unanswered");
  });

  it("recognizes the refused status", () => {
    const stripper = createMarkerStripper();
    stripper.push("[STATUS:REFUSED]\nお断りします");
    expect(stripper.getStatus()).toBe("refused");
  });

  it("passes text through once the marker has been resolved, chunk by chunk", () => {
    const stripper = createMarkerStripper();
    stripper.push("[STATUS:ANSWERED]\n");
    const first = stripper.push("こんにちは、");
    const second = stripper.push("大阪石材です。");
    expect(first).toBe("こんにちは、");
    expect(second).toBe("大阪石材です。");
  });

  it("falls back to passing text through if no marker is ever found", () => {
    const stripper = createMarkerStripper();
    const longText = "マーカーの無い応答".repeat(10);
    const visible = stripper.push(longText);
    expect(visible.length).toBeGreaterThan(0);
    expect(stripper.getStatus()).toBe("answered");
  });
});
