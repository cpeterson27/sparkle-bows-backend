import React from "react";
import { Navigate } from "react-router-dom";
import Seo from "../components/Seo";
import { POLICIES } from "../content/policies";

export default function PolicyPage({ policyKey }) {
  const policy = POLICIES[policyKey];

  if (!policy) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="bg-[#f7f3ee]">
      <Seo
        title={policy.title}
        description={policy.description}
        type="article"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: policy.title,
          description: policy.description,
          url: `${window.location.origin}/${policy.slug}`,
        }}
      />

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-rose-500">
            Store policy
          </p>
          <h1 className="mt-4 font-serif text-5xl text-slate-950">
            {policy.title}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">
            {policy.description}
          </p>
          <p className="mt-5 text-sm font-medium text-slate-500">
            {policy.updatedLabel}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {policy.sections.map((section) => (
            <article
              key={section.heading}
              className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm"
            >
              <h2 className="font-serif text-2xl text-slate-950">
                {section.heading}
              </h2>
              <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
