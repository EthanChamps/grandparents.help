CREATE TABLE "usage_quotas" (
	"auth_user_id" text PRIMARY KEY NOT NULL,
	"question_count" integer DEFAULT 0 NOT NULL,
	"last_question_date" date,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
