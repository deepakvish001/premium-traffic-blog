import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — HomeFix Pro" },
      { name: "description", content: "Get in touch with the HomeFix Pro team." },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: () => (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-4xl font-bold">Contact us</h1>
      <p className="mt-4 text-muted-foreground">
        Have a question, correction, or topic request? Email{" "}
        <a className="text-primary underline" href="mailto:hello@homefixpro.example">
          hello@homefixpro.example
        </a>
        .
      </p>
    </div>
  ),
});
