import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About HomeFix Pro" },
      { name: "description", content: "About HomeFix Pro — practical DIY guides written for US homeowners." },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: () => (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-4xl font-bold">About HomeFix Pro</h1>
      <div className="prose-article mt-6">
        <p>
          HomeFix Pro publishes practical, tested home improvement guides for US homeowners.
          Every article is written to save you a trip to the contractor and money on parts you don't need.
        </p>
        <h2>What we cover</h2>
        <p>
          Plumbing fixes, basic electrical, painting techniques, flooring, kitchen and bath upgrades,
          outdoor and lawn projects, tool reviews, and smart home installations.
        </p>
        <h2>Our promise</h2>
        <p>
          We use real US brands, real US prices, and imperial units. We include a safety note any time
          a project could go wrong, and we tell you when to call a pro instead of doing it yourself.
        </p>
      </div>
    </div>
  ),
});
