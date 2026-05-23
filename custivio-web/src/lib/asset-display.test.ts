import { describe, expect, it } from "vitest";
import type { AssetRecord } from "@/lib/api/assets";
import {
  buildAssetReferenceLookups,
  emptyAssetReferenceData,
  formatAssetLocation,
  formatCustodian,
  formatRelatedRecord,
  formatTechnicalId,
  uniqueOptions,
} from "@/lib/asset-display";

describe("asset display helpers", () => {
  it("deduplicates dropdown options by value and label", () => {
    expect(
      uniqueOptions([
        { value: "type-1", label: "Laptop" },
        { value: "type-1", label: "Laptop" },
        { value: "type-2", label: "Laptop" },
        { value: "type-3", label: "Server" },
      ]),
    ).toEqual([
      { value: "type-1", label: "Laptop" },
      { value: "type-3", label: "Server" },
    ]);
  });

  it("formats related records, users, location paths, and technical ids", () => {
    const lookups = buildAssetReferenceLookups({
      ...emptyAssetReferenceData,
      types: [{ id: "type-1", name: "Laptop", key: "laptop" }],
      sites: [{ id: "site-1", code: "BLR", name: "Bengaluru DC" }],
      rooms: [{ id: "room-1", code: "MDF", name: "Main Distribution" }],
      users: [
        {
          id: "user-1",
          email: "owner@example.test",
          displayName: "Asset Owner",
          status: "active",
          jobTitle: null,
        },
      ],
    });
    const asset: AssetRecord = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      assetTag: "LAP-001",
      name: "Laptop",
      assetTypeId: "type-1",
      siteId: "site-1",
      roomId: "room-1",
      custodianUserId: "user-1",
    };

    expect(formatRelatedRecord(lookups.types, asset.assetTypeId)).toBe("Laptop (laptop)");
    expect(formatCustodian(lookups, asset.custodianUserId)).toBe(
      "Asset Owner (owner@example.test)",
    );
    expect(formatAssetLocation(asset, lookups)).toBe(
      "BLR - Bengaluru DC / MDF - Main Distribution",
    );
    expect(formatTechnicalId(asset.id)).toBe("123e4567...4000");
  });
});
