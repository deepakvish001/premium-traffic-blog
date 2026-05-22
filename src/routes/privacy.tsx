import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — HomeFix Pro" },
      { name: "description", content: "How HomeFix Pro handles your data and cookies." },
      { property: "og:url", content: "/privacy" },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
  component: () => (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-4xl font-bold">Privacy Policy</h1>
      <div className="prose-article mt-6">
        <p>Last updated: {new Date().toLocaleDateString("en-US")}.</p>
        <h2>What we collect</h2>
        <p>
          We collect anonymous analytics (page views, country, device) and your email address only
          if you subscribe to our newsletter.
        </p>
        <h2>Advertising</h2>
        <p>
          We display ads served by Google AdSense. Google may use cookies to personalize ads based
          on your visits to this and other sites. You can opt out at{" "}
          <a href="https://www.google.com/settings/ads">google.com/settings/ads</a>.
        </p>
        <h2>Contact</h2>
        <p>Questions? Email hello@homefixpro.example.</p>
      </div>
    </div>
  ),
});
