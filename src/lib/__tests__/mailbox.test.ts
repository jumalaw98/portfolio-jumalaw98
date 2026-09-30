import { describe, expect, it } from "vitest";
import { formatMailbox, isEmailAddress, normalizeMailbox, parseMailbox } from "@/lib/mailbox";

describe("mailbox parsing and formatting", () => {
    it("accepts valid bare addresses and rejects mailbox delimiters", () => {
        expect(isEmailAddress("jane.doe+tag@example.com")).toBe(true);
        expect(isEmailAddress("jane<doe@example.com")).toBe(false);
        expect(isEmailAddress("jane.doe>@example.com")).toBe(false);
        expect(isEmailAddress("jane..doe@example.com")).toBe(false);
        expect(isEmailAddress("jane@example..com")).toBe(false);
        expect(isEmailAddress("jane@@example.com")).toBe(false);
        expect(normalizeMailbox("jane<doe@example.com", "fallback@example.com")).toBe(
            "fallback@example.com",
        );
    });

    it("quotes RFC 5322 special characters in display names", () => {
        const commaName = parseMailbox("Doe, Jane <jane@example.com>");
        const parentheticalName = parseMailbox("Jane Doe (Sales) <jane@example.com>");

        expect(commaName).not.toBeNull();
        expect(formatMailbox(commaName!)).toBe('"Doe, Jane" <jane@example.com>');
        expect(formatMailbox(parentheticalName!)).toBe('"Jane Doe (Sales)" <jane@example.com>');
        expect(formatMailbox({ name: "Jane Doe", address: "jane@example.com" })).toBe(
            "Jane Doe <jane@example.com>",
        );
    });

    it("parses and re-escapes quoted display names", () => {
        const mailbox = parseMailbox('"Doe, \\"Jane\\"" <jane@example.com>');

        expect(mailbox).toEqual({ name: 'Doe, "Jane"', address: "jane@example.com" });
        expect(normalizeMailbox('"Doe, \\"Jane\\"" <jane@example.com>', "fallback@example.com")).toBe(
            '"Doe, \\"Jane\\"" <jane@example.com>',
        );
    });
});