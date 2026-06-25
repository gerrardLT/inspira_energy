CREATE TYPE "public"."contact_form_type" AS ENUM('investor', 'general');--> statement-breakpoint
CREATE TYPE "public"."newsletter_status" AS ENUM('active', 'unsubscribed');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('pending', 'contacted', 'closed');--> statement-breakpoint
CREATE TABLE "contact_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_type" "contact_form_type" NOT NULL,
	"name" varchar(100) NOT NULL,
	"company" varchar(200),
	"position" varchar(100),
	"email" varchar(254) NOT NULL,
	"phone" varchar(20),
	"fund_types" jsonb,
	"regions" jsonb,
	"investment_size" varchar(50),
	"subject" varchar(200),
	"message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" "submission_status" DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "developer_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_name" varchar(200) NOT NULL,
	"contact_name" varchar(100) NOT NULL,
	"email" varchar(254) NOT NULL,
	"region" varchar(100) NOT NULL,
	"project_type" varchar(100) NOT NULL,
	"capacity_mw" numeric(8, 2) NOT NULL,
	"project_stage" varchar(100),
	"expected_construction_date" varchar(20),
	"notes" text,
	"file_paths" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" "submission_status" DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lp_interest_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"institution" varchar(200) NOT NULL,
	"position" varchar(100),
	"email" varchar(254) NOT NULL,
	"phone" varchar(20),
	"fund_types" jsonb NOT NULL,
	"regions" jsonb DEFAULT '[]'::jsonb,
	"investment_size" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" "submission_status" DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(254) NOT NULL,
	"subscribed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" "newsletter_status" DEFAULT 'active' NOT NULL,
	"unsubscribe_token" uuid DEFAULT gen_random_uuid() NOT NULL,
	CONSTRAINT "newsletter_subscriptions_email_unique" UNIQUE("email"),
	CONSTRAINT "newsletter_subscriptions_unsubscribe_token_unique" UNIQUE("unsubscribe_token")
);
