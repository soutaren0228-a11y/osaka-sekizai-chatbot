import { describe, expect, it } from "vitest";
import {
  appendContact,
  buildContact,
  matchBannedTopic,
  toTelHref,
} from "./templates";
import type { BannedTopic, PersonaSettings } from "@/lib/data/persona";

function topic(label: string, enabled = true): BannedTopic {
  return { id: label, label, enabled, isPreset: true };
}

describe("matchBannedTopic", () => {
  it("matches a preset topic via its associated keyword hints", () => {
    const topics = [topic("他社との比較")];
    expect(matchBannedTopic("他社と比較してどちらが安いですか", topics)?.label).toBe(
      "他社との比較"
    );
  });

  it("does not match when the topic is disabled", () => {
    const topics = [topic("値引きの交渉", false)];
    expect(matchBannedTopic("もっと安くなりませんか", topics)).toBeUndefined();
  });

  it("falls back to matching the label text for custom topics", () => {
    const topics = [topic("施工の日程についての確約")];
    expect(
      matchBannedTopic("施工の日程についての確約はできますか", topics)?.label
    ).toBe("施工の日程についての確約");
  });

  it("returns undefined when nothing matches", () => {
    const topics = [topic("他社との比較")];
    expect(matchBannedTopic("お墓じまいの費用を教えてください", topics)).toBeUndefined();
  });
});

describe("toTelHref", () => {
  it("strips non-numeric characters", () => {
    expect(toTelHref("0120-1114-90")).toBe("tel:0120111490");
  });
});

describe("buildContact / appendContact", () => {
  const persona: PersonaSettings = {
    tone: "polite",
    bannedTopics: [],
    contactPhone: "0120-1114-90",
    contactUrl: "https://www.osaka-sekizai.jp/contact/",
  };

  it("builds a contact object from persona settings", () => {
    const contact = buildContact(persona);
    expect(contact).toEqual({
      phone: "0120-1114-90",
      phoneHref: "tel:0120111490",
      contactUrl: "https://www.osaka-sekizai.jp/contact/",
    });
  });

  it("appends contact info to a message", () => {
    const contact = buildContact(persona);
    const message = appendContact("お答えできませんでした。", contact);
    expect(message).toContain("お答えできませんでした。");
    expect(message).toContain("0120-1114-90");
    expect(message).toContain("https://www.osaka-sekizai.jp/contact/");
  });
});
