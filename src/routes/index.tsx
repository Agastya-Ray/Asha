import { createFileRoute } from "@tanstack/react-router";
import { AshaApp } from "@/components/asha/asha-app";

export const Route = createFileRoute("/")({ component: AshaApp });
