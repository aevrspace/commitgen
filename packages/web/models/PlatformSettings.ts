import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * PlatformSettings Model
 *
 * Singleton document pattern - only one settings document exists.
 * Stores platform-wide configurable values like pricing.
 */
export interface IPlatformSettings extends Document {
  creditsPerUsd: number;
  minPurchaseCredits: number;
  freeCreditsOnSignup: number;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

interface IPlatformSettingsModel extends Model<IPlatformSettings> {
  getSettings(): Promise<IPlatformSettings>;
  updateSettings(
    updates: Partial<
      Pick<
        IPlatformSettings,
        "creditsPerUsd" | "minPurchaseCredits" | "freeCreditsOnSignup"
      >
    >,
    updatedBy?: mongoose.Types.ObjectId
  ): Promise<IPlatformSettings>;
}

const PlatformSettingsSchema = new Schema<IPlatformSettings>(
  {
    creditsPerUsd: { type: Number, required: true, default: 80 },
    minPurchaseCredits: { type: Number, required: true, default: 10 },
    freeCreditsOnSignup: { type: Number, required: true, default: 50 },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

/**
 * Get the singleton settings document, creating with defaults if it doesn't exist.
 */
PlatformSettingsSchema.statics.getSettings =
  async function (): Promise<IPlatformSettings> {
    let settings = await this.findOne();
    if (!settings) {
      settings = await this.create({
        creditsPerUsd: 80,
        minPurchaseCredits: 10,
        freeCreditsOnSignup: 50,
      });
    }
    return settings;
  };

/**
 * Update the singleton settings document.
 */
PlatformSettingsSchema.statics.updateSettings = async function (
  updates: Partial<
    Pick<
      IPlatformSettings,
      "creditsPerUsd" | "minPurchaseCredits" | "freeCreditsOnSignup"
    >
  >,
  updatedBy?: mongoose.Types.ObjectId
): Promise<IPlatformSettings> {
  // Get or create settings document
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({
      creditsPerUsd: 80,
      minPurchaseCredits: 10,
      freeCreditsOnSignup: 50,
    });
  }

  if (updates.creditsPerUsd !== undefined) {
    settings.creditsPerUsd = updates.creditsPerUsd;
  }
  if (updates.minPurchaseCredits !== undefined) {
    settings.minPurchaseCredits = updates.minPurchaseCredits;
  }
  if (updates.freeCreditsOnSignup !== undefined) {
    settings.freeCreditsOnSignup = updates.freeCreditsOnSignup;
  }
  if (updatedBy) {
    settings.updatedBy = updatedBy;
  }

  await settings.save();
  return settings;
};

// Check if model already exists to prevent overwrite error in hot reload
const PlatformSettings: IPlatformSettingsModel =
  (mongoose.models.PlatformSettings as IPlatformSettingsModel) ||
  mongoose.model<IPlatformSettings, IPlatformSettingsModel>(
    "PlatformSettings",
    PlatformSettingsSchema
  );

export default PlatformSettings;
