import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { pgTable, text, timestamp, json } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

export const satisfactionLevels = ["애매함", "나쁘지 않음", "맛있음", "개쩜"] as const;
export const tweetTones = ["솔직톤", "드립톤", "극단톤"] as const;

export const generateTweetRequestSchema = z.object({
  images: z.array(z.string()).min(1).max(4), // base64 encoded images
  restaurantName: z.string().optional(),
  menus: z.array(z.string()).min(1),
  satisfaction: z.enum(satisfactionLevels),
});

export const tweetVariationSchema = z.object({
  content: z.string(),
  tone: z.enum(tweetTones),
});

export const generateTweetResponseSchema = z.object({
  variations: z.array(tweetVariationSchema),
  shareId: z.string().optional(),
});

// Database tables
export const sharedTweets = pgTable("shared_tweets", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  images: json("images").$type<string[]>().notNull(),
  restaurantName: text("restaurant_name"),
  menus: json("menus").$type<string[]>().notNull(),
  satisfaction: text("satisfaction").$type<typeof satisfactionLevels[number]>().notNull(),
  variations: json("variations").$type<TweetVariation[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Additional schemas
export const shareRequestSchema = z.object({
  images: z.array(z.string()),
  restaurantName: z.string().optional(),
  menus: z.array(z.string()),
  satisfaction: z.enum(satisfactionLevels),
  variations: z.array(tweetVariationSchema),
});

export const insertSharedTweetSchema = createInsertSchema(sharedTweets);

export type GenerateTweetRequest = z.infer<typeof generateTweetRequestSchema>;
export type TweetVariation = z.infer<typeof tweetVariationSchema>;
export type GenerateTweetResponse = z.infer<typeof generateTweetResponseSchema>;
export type ShareRequest = z.infer<typeof shareRequestSchema>;
export type SharedTweet = typeof sharedTweets.$inferSelect;
export type InsertSharedTweet = z.infer<typeof insertSharedTweetSchema>;
